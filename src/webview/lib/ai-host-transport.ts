import type { HostToWebviewMessage } from '../../shared/messages';

import { postToHost } from '@/vscode';

type PendingStream = {
  cleanup: () => void;
  controller: ReadableStreamDefaultController<Uint8Array>;
  encoder: TextEncoder;
};

const pendingByRequestId = new Map<string, PendingStream>();
let isListenerBound = false;

const requestId = () =>
  `maden_ai_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const readTextParts = (value: unknown): string[] => {
  if (typeof value === 'string') {
    return [value];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((part) => {
      if (typeof part === 'string') {
        return part;
      }
      if (!part || typeof part !== 'object') {
        return '';
      }
      const maybe = part as { text?: unknown; content?: unknown };
      if (typeof maybe.text === 'string') {
        return maybe.text;
      }
      if (typeof maybe.content === 'string') {
        return maybe.content;
      }
      return '';
    })
    .filter((part) => part.length > 0);
};

const parseRequestBody = (body: string): { selectedContext: string; userPrompt: string } => {
  try {
    const parsed = JSON.parse(body) as {
      selectedContext?: unknown;
      messages?: unknown;
    };

    const selectedContext =
      typeof parsed.selectedContext === 'string' ? parsed.selectedContext.trim() : '';
    const messages = Array.isArray(parsed.messages) ? parsed.messages : [];

    const latestUser = [...messages]
      .reverse()
      .find((message) => message && typeof message === 'object' && (message as { role?: unknown }).role === 'user') as
      | { content?: unknown; parts?: unknown }
      | undefined;

    const userPrompt = [
      ...readTextParts(latestUser?.parts),
      ...readTextParts(latestUser?.content),
    ]
      .join('\n')
      .trim();

    return {
      selectedContext,
      userPrompt,
    };
  } catch {
    return {
      selectedContext: '',
      userPrompt: '',
    };
  }
};

const buildMockText = (route: 'command' | 'copilot', body: string): string => {
  const { selectedContext, userPrompt } = parseRequestBody(body);
  const baseContext =
    selectedContext ||
    'This is a mock AI response in standalone browser mode. Connect from VS Code for real provider calls.';
  const normalizedPrompt = userPrompt.toLowerCase();

  if (route === 'copilot') {
    return `${baseContext}\n\nContinue by adding one concise sentence with the next logical step.`;
  }

  if (normalizedPrompt.includes('improve')) {
    return `${baseContext}\n\nThe text now reads more clearly and flows better while preserving the original meaning.`;
  }
  if (normalizedPrompt.includes('shorter')) {
    return `${baseContext.slice(0, 180)}...`;
  }
  if (normalizedPrompt.includes('longer')) {
    return `${baseContext}\n\nAdditional context: this section can be elaborated with supporting details, examples, and a brief conclusion.`;
  }
  if (normalizedPrompt.includes('fix spelling') || normalizedPrompt.includes('grammar')) {
    return `${baseContext}\n\n(Spelling and grammar normalized in mock mode.)`;
  }
  if (normalizedPrompt.includes('simplify')) {
    return `${baseContext}\n\nUsing simpler words and shorter sentences for easier reading.`;
  }
  if (normalizedPrompt.includes('comment')) {
    return 'Strong structure overall. Consider clarifying the main claim in the first sentence and adding one concrete example.';
  }
  if (normalizedPrompt.includes('summarize') || normalizedPrompt.includes('summary')) {
    return `${baseContext.slice(0, 200)}...`;
  }

  return `${baseContext}\n\n${userPrompt || ''}`.trim();
};

const splitForStream = (text: string): string[] => {
  const tokens = text.split(/(\s+)/).filter(Boolean);
  const chunks: string[] = [];
  let current = '';

  for (const token of tokens) {
    current += token;
    if (current.length >= 18) {
      chunks.push(current);
      current = '';
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.length > 0 ? chunks : [text];
};

const createMockAiResponse = ({
  body,
  route,
  signal,
}: {
  body: string;
  route: 'command' | 'copilot';
  signal?: AbortSignal;
}) => {
  const id = requestId();
  const text = buildMockText(route, body);
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (payload: string) => {
        controller.enqueue(encoder.encode(payload));
      };
      const onAbort = () => {
        controller.error(new Error('Mock AI request cancelled.'));
      };

      signal?.addEventListener('abort', onAbort, { once: true });

      try {
        send('data: {"type":"start"}\n\n');
        send('data: {"type":"start-step"}\n\n');
        await delay(250);
        send(
          `data: {"type":"text-start","id":"${id}","providerMetadata":{"maden":{"itemId":"${id}"}}}\n\n`
        );
        await delay(200);

        for (const chunk of splitForStream(text)) {
          if (signal?.aborted) {
            return;
          }
          send(
            `data: {"type":"text-delta","id":"${id}","delta":${JSON.stringify(chunk)}}\n\n`
          );
          await delay(120);
        }

        await delay(180);
        send(`data: {"type":"text-end","id":"${id}"}\n\n`);
        send('data: {"type":"finish-step"}\n\n');
        await delay(120);
        send('data: {"type":"finish"}\n\n');
        controller.close();
      } catch (error) {
        controller.error(error);
      } finally {
        signal?.removeEventListener('abort', onAbort);
      }
    },
  });

  return new Response(stream, {
    headers: {
      Connection: 'keep-alive',
      'Content-Type': 'text/plain',
    },
    status: 200,
  });
};

const bindListener = () => {
  if (isListenerBound) {
    return;
  }

  window.addEventListener('message', (event: MessageEvent<HostToWebviewMessage>) => {
    const message = event.data;
    if (message.type === 'aiStreamChunk') {
      const pending = pendingByRequestId.get(message.requestId);
      if (!pending) {
        return;
      }
      pending.controller.enqueue(pending.encoder.encode(message.chunk));
      return;
    }

    if (message.type === 'aiStreamEnd') {
      const pending = pendingByRequestId.get(message.requestId);
      if (!pending) {
        return;
      }
      pending.controller.close();
      pending.cleanup();
      return;
    }

    if (message.type === 'aiStreamError') {
      const pending = pendingByRequestId.get(message.requestId);
      if (!pending) {
        return;
      }
      pending.controller.error(new Error(message.message));
      pending.cleanup();
    }
  });

  isListenerBound = true;
};

export const requestHostAiStream = ({
  body,
  route,
  signal,
}: {
  body: string;
  route: 'command' | 'copilot';
  signal?: AbortSignal;
}) => {
  if (typeof window.acquireVsCodeApi !== 'function') {
    return createMockAiResponse({
      body,
      route,
      signal,
    });
  }

  bindListener();

  const id = requestId();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      const onAbort = () => {
        postToHost({
          type: 'aiRequestCancel',
          requestId: id,
        });
      };

      const cleanup = () => {
        pendingByRequestId.delete(id);
        signal?.removeEventListener('abort', onAbort);
      };

      pendingByRequestId.set(id, { cleanup, controller, encoder });
      signal?.addEventListener('abort', onAbort, { once: true });

      postToHost({
        type: 'aiRequestStart',
        body,
        requestId: id,
        route,
      });
    },
    cancel() {
      postToHost({
        type: 'aiRequestCancel',
        requestId: id,
      });
      const pending = pendingByRequestId.get(id);
      pending?.cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      Connection: 'keep-alive',
      'Content-Type': 'text/plain',
    },
    status: 200,
  });
};

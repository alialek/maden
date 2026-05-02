import { readAiTextParts } from '../../shared/ai-message-normalization';

type AiRequestLogBody = {
  messages?: unknown;
  model?: unknown;
  provider?: unknown;
  selectedContext?: unknown;
};

const readMessageText = (message: {
  content?: unknown;
  parts?: unknown;
}): string =>
  [
    ...readAiTextParts(message.parts),
    ...readAiTextParts(message.content),
  ].join('\n');

const findLatestUserMessage = (
  messages: unknown[]
): { content?: unknown; parts?: unknown } | undefined =>
  [...messages]
    .reverse()
    .find((message) => {
      if (!message || typeof message !== 'object') {
        return false;
      }
      const role = (message as { role?: unknown }).role;
      return role === 'user';
    }) as { content?: unknown; parts?: unknown } | undefined;

export const summarizeAiRequest = (body: string): string => {
  try {
    const parsed = JSON.parse(body) as AiRequestLogBody;
    const messages = Array.isArray(parsed.messages) ? parsed.messages : [];
    const lastUserMessage = findLatestUserMessage(messages);

    const userPreview = readMessageText(lastUserMessage ?? {})
      .replace(/\s+/g, ' ')
      .slice(0, 180);

    const provider = typeof parsed.provider === 'string' ? parsed.provider : 'default';
    const model = typeof parsed.model === 'string' ? parsed.model : 'default';
    const selectedContextLength =
      typeof parsed.selectedContext === 'string' ? parsed.selectedContext.length : 0;

    return `provider=${provider} model=${model} messages=${messages.length} selectedContextLen=${selectedContextLength} userPreview="${userPreview}"`;
  } catch {
    return `invalid-json bodyLen=${body.length}`;
  }
};

export const extractLatestUserContent = (body: string): string => {
  try {
    const parsed = JSON.parse(body) as { messages?: unknown };
    const messages = Array.isArray(parsed.messages) ? parsed.messages : [];
    const lastUserMessage = findLatestUserMessage(messages);
    return readMessageText(lastUserMessage ?? {}).trim();
  } catch {
    return '';
  }
};

export const formatAiRequestBody = (body: string): string => {
  try {
    const parsed = JSON.parse(body);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return body;
  }
};

export const extractTextDeltaFromSseChunk = (chunk: string): string => {
  const normalized = chunk.replace(/\r\n/g, '\n');
  const lines = normalized.split('\n');
  let text = '';

  for (const line of lines) {
    if (!line.startsWith('data: ')) {
      continue;
    }

    const payload = line.slice('data: '.length).trim();
    if (!payload || payload === '[DONE]') {
      continue;
    }

    try {
      const parsed = JSON.parse(payload) as { delta?: unknown; type?: unknown };
      if (parsed.type === 'text-delta' && typeof parsed.delta === 'string') {
        text += parsed.delta;
      }
    } catch {
      // Ignore non-JSON lines.
    }
  }

  return text;
};

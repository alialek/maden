export const createSseEnvelope = (id: string) => ({
  finish: () => `data: {"type":"finish"}\n\n`,
  finishStep: () => `data: {"type":"finish-step"}\n\n`,
  start: () => `data: {"type":"start"}\n\n`,
  startStep: () => `data: {"type":"start-step"}\n\n`,
  textDelta: (text: string) =>
    `data: {"type":"text-delta","id":"${id}","delta":${JSON.stringify(text)}}\n\n`,
  textEnd: () => `data: {"type":"text-end","id":"${id}"}\n\n`,
  textStart: () =>
    `data: {"type":"text-start","id":"${id}","providerMetadata":{"maden":{"itemId":"${id}"}}}\n\n`,
});

const trimSlash = (value: string) => value.replace(/\/+$/, '');

export const joinUrl = (base: string, suffix: string) =>
  `${trimSlash(base)}/${suffix.replace(/^\/+/, '')}`;

export const isAbortError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.name === 'AbortError' || /aborted/i.test(error.message);
};

export const toDisplayError = async (
  providerLabel: string,
  response: Response
): Promise<Error> => {
  const details = await response.text();
  const summary = details.length > 600 ? `${details.slice(0, 600)}...` : details;
  return new Error(`${providerLabel} request failed (${response.status}): ${summary}`);
};

export async function* readSseData(
  response: Response,
  abortSignal: AbortSignal
): AsyncGenerator<string> {
  if (!response.body) {
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (!abortSignal.aborted) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

      let eventBoundary = buffer.indexOf('\n\n');
      while (eventBoundary >= 0) {
        const event = buffer.slice(0, eventBoundary);
        buffer = buffer.slice(eventBoundary + 2);

        const payload = event
          .split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trim())
          .join('\n');

        if (payload) {
          yield payload;
        }

        eventBoundary = buffer.indexOf('\n\n');
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // no-op
    }
  }
}

export const readOpenAiDelta = (payload: unknown): string => {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const maybe = payload as {
    choices?: Array<{
      delta?: {
        content?: unknown;
      };
    }>;
  };

  const content = maybe.choices?.[0]?.delta?.content;
  if (typeof content === 'string') {
    return content;
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return '';
      }
      const value = item as { text?: unknown; type?: unknown };
      if (value.type === 'text' && typeof value.text === 'string') {
        return value.text;
      }
      return '';
    })
    .join('');
};

export async function* streamOpenAiLike(
  response: Response,
  abortSignal: AbortSignal
): AsyncGenerator<string> {
  for await (const data of readSseData(response, abortSignal)) {
    if (data === '[DONE]') {
      break;
    }

    try {
      const json = JSON.parse(data) as unknown;
      const delta = readOpenAiDelta(json);
      if (delta) {
        yield delta;
      }
    } catch {
      // ignore malformed chunks
    }
  }
}

export async function* streamAnthropicLike(
  response: Response,
  abortSignal: AbortSignal
): AsyncGenerator<string> {
  for await (const data of readSseData(response, abortSignal)) {
    try {
      const json = JSON.parse(data) as {
        delta?: { text?: string };
        type?: string;
      };

      if (json.type === 'content_block_delta' && json.delta?.text) {
        yield json.delta.text;
      }
    } catch {
      // ignore malformed chunks
    }
  }
}

export const splitTextForStream = (text: string): string[] => {
  if (!text) {
    return [];
  }

  const maxChunk = 80;
  const chunks: string[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const next = Math.min(cursor + maxChunk, text.length);
    chunks.push(text.slice(cursor, next));
    cursor = next;
  }

  return chunks;
};

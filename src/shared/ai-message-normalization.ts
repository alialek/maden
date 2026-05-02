export type NormalizedAiMessage = {
  content: string;
  role: 'assistant' | 'system' | 'user';
};

export const readAiTextParts = (value: unknown): string[] => {
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

      const maybePart = part as {
        content?: unknown;
        text?: unknown;
        type?: unknown;
      };
      if (typeof maybePart.text === 'string') {
        return maybePart.text;
      }
      if (maybePart.type === 'text' && typeof maybePart.content === 'string') {
        return maybePart.content;
      }
      if (typeof maybePart.content === 'string') {
        return maybePart.content;
      }

      return '';
    })
    .filter((part) => part.length > 0);
};

export const extractMarkdownFromPotentialJson = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return trimmed;
  }

  try {
    const parsed = JSON.parse(trimmed) as
      | {
          input?: unknown;
          messages?: unknown;
          prompt?: unknown;
          selectedContext?: unknown;
          userPrompt?: unknown;
        }
      | unknown[];

    if (Array.isArray(parsed)) {
      return trimmed;
    }

    if (typeof parsed.selectedContext === 'string' && parsed.selectedContext.trim()) {
      return parsed.selectedContext.trim();
    }
    if (typeof parsed.userPrompt === 'string' && parsed.userPrompt.trim()) {
      return parsed.userPrompt.trim();
    }
    if (typeof parsed.input === 'string' && parsed.input.trim()) {
      return parsed.input.trim();
    }
    if (typeof parsed.prompt === 'string' && parsed.prompt.trim()) {
      return parsed.prompt.trim();
    }

    if (Array.isArray(parsed.messages)) {
      const nested = normalizeAiMessages(parsed.messages);
      const latestUser = [...nested].reverse().find((message) => message.role === 'user');
      if (latestUser?.content) {
        return latestUser.content;
      }
    }
  } catch {
    // Keep original text if payload is not JSON.
  }

  return trimmed;
};

export const normalizeAiMessages = (messages: unknown): NormalizedAiMessage[] => {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const message = entry as {
        content?: unknown;
        parts?: unknown;
        role?: unknown;
      };

      const role = message.role;
      if (role !== 'assistant' && role !== 'system' && role !== 'user') {
        return null;
      }

      const text = [
        ...readAiTextParts(message.parts),
        ...readAiTextParts(message.content),
      ]
        .join('\n')
        .trim();

      if (!text) {
        return null;
      }

      const normalizedText = extractMarkdownFromPotentialJson(text);
      if (!normalizedText) {
        return null;
      }

      return {
        content: normalizedText,
        role,
      } satisfies NormalizedAiMessage;
    })
    .filter((value): value is NormalizedAiMessage => value !== null);
};

export const pickLatestUserMessage = (
  messages: NormalizedAiMessage[]
): NormalizedAiMessage[] => {
  const latestUser = [...messages].reverse().find((message) => message.role === 'user');
  return latestUser ? [latestUser] : messages.slice(-1);
};

export const extractAiMessageText = (message: {
  content?: unknown;
  parts?: unknown;
}): string => {
  const content = [
    ...readAiTextParts(message.parts),
    ...readAiTextParts(message.content),
  ]
    .join('\n')
    .trim();

  return content ? extractMarkdownFromPotentialJson(content) : '';
};

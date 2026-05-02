import { DefaultChatTransport } from 'ai';

import {
  normalizeAiMessages,
  pickLatestUserMessage,
} from '../../shared/ai-message-normalization';
import { requestHostAiStream } from '@/lib/ai-host-transport';

export const createAiCommandTransport = (
  getBodyOptions: () => Record<string, unknown> | undefined
) =>
  new DefaultChatTransport({
    api: '/api/ai/command',
    fetch: (async (_input, init) => {
      const rawBody = typeof init?.body === 'string' ? init.body : '{}';
      const initBody = JSON.parse(rawBody) as Record<string, unknown>;
      const merged = {
        ...initBody,
        ...(getBodyOptions() ?? {}),
      };
      const compactMessages = pickLatestUserMessage(
        normalizeAiMessages(merged.messages)
      );

      const body = {
        apiKey: typeof merged.apiKey === 'string' ? merged.apiKey : undefined,
        baseUrl: typeof merged.baseUrl === 'string' ? merged.baseUrl : undefined,
        enabled: typeof merged.enabled === 'boolean' ? merged.enabled : undefined,
        gigachatClientId:
          typeof merged.gigachatClientId === 'string'
            ? merged.gigachatClientId
            : undefined,
        gigachatClientSecret:
          typeof merged.gigachatClientSecret === 'string'
            ? merged.gigachatClientSecret
            : undefined,
        gigachatMode:
          merged.gigachatMode === 'native' || merged.gigachatMode === 'openaiCompatible'
            ? merged.gigachatMode
            : undefined,
        gigachatScope:
          typeof merged.gigachatScope === 'string' ? merged.gigachatScope : undefined,
        maxTokens:
          typeof merged.maxTokens === 'number' && Number.isFinite(merged.maxTokens)
            ? merged.maxTokens
            : undefined,
        messages: compactMessages,
        model: typeof merged.model === 'string' ? merged.model : undefined,
        provider: typeof merged.provider === 'string' ? merged.provider : undefined,
        selectedContext:
          typeof merged.selectedContext === 'string'
            ? merged.selectedContext
            : undefined,
        temperature:
          typeof merged.temperature === 'number' && Number.isFinite(merged.temperature)
            ? merged.temperature
            : undefined,
      };

      return requestHostAiStream({
        body: JSON.stringify(body),
        route: 'command',
        signal: init?.signal ?? undefined,
      });
    }) as typeof fetch,
  });

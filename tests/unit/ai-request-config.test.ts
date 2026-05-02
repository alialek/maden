import { describe, expect, it } from 'vitest';

import {
  parseRequestBody,
  resolveRequestConfig,
} from '../../src/extension/services/ai/request-config';
import type { StoredAiSettings } from '../../src/extension/services/ai/types';

describe('AI request config', () => {
  it('keeps enabled state from stored settings, not request body overrides', () => {
    const { messages, overrides } = parseRequestBody(
      JSON.stringify({
        enabled: true,
        messages: [{ role: 'user', content: 'hello' }],
        model: 'gpt-4o-mini',
      })
    );
    const settings: StoredAiSettings = {
      baseUrl: '',
      enabled: false,
      gigachatMode: 'native',
      model: '',
      provider: 'openai',
    };

    const config = resolveRequestConfig(settings, 'command', messages, overrides);

    expect(config.enabled).toBe(false);
  });
});

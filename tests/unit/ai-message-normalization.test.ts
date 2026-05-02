import { describe, expect, it } from 'vitest';

import {
  extractAiMessageText,
  normalizeAiMessages,
  pickLatestUserMessage,
} from '../../src/shared/ai-message-normalization';

describe('AI message normalization', () => {
  it('normalizes text from parts and content arrays', () => {
    expect(
      normalizeAiMessages([
        {
          role: 'system',
          content: [{ type: 'text', content: 'Use markdown.' }],
        },
        {
          role: 'user',
          parts: [{ type: 'text', text: 'Rewrite this.' }],
        },
      ])
    ).toEqual([
      {
        role: 'system',
        content: 'Use markdown.',
      },
      {
        role: 'user',
        content: 'Rewrite this.',
      },
    ]);
  });

  it('extracts markdown from nested JSON message payloads', () => {
    const message = {
      role: 'user',
      content: JSON.stringify({
        selectedContext: '<target-text>Only this</target-text>',
      }),
    };

    expect(normalizeAiMessages([message])[0].content).toBe(
      '<target-text>Only this</target-text>'
    );
    expect(extractAiMessageText(message)).toBe(
      '<target-text>Only this</target-text>'
    );
  });

  it('keeps only the latest user message for compact command requests', () => {
    const messages = normalizeAiMessages([
      { role: 'user', content: 'first' },
      { role: 'assistant', content: 'ok' },
      { role: 'user', content: 'second' },
    ]);

    expect(pickLatestUserMessage(messages)).toEqual([
      {
        role: 'user',
        content: 'second',
      },
    ]);
  });
});

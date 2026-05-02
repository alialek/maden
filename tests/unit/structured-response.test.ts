import { describe, expect, it } from 'vitest';

import {
  parseStructuredResponse,
  stripStructuredResponseWrappers,
} from '../../src/webview/lib/structured-response';

describe('structured maden response', () => {
  it('parses closed inline response wrappers', () => {
    const parsed = parseStructuredResponse(
      '<maden-response action="inline">Replacement text</maden-response>'
    );

    expect(parsed).toEqual({
      action: 'inline',
      content: 'Replacement text',
      isClosed: true,
      isStructured: true,
    });
  });

  it('preserves add action while trimming partial streaming close tag', () => {
    const parsed = parseStructuredResponse(
      '<maden-response action="add">New paragraph</maden-res'
    );

    expect(parsed).toMatchObject({
      action: 'add',
      content: 'New paragraph',
      isClosed: false,
      isStructured: true,
    });
  });

  it('strips full and partial wrappers from streamed content', () => {
    expect(
      stripStructuredResponseWrappers(
        '<maden-response action="comment">Looks good</maden-res'
      )
    ).toBe('Looks good');
  });
});

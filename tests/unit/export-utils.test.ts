import { describe, expect, it } from 'vitest';

import { blobToBase64, sanitizePdfText } from '../../src/webview/lib/export-utils';

describe('export utilities', () => {
  it('sanitizes unsupported PDF characters', () => {
    const value = `A\u200BB\u{1F600}`;

    expect(sanitizePdfText(value)).toBe('AB');
  });

  it('base64 encodes blob content', async () => {
    const blob = new Blob(['hello']);

    expect(await blobToBase64(blob)).toBe('aGVsbG8=');
  });
});

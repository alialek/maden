import { describe, expect, it } from 'vitest';

import { enforceTitleHeading } from '../../src/extension/markdownUtils';

describe('enforceTitleHeading', () => {
  it('prepends heading when first line is not a heading', () => {
    const result = enforceTitleHeading('hello\nworld', '/tmp/my-note.md');

    expect(result).toBe('# my-note\nhello\nworld');
  });

  it('replaces the first heading when it differs from file name', () => {
    const result = enforceTitleHeading('# Old title\n\ncontent', '/tmp/new-title.md');

    expect(result).toBe('# new-title\n\ncontent');
  });

  it('keeps markdown unchanged when heading already matches file name', () => {
    const original = '# exact-name\n\ncontent';
    const result = enforceTitleHeading(original, '/tmp/exact-name.md');

    expect(result).toBe(original);
  });
});

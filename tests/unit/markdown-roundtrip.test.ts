import { describe, expect, it } from 'vitest';

import { deserializeMd, serializeMd, MarkdownPlugin } from '@platejs/markdown';
import { createPlateEditor } from 'platejs/react';

describe('@platejs/markdown roundtrip', () => {
  it('deserializes and serializes common markdown blocks', () => {
    const editor = createPlateEditor({
      plugins: [MarkdownPlugin],
      value: [
        {
          children: [{ text: '' }],
          type: 'p',
        },
      ],
    });

    const source = '# title\n\nparagraph\n\n`code`';
    const value = deserializeMd(editor, source);
    const markdown = serializeMd(editor, { value });

    expect(markdown).toContain('# title');
    expect(markdown).toContain('paragraph');
    expect(markdown).toContain('`code`');
  });

  it('normalizes unsupported structures into serializable output', () => {
    const editor = createPlateEditor({
      plugins: [MarkdownPlugin],
      value: [
        {
          children: [{ text: '' }],
          type: 'p',
        },
      ],
    });

    const source = '# title\n\n<details><summary>x</summary>y</details>';
    const value = deserializeMd(editor, source);
    const markdown = serializeMd(editor, { value });

    expect(markdown.length).toBeGreaterThan(0);
    expect(markdown).toContain('# title');
  });
});

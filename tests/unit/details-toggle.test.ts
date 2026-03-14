import { describe, expect, it } from 'vitest';
import type { Value } from 'platejs';

import {
  materializeDetailsSections,
  serializeDetailsSections,
  splitMarkdownByDetails,
} from '../../src/webview/lib/details-toggle';

describe('details toggle conversion', () => {
  it('splits markdown and details sections', () => {
    const source = `# Title\n\n<details>\n<summary><b>General Styles (49)</b></summary>\n\n| # | Style | Best For |\n|---|-------|----------|\n</details>\n\nAfter`;

    const sections = splitMarkdownByDetails(source);

    expect(sections).toHaveLength(3);
    expect(sections[0]).toMatchObject({ type: 'markdown' });
    expect(sections[1]).toMatchObject({
      type: 'details',
      summary: 'General Styles (49)',
    });
    expect((sections[1] as { body: string }).body).toContain('| # | Style | Best For |');
    expect(sections[2]).toMatchObject({ type: 'markdown' });
  });

  it('materializes a details section into a toggle with indented body nodes', () => {
    const sections = [
      { type: 'markdown', content: 'Before' },
      { type: 'details', summary: 'General Styles (49)', body: 'row 1\n\nrow 2' },
      { type: 'markdown', content: 'After' },
    ] as const;

    const parseMarkdown = (markdown: string): Value => [
      { type: 'p', children: [{ text: markdown }] },
    ];

    const output = materializeDetailsSections(
      sections as unknown as Parameters<typeof materializeDetailsSections>[0],
      parseMarkdown
    ) as Array<{ type: string; indent?: number; children: Array<{ text: string }> }>;

    expect(output[0].type).toBe('p');
    expect(output[1].type).toBe('toggle');
    expect(output[1].children[0].text).toBe('General Styles (49)');
    expect(output[2].type).toBe('p');
    expect(output[2].indent).toBe(1);
    expect(output[3].type).toBe('p');
  });

  it('serializes toggle + indented nodes back to details/summary markdown', () => {
    const value: Value = [
      { type: 'p', children: [{ text: 'Before' }] },
      { type: 'toggle', children: [{ text: 'General Styles (49)' }] },
      { type: 'p', indent: 1, children: [{ text: 'Row 1' }] },
      { type: 'p', indent: 1, children: [{ text: 'Row 2' }] },
      { type: 'p', children: [{ text: 'After' }] },
    ];

    const serialized = serializeDetailsSections(value, (nodes) =>
      nodes
        .map((node) =>
          ((node as { children?: Array<{ text?: string }> }).children ?? [])
            .map((child) => child.text ?? '')
            .join('')
        )
        .join('\n\n')
    );

    expect(serialized).toContain('<details>');
    expect(serialized).toContain('<summary>General Styles (49)</summary>');
    expect(serialized).toContain('Row 1');
    expect(serialized).toContain('Row 2');
    expect(serialized).toContain('</details>');
    expect(serialized).toContain('After');
  });
});

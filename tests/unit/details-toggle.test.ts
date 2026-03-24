import { describe, expect, it, vi } from 'vitest';
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

  it('sanitizes malformed parsed nodes without children', () => {
    const sections = [{ type: 'markdown', content: 'ignored' }] as const;
    const parseMarkdown = (): Value =>
      [
        { text: 'top-level text' },
        { type: 'p', children: [{ text: 'ok' }] },
        { type: 'blockquote' },
      ] as any;

    const output = materializeDetailsSections(
      sections as unknown as Parameters<typeof materializeDetailsSections>[0],
      parseMarkdown
    ) as Array<{ type: string; children?: unknown[] }>;

    expect(output).toHaveLength(3);
    expect(output[0].type).toBe('p');
    expect(Array.isArray(output[0].children)).toBe(true);
    expect(output[1].type).toBe('p');
    expect(Array.isArray(output[1].children)).toBe(true);
    expect(output[2].type).toBe('blockquote');
    expect(Array.isArray(output[2].children)).toBe(true);
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

  it('serializes contiguous non-toggle nodes in one markdown pass', () => {
    const value: Value = [
      { type: 'li', children: [{ text: 'One' }] } as any,
      { type: 'li', children: [{ text: 'Two' }] } as any,
      { type: 'li', children: [{ text: 'Three' }] } as any,
    ];

    const serializeMarkdown = vi.fn((nodes: Value) =>
      nodes
        .map((node, index) => {
          const text = ((node as { children?: Array<{ text?: string }> }).children ?? [])
            .map((child) => child.text ?? '')
            .join('');
          return `${index + 1}. ${text}`;
        })
        .join('\n')
    );

    const serialized = serializeDetailsSections(value, serializeMarkdown);

    expect(serializeMarkdown).toHaveBeenCalledTimes(1);
    expect(serialized).toBe('1. One\n2. Two\n3. Three\n');
  });
});

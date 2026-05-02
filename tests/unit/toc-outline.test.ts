import { describe, expect, it } from 'vitest';

import type { Heading } from '@platejs/toc';

import { buildTocTree } from '../../src/webview/lib/toc-outline';

const heading = (id: string, depth: number, title: string): Heading => ({
  id,
  depth,
  path: [0],
  title,
  type: `h${depth}`,
});

describe('TOC outline tree', () => {
  it('excludes the document title and nests headings by nearest shallower heading', () => {
    const tree = buildTocTree([
      heading('title', 1, 'Document Title'),
      heading('a', 2, 'A'),
      heading('b', 3, 'B'),
      heading('c', 2, 'C'),
      heading('d', 4, 'D'),
    ]);

    expect(tree.map((item) => item.title)).toEqual(['A', 'C']);
    expect(tree[0].children.map((item) => item.title)).toEqual(['B']);
    expect(tree[1].children.map((item) => item.title)).toEqual(['D']);
    expect(tree[0].fragmentId).toBe('a');
  });

  it('keeps the first heading when it is not a document title', () => {
    const tree = buildTocTree([
      heading('a', 2, 'A'),
      heading('b', 3, 'B'),
    ]);

    expect(tree.map((item) => item.title)).toEqual(['A']);
    expect(tree[0].children.map((item) => item.title)).toEqual(['B']);
  });
});

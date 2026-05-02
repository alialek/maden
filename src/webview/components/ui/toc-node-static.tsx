import * as React from 'react';

import type { SlateElementProps } from 'platejs/static';

import { type Heading, BaseTocPlugin, isHeading } from '@platejs/toc';
import { cva } from 'class-variance-authority';
import { type SlateEditor, type TElement, NodeApi } from 'platejs';
import { SlateElement } from 'platejs/static';

import { Button } from '@/components/ui/button';
import { buildTocTree, type TocTreeItem } from '@/lib/toc-outline';

const headingItemVariants = cva(
  'block h-auto w-full cursor-pointer truncate rounded-none px-0.5 py-1.5 text-left font-medium text-muted-foreground underline decoration-[0.5px] underline-offset-4 hover:bg-accent hover:text-muted-foreground'
);

function TocHeadingItemStatic({ item }: { item: TocTreeItem }) {
  return (
    <li>
      <Button
        asChild
        variant="ghost"
        className={headingItemVariants()}
        style={{ paddingLeft: `${Math.max(0, item.depth - 1) * 24 + 2}px` }}
      >
        <a href={`#${item.fragmentId}`}>{item.title}</a>
      </Button>
      {item.children.length > 0 && (
        <ol className="m-0 list-none p-0">
          {item.children.map((child) => (
            <TocHeadingItemStatic key={child.id} item={child} />
          ))}
        </ol>
      )}
    </li>
  );
}

export function TocElementStatic(props: SlateElementProps) {
  const { editor } = props;
  const headingList = getHeadingList(editor);
  const headingTree = buildTocTree(headingList);

  return (
    <SlateElement {...props} className="mb-1 p-0">
      <div>
        {headingTree.length > 0 ? (
          <ol className="m-0 list-none p-0">
            {headingTree.map((item) => (
              <TocHeadingItemStatic key={item.id} item={item} />
            ))}
          </ol>
        ) : (
          <div className="text-gray-500 text-sm">
            Create a heading to display the document outline.
          </div>
        )}
      </div>
      {props.children}
    </SlateElement>
  );
}

const headingDepth: Record<string, number> = {
  h1: 1,
  h2: 2,
  h3: 3,
  h4: 4,
  h5: 5,
  h6: 6,
};

const getHeadingList = (editor?: SlateEditor) => {
  if (!editor) return [];

  const options = editor.getOptions(BaseTocPlugin);

  if (options.queryHeading) {
    return options.queryHeading(editor);
  }

  const headingList: Heading[] = [];

  const values = editor.api.nodes<TElement>({
    at: [],
    match: (n) => isHeading(n),
  });

  if (!values) return [];

  Array.from(values).forEach(([node, path]) => {
    const { type } = node;
    const title = NodeApi.string(node);
    const depth = headingDepth[type];
    const id = node.id as string;

    if (title) {
      headingList.push({ id, depth, path, title, type });
    }
  });

  return headingList;
};

/**
 * DOCX-compatible TOC component.
 * Renders TOC items as anchor links for proper Word internal navigation.
 */
export function TocElementDocx(props: SlateElementProps) {
  const { editor } = props;
  const headingList = getHeadingList(editor);

  const depthIndent: Record<number, string> = {
    1: '0',
    2: '24pt',
    3: '48pt',
  };

  return (
    <SlateElement {...props}>
      <div
        style={{
          marginBottom: '12pt',
          padding: '8pt 0',
        }}
      >
        {headingList.length > 0 ? (
          headingList.map((item) => (
            <p
              key={item.id}
              style={{
                margin: '4pt 0',
                paddingLeft: depthIndent[item.depth] || '0',
              }}
            >
              <a
                href={`#${item.id}`}
                style={{
                  color: '#0066cc',
                  textDecoration: 'underline',
                }}
              >
                {item.title}
              </a>
            </p>
          ))
        ) : (
          <p style={{ color: '#666', fontSize: '10pt' }}>
            Create a heading to display the document outline.
          </p>
        )}
      </div>
      {props.children}
    </SlateElement>
  );
}

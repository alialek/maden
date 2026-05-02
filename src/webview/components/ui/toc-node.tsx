'use client';

import * as React from 'react';

import type { PlateElementProps } from 'platejs/react';

import { useTocElement, useTocElementState } from '@platejs/toc/react';
import { cva } from 'class-variance-authority';
import { PlateElement } from 'platejs/react';

import { Button } from '@/components/ui/button';
import { buildTocTree, type TocTreeItem } from '@/lib/toc-outline';

const headingItemVariants = cva(
  'block h-auto w-full cursor-pointer truncate rounded-none px-0.5 py-1.5 text-left font-medium text-muted-foreground underline decoration-[0.5px] underline-offset-4 hover:bg-accent hover:text-muted-foreground'
);

function TocHeadingItem({
  item,
  onItemClick,
}: {
  item: TocTreeItem;
  onItemClick: (event: React.MouseEvent<HTMLAnchorElement>, item: TocTreeItem) => void;
}) {
  return (
    <li>
      <Button
        asChild
        variant="ghost"
        className={headingItemVariants()}
        style={{ paddingLeft: `${Math.max(0, item.depth - 1) * 24 + 2}px` }}
      >
        <a
          href={`#${item.fragmentId}`}
          onClick={(e) => onItemClick(e, item)}
          aria-current
        >
          {item.title}
        </a>
      </Button>
      {item.children.length > 0 && (
        <ol className="m-0 list-none p-0">
          {item.children.map((child) => (
            <TocHeadingItem
              key={child.id}
              item={child}
              onItemClick={onItemClick}
            />
          ))}
        </ol>
      )}
    </li>
  );
}

export function TocElement(props: PlateElementProps) {
  const state = useTocElementState();
  const { props: btnProps } = useTocElement(state);
  const { headingList } = state;
  const headingTree = React.useMemo(
    () => buildTocTree(headingList),
    [headingList]
  );

  return (
    <PlateElement {...props} className="mb-1 p-0">
      <div contentEditable={false}>
        {headingTree.length > 0 ? (
          <ol className="m-0 list-none p-0">
            {headingTree.map((item) => (
              <TocHeadingItem
                key={item.id}
                item={item}
                onItemClick={(event, heading) =>
                  btnProps.onClick(event, heading, 'smooth')
                }
              />
            ))}
          </ol>
        ) : (
          <div className="text-gray-500 text-sm">
            Create a heading to display the document outline.
          </div>
        )}
      </div>
      {props.children}
    </PlateElement>
  );
}

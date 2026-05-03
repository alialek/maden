'use client';

import * as React from 'react';

import type { TElement } from 'platejs';

import {
  CheckIcon,
  ChevronRightIcon,
  Code2,
  Columns3Icon,
  FileCodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  ListIcon,
  ListOrderedIcon,
  PilcrowIcon,
  QuoteIcon,
  SquareIcon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorRef, useSelectionFragmentProp } from 'platejs/react';

import {
  Popover,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Popover as PopoverPrimitive } from 'radix-ui';
import {
  getBlockType,
  setBlockType,
} from '@/components/editor/transforms';
import { cn } from '@/lib/utils';
import { withPortalPlacementGuard } from '@/components/ui/portal-placement';

import { ToolbarButton } from './toolbar';

const TurnIntoPopoverContent = withPortalPlacementGuard<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(PopoverPrimitive.Content);

export const turnIntoItems = [
  {
    icon: <PilcrowIcon />,
    keywords: ['paragraph'],
    label: 'Text',
    value: KEYS.p,
  },
  {
    icon: <Heading1Icon />,
    keywords: ['title', 'h1'],
    label: 'Heading 1',
    value: 'h1',
  },
  {
    icon: <Heading2Icon />,
    keywords: ['subtitle', 'h2'],
    label: 'Heading 2',
    value: 'h2',
  },
  {
    icon: <Heading3Icon />,
    keywords: ['subtitle', 'h3'],
    label: 'Heading 3',
    value: 'h3',
  },
  {
    icon: <Heading4Icon />,
    keywords: ['subtitle', 'h4'],
    label: 'Heading 4',
    value: 'h4',
  },
  {
    icon: <Heading5Icon />,
    keywords: ['subtitle', 'h5'],
    label: 'Heading 5',
    value: 'h5',
  },
  {
    icon: <Heading6Icon />,
    keywords: ['subtitle', 'h6'],
    label: 'Heading 6',
    value: 'h6',
  },
  {
    icon: <ListIcon />,
    keywords: ['unordered', 'ul', '-'],
    label: 'Bulleted list',
    value: KEYS.ul,
  },
  {
    icon: <ListOrderedIcon />,
    keywords: ['ordered', 'ol', '1'],
    label: 'Numbered list',
    value: KEYS.ol,
  },
  {
    icon: <SquareIcon />,
    keywords: ['checklist', 'task', 'checkbox', '[]'],
    label: 'To-do list',
    value: KEYS.listTodo,
  },
  {
    icon: <ChevronRightIcon />,
    keywords: ['collapsible', 'expandable'],
    label: 'Toggle list',
    value: KEYS.toggle,
  },
  {
    icon: <FileCodeIcon />,
    keywords: ['```'],
    label: 'Code',
    value: KEYS.codeBlock,
  },
  {
    icon: <Code2 />,
    keywords: [
      'code-drawing',
      'diagram',
      'plantuml',
      'graphviz',
      'flowchart',
      'mermaid',
    ],
    label: 'Code Drawing',
    value: KEYS.codeDrawing,
  },
  {
    icon: <QuoteIcon />,
    keywords: ['citation', 'blockquote', '>'],
    label: 'Quote',
    value: KEYS.blockquote,
  },
  {
    icon: <Columns3Icon />,
    label: '3 columns',
    value: 'action_three_columns',
  },
];

export function TurnIntoToolbarButton(
  props: Omit<React.ComponentProps<typeof Popover>, 'open' | 'onOpenChange'>
) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  const value = useSelectionFragmentProp({
    defaultValue: KEYS.p,
    getProp: (node) => getBlockType(node as TElement),
  });
  const selectedItem = React.useMemo(
    () =>
      turnIntoItems.find((item) => item.value === (value ?? KEYS.p)) ??
      turnIntoItems[0],
    [value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false} {...props}>
      <PopoverTrigger asChild>
        <ToolbarButton
          className="min-w-[125px]"
          pressed={open}
          tooltip={open ? undefined : 'Turn into'}
          isDropdown
        >
          {selectedItem.label}
        </ToolbarButton>
      </PopoverTrigger>

      <PopoverPrimitive.Portal>
      <TurnIntoPopoverContent
        className="ignore-click-outside/toolbar z-[110]"
        data-slot="popover-content"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          editor.tf.focus();
        }}
        align="start"
      >
        <div
          className="rounded-xl border border-border/70 bg-popover p-1 text-popover-foreground shadow-xl shadow-black/20"
          role="menu"
          aria-label="Turn into"
        >
          <div className="select-none px-1.5 py-1 font-semibold text-muted-foreground text-xs">
            Turn into
          </div>
          {turnIntoItems.map(({ icon, label, value: itemValue }) => (
            <button
              key={itemValue}
              type="button"
              role="menuitemradio"
              data-slot="popover-menu-item"
              aria-checked={itemValue === value}
              className={cn(
                "relative flex min-w-[180px] w-full cursor-pointer items-center gap-1.5 rounded-md py-1 pr-8 pl-2 text-left text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
              )}
              onClick={() => {
                setBlockType(editor, itemValue);
                setOpen(false);
              }}
            >
              <span className="pointer-events-none absolute right-2 flex size-3.5 items-center justify-center">
                {itemValue === value && <CheckIcon />}
              </span>
              {icon}
              {label}
            </button>
          ))}
        </div>
      </TurnIntoPopoverContent>
      </PopoverPrimitive.Portal>
    </Popover>
  );
}

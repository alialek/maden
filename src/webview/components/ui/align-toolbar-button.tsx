'use client';

import * as React from 'react';

import type { Alignment } from '@platejs/basic-styles';
import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import { TextAlignPlugin } from '@platejs/basic-styles/react';
import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
} from 'lucide-react';
import { useEditorPlugin, useSelectionFragmentProp } from 'platejs/react';

import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { ToolbarDropdown } from '@/components/ui/toolbar-dropdown';

import { ToolbarButton } from './toolbar';

const items = [
  {
    icon: AlignLeftIcon,
    value: 'left',
  },
  {
    icon: AlignCenterIcon,
    value: 'center',
  },
  {
    icon: AlignRightIcon,
    value: 'right',
  },
  {
    icon: AlignJustifyIcon,
    value: 'justify',
  },
];

export function AlignToolbarButton(props: DropdownMenuProps) {
  const { editor, tf } = useEditorPlugin(TextAlignPlugin);
  const value =
    useSelectionFragmentProp({
      defaultValue: 'start',
      getProp: (node) => node.align,
    }) ?? 'left';

  const IconValue =
    items.find((item) => item.value === value)?.icon ?? AlignLeftIcon;

  return (
    <ToolbarDropdown
      contentClassName="min-w-0"
      trigger={(open) => (
        <ToolbarButton pressed={open} tooltip="Align" isDropdown>
          <IconValue />
        </ToolbarButton>
      )}
      renderContent={() => (
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(value) => {
            tf.textAlign.setNodes(value as Alignment);
            editor.tf.focus();
          }}
        >
          {items.map(({ icon: Icon, value: itemValue }) => (
            <DropdownMenuRadioItem
              key={itemValue}
              className="pl-2 data-[state=checked]:bg-accent *:first:[span]:hidden"
              value={itemValue}
            >
              <Icon />
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      )}
      {...props}
    />
  );
}

'use client';

import * as React from 'react';

import type { DropdownMenuProps } from '@radix-ui/react-dropdown-menu';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ToolbarDropdownRender = (ctx: {
  close: () => void;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => React.ReactNode;

type ToolbarDropdownProps = Omit<DropdownMenuProps, 'open' | 'onOpenChange'> & {
  align?: React.ComponentProps<typeof DropdownMenuContent>['align'];
  alignOffset?: React.ComponentProps<typeof DropdownMenuContent>['alignOffset'];
  contentClassName?: string;
  renderContent: ToolbarDropdownRender;
  trigger: (open: boolean) => React.ReactNode;
};

export function ToolbarDropdown({
  align = 'start',
  alignOffset,
  contentClassName,
  renderContent,
  trigger,
  ...props
}: ToolbarDropdownProps) {
  const [open, setOpen] = React.useState(false);

  const close = React.useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>{trigger(open)}</DropdownMenuTrigger>

      <DropdownMenuContent align={align} alignOffset={alignOffset} className={contentClassName}>
        {renderContent({ close, open, setOpen })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

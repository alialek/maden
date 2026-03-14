'use client';

import { cn } from '@/lib/utils';

import { Toolbar } from './toolbar';

export function FixedToolbar(props: React.ComponentProps<typeof Toolbar>) {
  return (
    <Toolbar
      {...props}
      className={cn(
        'maden-fixed-toolbar scrollbar-hide fixed top-0 left-0 right-0 z-50 w-full justify-between overflow-hidden rounded-t-lg border-b border-b-border bg-background/95 p-1 backdrop-blur-sm supports-backdrop-blur:bg-background/60',
        props.className
      )}
    />
  );
}

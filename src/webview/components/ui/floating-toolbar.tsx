'use client';

import * as React from 'react';

import { KEYS } from 'platejs';
import { useEditorId, useEventEditorValue, usePluginOption } from 'platejs/react';

import { cn } from '@/lib/utils';

import { Toolbar } from './toolbar';

type FloatingPosition = {
  centerX: number;
  top: number;
};

function getSelectionRect(editorElement: Element | null): DOMRect | null {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const anchorNode = selection.anchorNode;
  const focusNode = selection.focusNode;

  if (!anchorNode || !focusNode) {
    return null;
  }

  if (
    editorElement &&
    (!editorElement.contains(anchorNode) || !editorElement.contains(focusNode))
  ) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  if (rect.width === 0 && rect.height === 0) {
    return null;
  }

  return rect;
}

export function FloatingToolbar({
  children,
  className,
  ...props
}: React.ComponentProps<typeof Toolbar>) {
  const editorId = useEditorId();
  const focusedEditorId = useEventEditorValue('focus');
  const isFloatingLinkOpen = !!usePluginOption({ key: KEYS.link }, 'mode');
  const [position, setPosition] = React.useState<FloatingPosition | null>(null);
  const toolbarRef = React.useRef<HTMLDivElement | null>(null);

  React.useLayoutEffect(() => {
    const editorElement = document.querySelector('[data-slate-editor]');
    const isInteractingWithFloatingToolbar = () => {
      const toolbarElement = toolbarRef.current;
      const activeElement = document.activeElement;
      const openMenu = document.querySelector(
        '[data-slot="dropdown-menu-content"]'
      );

      if (!toolbarElement) return !!openMenu;

      if (activeElement && toolbarElement.contains(activeElement)) {
        return true;
      }

      if (openMenu && activeElement && openMenu.contains(activeElement)) {
        return true;
      }

      return !!openMenu;
    };

    const updatePosition = () => {
      const isInteracting = isInteractingWithFloatingToolbar();

      if ((editorId !== focusedEditorId || isFloatingLinkOpen) && !isInteracting) {
        setPosition(null);
        return;
      }

      const rect = getSelectionRect(editorElement);

      if (!rect) {
        if (!isInteracting) {
          setPosition(null);
        }
        return;
      }

      const viewportWidth = window.innerWidth;
      const centerX = Math.min(
        Math.max(rect.left + rect.width / 2, 12),
        Math.max(12, viewportWidth - 12)
      );
      const top = Math.max(12, rect.top - 12);

      setPosition({ centerX, top });
    };

    updatePosition();

    document.addEventListener('selectionchange', updatePosition);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      document.removeEventListener('selectionchange', updatePosition);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [editorId, focusedEditorId, isFloatingLinkOpen]);

  if (!position) {
    return null;
  }

  return (
    <Toolbar
      {...props}
      ref={toolbarRef}
      className={cn(
        'scrollbar-hide fixed z-50 overflow-x-auto whitespace-nowrap rounded-md border bg-popover p-1 opacity-100 print:hidden',
        'max-w-[80vw]',
        className
      )}
      style={{
        left: `${position.centerX}px`,
        top: `${position.top}px`,
        transform: 'translate(-50%, calc(-100% - 12px))',
      }}
    >
      {children}
    </Toolbar>
  );
}

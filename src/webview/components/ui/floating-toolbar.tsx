'use client';

import * as React from 'react';

import { KEYS } from 'platejs';
import { useEditorId, useEventEditorValue, usePluginOption } from 'platejs/react';

import { cn } from '@/lib/utils';

import { Toolbar } from './toolbar';

type FloatingPosition = {
  left: number;
  top: number;
};

const VIEWPORT_PADDING = 12;

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
  onMouseDownCapture,
  onPointerDownCapture,
  ...props
}: React.ComponentProps<typeof Toolbar>) {
  const editorId = useEditorId();
  const focusedEditorId = useEventEditorValue('focus');
  const isFloatingLinkOpen = !!usePluginOption({ key: KEYS.link }, 'mode');
  const [position, setPosition] = React.useState<FloatingPosition | null>(null);
  const toolbarRef = React.useRef<HTMLDivElement | null>(null);
  const isPointerInteractingRef = React.useRef(false);
  const pointerInteractionTimeoutRef = React.useRef<number | null>(null);

  const markPointerInteraction = React.useCallback(() => {
    isPointerInteractingRef.current = true;

    if (pointerInteractionTimeoutRef.current !== null) {
      window.clearTimeout(pointerInteractionTimeoutRef.current);
    }

    pointerInteractionTimeoutRef.current = window.setTimeout(() => {
      isPointerInteractingRef.current = false;
      pointerInteractionTimeoutRef.current = null;
    }, 300);
  }, []);

  React.useEffect(() => {
    return () => {
      if (pointerInteractionTimeoutRef.current !== null) {
        window.clearTimeout(pointerInteractionTimeoutRef.current);
      }
    };
  }, []);

  React.useLayoutEffect(() => {
    const editorElement = document.querySelector('[data-slate-editor]');
    const isInteractingWithFloatingToolbar = () => {
      const toolbarElement = toolbarRef.current;
      const activeElement = document.activeElement;
      const openMenu = document.querySelector(
        '[data-slot="dropdown-menu-content"], [data-slot="popover-content"], [data-radix-popper-content-wrapper]'
      );

      if (isPointerInteractingRef.current) return true;
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
      const toolbarWidth =
        toolbarRef.current?.getBoundingClientRect().width ??
        Math.min(560, viewportWidth * 0.8);
      const preferredLeft = rect.left + rect.width / 2 - toolbarWidth / 2;
      const maxLeft = Math.max(
        VIEWPORT_PADDING,
        viewportWidth - toolbarWidth - VIEWPORT_PADDING
      );
      const left = Math.min(
        Math.max(preferredLeft, VIEWPORT_PADDING),
        maxLeft
      );
      const top = Math.max(VIEWPORT_PADDING, rect.top - VIEWPORT_PADDING);

      setPosition({ left, top });
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
        'scrollbar-hide fixed z-[90] overflow-x-auto whitespace-nowrap rounded-md border bg-popover p-1 opacity-100 print:hidden',
        'max-w-[80vw]',
        className
      )}
      onMouseDownCapture={(event) => {
        markPointerInteraction();
        onMouseDownCapture?.(event);
      }}
      onPointerDownCapture={(event) => {
        markPointerInteraction();
        onPointerDownCapture?.(event);
      }}
      style={{
        left: `${position.left}px`,
        top: `${position.top}px`,
        transform: 'translateY(calc(-100% - 12px))',
      }}
    >
      {children}
    </Toolbar>
  );
}

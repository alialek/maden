import { AIChatPlugin } from '@platejs/ai/react';
import type { PlateEditor } from 'platejs/react';

export type VirtualAnchor = {
  getBoundingClientRect: () => DOMRect;
  offsetWidth: number;
};

export type MadenAnchorRect = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type LooseNodeEntry = [any, any];

export const getMadenAiChatOption = <T,>(
  editor: PlateEditor,
  key: 'madenAnchorPath' | 'madenAnchorRect'
): T | undefined =>
  (editor.getOption as (plugin: unknown, key: string) => unknown)(
    AIChatPlugin,
    key
  ) as T | undefined;

export const setMadenAiChatOption = (
  editor: PlateEditor,
  key: 'madenAnchorPath' | 'madenAnchorRect',
  value: unknown
) => {
  (editor.setOption as (plugin: unknown, key: string, value: unknown) => void)(
    AIChatPlugin,
    key,
    value
  );
};

export const getCurrentSelectionRect = (): DOMRect | null => {
  if (typeof window === 'undefined') return null;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  if (rect.width > 0 || rect.height > 0) {
    return rect;
  }
  const fallback = range.getClientRects().item(0);
  return fallback ?? null;
};

export const createVirtualAnchor = (rect: MadenAnchorRect): VirtualAnchor => ({
  getBoundingClientRect: () =>
    DOMRect.fromRect({
      height: rect.height,
      width: rect.width,
      x: rect.x,
      y: rect.y,
    }),
  offsetWidth: rect.width,
});

export const getEditorTextContentWidth = (): number | undefined => {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return undefined;
  }

  const editorElement = document.querySelector('.page-content') as HTMLElement | null;
  const fallbackElement = document.querySelector('[data-slate-editor]') as HTMLElement | null;
  const element = editorElement ?? fallbackElement;
  if (!element) return undefined;

  const rect = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);
  const paddingLeft = Number.parseFloat(styles.paddingLeft) || 0;
  const paddingRight = Number.parseFloat(styles.paddingRight) || 0;
  const textWidth = rect.width - paddingLeft - paddingRight;
  const viewportWidth = window.innerWidth - 32;

  if (!Number.isFinite(textWidth) || textWidth <= 0) {
    return undefined;
  }

  return Math.max(320, Math.min(textWidth, viewportWidth));
};

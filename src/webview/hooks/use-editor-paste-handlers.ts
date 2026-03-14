import * as React from 'react';

import { deserializeMd } from '@platejs/markdown';
import { normalizeNodeId, type Value } from 'platejs';
import type { PlateEditor } from 'platejs/react';

import { normalizeImportedMarkdown } from '@/lib/markdown-import';

const hasHtmlLikeMarkdown = (value: string) => /<(?:p|a|img|br|strong|b|em|i)\b/i.test(value);

export const useEditorPasteHandlers = (editor: PlateEditor) => {
  React.useEffect(() => {
    const getEditorElement = (): HTMLElement | null => {
      try {
        return editor.api.toDOMNode(editor) as HTMLElement;
      } catch {
        return document.querySelector('[data-slate-editor]') as HTMLElement | null;
      }
    };

    const onPaste = (event: ClipboardEvent) => {
      const clipboard = event.clipboardData;
      const plainText = clipboard?.getData('text/plain') ?? '';
      if (!plainText || !hasHtmlLikeMarkdown(plainText)) return;

      const normalized = normalizeImportedMarkdown(plainText);
      if (normalized === plainText) return;

      event.preventDefault();
      event.stopPropagation();
      (event as Event).stopImmediatePropagation?.();

      try {
        const fragment = normalizeNodeId(deserializeMd(editor as never, normalized) as Value);
        editor.tf.insertNodes(fragment as never);
      } catch {
        editor.tf.insertText(normalized);
      }
    };

    let currentEditorElement: HTMLElement | null = null;
    const attach = (element: HTMLElement | null) => {
      if (!element || currentEditorElement === element) return;
      currentEditorElement?.removeEventListener('paste', onPaste, true);
      currentEditorElement = element;
      currentEditorElement.addEventListener('paste', onPaste, true);
    };

    attach(getEditorElement());
    const attachInterval = window.setInterval(() => {
      attach(getEditorElement());
    }, 200);

    return () => {
      window.clearInterval(attachInterval);
      currentEditorElement?.removeEventListener('paste', onPaste, true);
    };
  }, [editor]);
};


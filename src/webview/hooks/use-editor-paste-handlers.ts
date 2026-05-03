import * as React from 'react';

import { deserializeMd } from '@platejs/markdown';
import { normalizeNodeId, type Value } from 'platejs';
import type { PlateEditor } from 'platejs/react';

import { attachEditorDomListeners } from '@/hooks/editor-dom-listeners';
import { normalizeImportedMarkdown } from '@/lib/markdown-import';

export const useEditorPasteHandlers = (editor: PlateEditor) => {
  React.useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const clipboard = event.clipboardData;
      const plainText = clipboard?.getData('text/plain') ?? '';
      if (!plainText) return;

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

    return attachEditorDomListeners(editor, [
      { listener: onPaste as EventListener, options: true, type: 'paste' },
    ]);
  }, [editor]);
};

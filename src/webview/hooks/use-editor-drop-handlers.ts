import * as React from 'react';

import { isUrl, KEYS } from 'platejs';
import type { PlateEditor } from 'platejs/react';

import { toNormalizedRelativePath } from '@/lib/file-path';

const inferMediaNodeTypeFromUrl = (url: string): string => {
  const lowered = url.toLowerCase();
  if (/\.(png|jpe?g|gif|webp|svg|bmp|ico)(\?|#|$)/.test(lowered)) return KEYS.img;
  if (/\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/.test(lowered)) return KEYS.video;
  if (/\.(mp3|wav|ogg|m4a|flac|aac)(\?|#|$)/.test(lowered)) return KEYS.audio;
  if (
    lowered.includes('youtube.com') ||
    lowered.includes('youtu.be') ||
    lowered.includes('vimeo.com')
  ) {
    return KEYS.mediaEmbed;
  }

  return KEYS.file;
};

export const useEditorDropHandlers = (editor: PlateEditor) => {
  React.useEffect(() => {
    const getEditorElement = (): HTMLElement | null => {
      try {
        return editor.api.toDOMNode(editor) as HTMLElement;
      } catch {
        return document.querySelector('[data-slate-editor]') as HTMLElement | null;
      }
    };

    const isAbsolutePath = (value: string) =>
      value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value) || value.startsWith('\\\\');

    const isInterestingDrop = (event: DragEvent): boolean => {
      const types = event.dataTransfer?.types;
      if (!types) return false;

      return (
        types.includes('Files') ||
        types.includes('text/uri-list') ||
        types.includes('text/plain')
      );
    };

    const handleDrag = (event: DragEvent) => {
      if (!isInterestingDrop(event)) return;
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }
    };

    const onDrop = (event: DragEvent) => {
      if (!isInterestingDrop(event)) return;
      event.preventDefault();

      const files = Array.from(event.dataTransfer?.files ?? []);
      if (files.length > 0) {
        // Plate DnD handles files; block native plain-text drop side effects.
        event.stopPropagation();
        (event as Event).stopImmediatePropagation?.();
        return;
      }

      const uriList = event.dataTransfer?.getData('text/uri-list')?.trim();
      const plainText = event.dataTransfer?.getData('text/plain')?.trim();
      const url = uriList || plainText;

      if (!url) {
        return;
      }

      const isPathLikeDrop = isAbsolutePath(url);
      if (!isPathLikeDrop && !isUrl(url)) {
        return;
      }

      event.stopPropagation();
      (event as Event).stopImmediatePropagation?.();

      const normalizedUrl = toNormalizedRelativePath(url);
      if (!normalizedUrl || normalizedUrl.startsWith('file://')) {
        return;
      }
      const nodeType = inferMediaNodeTypeFromUrl(normalizedUrl);

      editor.tf.insertNodes({
        children: [{ text: '' }],
        name: nodeType === KEYS.file ? normalizedUrl.split('/').pop() : undefined,
        type: nodeType,
        url: normalizedUrl,
      });
    };

    let currentEditorElement: HTMLElement | null = null;
    const attach = (element: HTMLElement | null) => {
      if (!element || currentEditorElement === element) return;
      currentEditorElement?.removeEventListener('dragenter', handleDrag, true);
      currentEditorElement?.removeEventListener('dragover', handleDrag, true);
      currentEditorElement?.removeEventListener('drop', onDrop, true);

      currentEditorElement = element;
      currentEditorElement.addEventListener('dragenter', handleDrag, true);
      currentEditorElement.addEventListener('dragover', handleDrag, true);
      currentEditorElement.addEventListener('drop', onDrop, true);
    };

    attach(getEditorElement());
    const attachInterval = window.setInterval(() => {
      attach(getEditorElement());
    }, 200);

    return () => {
      window.clearInterval(attachInterval);
      currentEditorElement?.removeEventListener('dragenter', handleDrag, true);
      currentEditorElement?.removeEventListener('dragover', handleDrag, true);
      currentEditorElement?.removeEventListener('drop', onDrop, true);
    };
  }, [editor]);
};

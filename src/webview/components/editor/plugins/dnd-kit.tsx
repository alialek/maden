'use client';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { DndPlugin } from '@platejs/dnd';
import { KEYS } from 'platejs';

import { BlockDraggable } from '@/components/ui/block-draggable';
import { normalizeDroppedPath, resolveMediaInsertUrl } from '@/lib/file-path';

const getNodeType = (file: File) => {
  const mime = (file.type || '').toLowerCase();
  const name = file.name.toLowerCase();

  if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|bmp|ico)$/.test(name)) {
    return KEYS.img;
  }
  if (mime.startsWith('video/') || /\.(mp4|webm|mov|m4v|ogv)$/.test(name)) {
    return KEYS.video;
  }
  if (mime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac|aac)$/.test(name)) {
    return KEYS.audio;
  }

  return KEYS.file;
};

const getUriPaths = (dragItem: {
  dataTransfer?: unknown;
}) => {
  const values = new Set<string>();

  const transfers = Array.isArray(dragItem.dataTransfer)
    ? dragItem.dataTransfer
    : dragItem.dataTransfer
      ? [dragItem.dataTransfer]
      : [];

  transfers.forEach((dt) => {
    if (!dt || typeof (dt as DataTransfer).getData !== 'function') return;
    const uriList = (dt as DataTransfer).getData('text/uri-list');
    if (!uriList) return;

    uriList
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .forEach((line) => values.add(normalizeDroppedPath(line)));
  });

  return Array.from(values);
};

const basename = (value: string) => value.replace(/\\/g, '/').split('/').pop() ?? value;

const pickBestUriPath = ({
  file,
  uriPaths,
  used,
}: {
  file: File;
  uriPaths: string[];
  used: Set<number>;
}) => {
  const normalizedName = file.name.toLowerCase();
  const byNameIndex = uriPaths.findIndex(
    (uri, idx) => !used.has(idx) && basename(uri).toLowerCase() === normalizedName
  );

  if (byNameIndex !== -1) {
    used.add(byNameIndex);
    return uriPaths[byNameIndex];
  }

  const firstFreeIndex = uriPaths.findIndex((_, idx) => !used.has(idx));
  if (firstFreeIndex !== -1) {
    used.add(firstFreeIndex);
    return uriPaths[firstFreeIndex];
  }

  return '';
};

export const DndKit = [
  DndPlugin.configure({
    options: {
      enableScroller: true,
      onDropFiles: ({ dragItem, editor, target }) => {
        const files = Array.from(dragItem.files);
        const uriPaths = getUriPaths(dragItem);
        const seen = new Set<string>();
        const usedUriIndexes = new Set<number>();

        const nodes = files
          .map((file, index) => {
          const matchedPath =
            pickBestUriPath({
              file,
              uriPaths,
              used: usedUriIndexes,
            }) || uriPaths[index] || '';
          const filePath = resolveMediaInsertUrl({
            file,
            preferredPath: normalizeDroppedPath(matchedPath),
          });
          const dedupeKey = `${filePath}|${file.name}|${file.size}|${file.lastModified}`;
          if (!filePath || seen.has(dedupeKey)) {
            return null;
          }
          seen.add(dedupeKey);
          const type = getNodeType(file);

          return {
            children: [{ text: '' }],
            isUpload: false,
            name: type === KEYS.file ? file.name : '',
            type,
            url: filePath,
          };
          })
          .filter((node): node is NonNullable<typeof node> => node !== null);

        if (nodes.length === 0) return;

        editor.tf.insertNodes(nodes, { at: target });
      },
    },
    render: {
      aboveNodes: BlockDraggable,
      aboveSlate: ({ children }) => (
        <DndProvider backend={HTML5Backend}>{children}</DndProvider>
      ),
    },
  }),
];

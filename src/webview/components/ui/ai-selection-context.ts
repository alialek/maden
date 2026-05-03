import { AIChatPlugin } from '@platejs/ai/react';
import { serializeMd } from '@platejs/markdown';
import { BlockSelectionPlugin } from '@platejs/selection/react';
import { NodeApi } from 'platejs';
import type { PlateEditor } from 'platejs/react';

const blockPlainText = (block: unknown): string => {
  if (!block) return '';
  return NodeApi.string(block as any).replace(/\s+/g, ' ').trim();
};

const getNeighborIndexes = (
  children: any[],
  targetIndexes: number[],
  direction: 'above' | 'below',
  limit: number
): number[] => {
  const sortedTargets = [...targetIndexes].sort((a, b) => a - b);
  if (sortedTargets.length === 0) return [];

  const picked: number[] = [];

  if (direction === 'above') {
    for (let index = sortedTargets[0] - 1; index >= 0; index -= 1) {
      if (targetIndexes.includes(index)) continue;
      if (!blockPlainText(children[index])) continue;
      picked.push(index);
      if (picked.length >= limit) break;
    }
    return picked.reverse();
  }

  for (
    let index = sortedTargets[sortedTargets.length - 1] + 1;
    index < children.length;
    index += 1
  ) {
    if (targetIndexes.includes(index)) continue;
    if (!blockPlainText(children[index])) continue;
    picked.push(index);
    if (picked.length >= limit) break;
  }

  return picked;
};

export const getCurrentAiBlockEntry = (editor: PlateEditor) => {
  const blockFromCurrentSelection = editor.selection
    ? editor.api.block({ at: editor.selection, highest: true })
    : null;
  const chatSelection = editor.getOption(AIChatPlugin, 'chatSelection') as
    | { anchor?: { path?: unknown }; focus?: { path?: unknown } }
    | undefined;
  const blockFromChatSelection = (() => {
    const anchorPath = chatSelection?.anchor?.path ?? chatSelection?.focus?.path;
    if (!anchorPath) return null;
    try {
      return editor.api.block({ at: anchorPath as any, highest: true });
    } catch {
      return null;
    }
  })();

  return (
    blockFromCurrentSelection ??
    blockFromChatSelection ??
    editor.api.block({ highest: true }) ??
    null
  );
};

export const getSelectedAiBlocks = (editor: PlateEditor) =>
  editor
    .getApi(BlockSelectionPlugin)
    .blockSelection.getNodes({ selectionFallback: true, sort: true })
    .map(([block]) => block);

export const getAiTargetBlocks = (editor: PlateEditor): any[] => {
  const blocks = getSelectedAiBlocks(editor);
  if (blocks.length > 0) return blocks;

  const currentBlock = getCurrentAiBlockEntry(editor);
  return currentBlock ? [currentBlock[0]] : [];
};

export const getSelectionContextInput = (
  editor: PlateEditor,
  _isSelecting: boolean
): string => {
  try {
    const topLevelChildren = Array.isArray(editor.children)
      ? (editor.children as any[])
      : [];
    const selectedBlocks = getSelectedAiBlocks(editor);
    const selectedIds = selectedBlocks
      .map((block) => (block as { id?: unknown }).id)
      .filter((id): id is string => typeof id === 'string');
    const targetIndexes = topLevelChildren
      .map((block, index) => ({
        id: (block as { id?: unknown }).id,
        index,
      }))
      .filter(({ id }) => typeof id === 'string' && selectedIds.includes(id))
      .map(({ index }) => index);

    const currentBlock = getCurrentAiBlockEntry(editor);
    const currentIndex = currentBlock
      ? topLevelChildren.findIndex((block) => block === currentBlock[0])
      : topLevelChildren.findIndex((block) => Boolean(blockPlainText(block)));

    const effectiveTargetIndexes =
      targetIndexes.length > 0
        ? targetIndexes
        : currentIndex >= 0
          ? [currentIndex]
          : [];

    let targetMarkdown = '';

    if (editor.api.isExpanded()) {
      const fragment = editor.api.fragment();
      if (fragment && fragment.length > 0) {
        targetMarkdown = serializeMd(editor, { value: fragment as any }).trim();
      }
    }

    if (!targetMarkdown && selectedBlocks.length > 0) {
      targetMarkdown = serializeMd(editor, { value: selectedBlocks as any }).trim();
    }

    if (!targetMarkdown && currentBlock) {
      targetMarkdown = serializeMd(editor, { value: [currentBlock[0]] as any }).trim();
    }

    if (!targetMarkdown && currentIndex >= 0) {
      targetMarkdown = serializeMd(editor, { value: [topLevelChildren[currentIndex]] as any }).trim();
    }

    if (!targetMarkdown) {
      return '';
    }

    const aboveIndexes = getNeighborIndexes(
      topLevelChildren,
      effectiveTargetIndexes,
      'above',
      2
    );
    const belowIndexes = getNeighborIndexes(
      topLevelChildren,
      effectiveTargetIndexes,
      'below',
      2
    );

    const aboveMarkdown = aboveIndexes
      .map((index) =>
        serializeMd(editor, { value: [topLevelChildren[index]] as any }).trim()
      )
      .filter(Boolean)
      .join('\n\n');

    const belowMarkdown = belowIndexes
      .map((index) =>
        serializeMd(editor, { value: [topLevelChildren[index]] as any }).trim()
      )
      .filter(Boolean)
      .join('\n\n');

    return [
      aboveMarkdown ? `<context-above>\n${aboveMarkdown}\n</context-above>` : '',
      `<target-text>\n${targetMarkdown}\n</target-text>`,
      belowMarkdown ? `<context-below>\n${belowMarkdown}\n</context-below>` : '',
    ]
      .filter(Boolean)
      .join('\n\n');
  } catch {
    // Best effort context extraction.
  }

  return '';
};

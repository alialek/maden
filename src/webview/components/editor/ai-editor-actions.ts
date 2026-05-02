'use client';

import { withAIBatch } from '@platejs/ai';
import {
  AIChatPlugin,
  aiCommentToRange,
  applyAISuggestions,
  applyTableCellSuggestion,
  streamInsertChunk,
} from '@platejs/ai/react';
import { getCommentKey, getTransientCommentKey } from '@platejs/comment';
import { deserializeMd } from '@platejs/markdown';
import { BlockSelectionPlugin } from '@platejs/selection/react';
import { type TNode, getPluginType, KEYS, nanoid, NodeApi, PathApi, TextApi } from 'platejs';
import type { PlateEditor } from 'platejs/react';

import { commentPlugin } from '@/components/editor/plugins/comment-kit';
import { discussionPlugin } from '@/components/editor/plugins/discussion-kit';
import { stripStructuredResponseWrappers } from '@/lib/structured-response';

export type ToolName = 'comment' | 'edit' | 'generate';

export type TComment = {
  comment: {
    blockId: string;
    comment: string;
    content: string;
  } | null;
  status: 'finished' | 'streaming';
};

export type TTableCellUpdate = {
  cellUpdate: {
    content: string;
    id: string;
  } | null;
  status: 'finished' | 'streaming';
};

export type MessageDataPart = {
  toolName: ToolName;
  comment?: TComment;
  table?: TTableCellUpdate;
};

const getInsertionPath = (editor: PlateEditor) => {
  const chatSelection = editor.getOption(AIChatPlugin, 'chatSelection') as
    | { focus?: { path?: unknown } }
    | undefined;
  const focusPath = chatSelection?.focus?.path;

  if (Array.isArray(focusPath) && focusPath.length > 0) {
    return PathApi.next(focusPath.slice(0, 1) as any);
  }

  const blockEntry = editor.api.block({ highest: true });
  if (blockEntry?.[1]) {
    return PathApi.next((blockEntry[1] as any).slice(0, 1));
  }

  return [editor.children.length];
};

export const beginStreamingInsert = (editor: PlateEditor) => {
  editor.tf.withoutSaving(() => {
    editor.tf.insertNodes(
      {
        children: [{ text: '' }],
        type: getPluginType(editor, KEYS.aiChat),
      },
      {
        at: getInsertionPath(editor) as any,
      }
    );
  });
  editor.setOption(AIChatPlugin, 'streaming', true);
  editor.setOption(AIChatPlugin, 'mode', 'insert');
  editor.setOption(AIChatPlugin, 'toolName', 'generate');
};

export const streamStructuredAddDelta = (
  editor: PlateEditor,
  delta: string
) => {
  withAIBatch(editor, () => {
    streamInsertChunk(editor, delta, {
      textProps: {
        [getPluginType(editor, KEYS.ai)]: true,
      },
    });
  });
};

export const addStructuredTextBelow = (
  editor: PlateEditor,
  content: string
) => {
  beginStreamingInsert(editor);
  streamStructuredAddDelta(editor, stripStructuredResponseWrappers(content));
  editor.getApi(BlockSelectionPlugin).blockSelection.deselect();
  editor.getApi(AIChatPlugin).aiChat.hide();
};

export const applyInlineStructuredSuggestion = (
  editor: PlateEditor,
  content: string
) => {
  editor.setOption(AIChatPlugin, 'mode', 'chat');
  editor.setOption(AIChatPlugin, 'toolName', 'edit');
  withAIBatch(editor, () => {
    applyAISuggestions(editor, stripStructuredResponseWrappers(content));
  });
};

export const addCommentDiscussionFromText = (
  editor: PlateEditor,
  commentText: string
): string | null => {
  const normalizedComment = stripStructuredResponseWrappers(commentText);
  if (!normalizedComment) {
    return null;
  }

  const chatSelection = editor.getOption(AIChatPlugin, 'chatSelection');
  const selectedBlocks = editor
    .getApi(BlockSelectionPlugin)
    .blockSelection.getNodes({ selectionFallback: true, sort: true });

  const blockEntry =
    (chatSelection
      ? editor.api.block({ at: chatSelection as any, highest: true })
      : null) ??
    selectedBlocks[0] ??
    editor.api.block({ highest: true }) ??
    null;

  if (!blockEntry) {
    return null;
  }

  const blockNode = blockEntry[0];
  const blockPath = blockEntry[1];
  const documentContent = NodeApi.string(blockNode).trim();
  const discussionId = nanoid();
  const discussions = editor.getOption(discussionPlugin, 'discussions') || [];

  const newComment = {
    contentRich: [{ children: [{ text: normalizedComment }], type: 'p' }],
    createdAt: new Date(),
    discussionId,
    id: nanoid(),
    isEdited: false,
    userId: editor.getOption(discussionPlugin, 'currentUserId'),
  };

  const newDiscussion = {
    comments: [newComment],
    createdAt: new Date(),
    documentContent,
    id: discussionId,
    isResolved: false,
    userId: editor.getOption(discussionPlugin, 'currentUserId'),
  };

  editor.setOption(discussionPlugin, 'discussions', [...discussions, newDiscussion]);

  editor.tf.withMerging(() => {
    editor.tf.setNodes(
      {
        [getCommentKey(newDiscussion.id)]: true,
        [KEYS.comment]: true,
      },
      {
        at: (chatSelection as any) ?? blockPath,
        match: TextApi.isText,
        split: Boolean(chatSelection),
      }
    );
  });

  editor.setOption(commentPlugin, 'activeId', newDiscussion.id);
  editor.getApi(BlockSelectionPlugin).blockSelection.deselect();
  editor.getApi(AIChatPlugin).aiChat.hide();

  return newDiscussion.id;
};

export const handleAiDataPart = (
  editor: PlateEditor,
  data: { data?: unknown; type: string }
) => {
  if (data.type === 'data-toolName') {
    editor.setOption(AIChatPlugin, 'toolName', data.data as ToolName);
  }

  if (data.type === 'data-table' && data.data) {
    const tableData = data.data as TTableCellUpdate;

    if (tableData.status === 'finished') {
      const chatSelection = editor.getOption(AIChatPlugin, 'chatSelection');

      if (!chatSelection) return;

      editor.tf.setSelection(chatSelection);

      return;
    }

    const cellUpdate = tableData.cellUpdate!;

    withAIBatch(editor, () => {
      applyTableCellSuggestion(editor, cellUpdate);
    });
  }

  if (data.type === 'data-comment' && data.data) {
    const commentData = data.data as TComment;

    if (commentData.status === 'finished') {
      editor.getApi(BlockSelectionPlugin).blockSelection.deselect();

      return;
    }

    const aiComment = commentData.comment!;
    const range = aiCommentToRange(editor, aiComment);

    if (!range) return console.warn('No range found for AI comment');

    const discussions = editor.getOption(discussionPlugin, 'discussions') || [];

    const discussionId = nanoid();
    const newComment = {
      contentRich: [{ children: [{ text: aiComment.comment }], type: 'p' }],
      createdAt: new Date(),
      discussionId,
      id: nanoid(),
      isEdited: false,
      userId: editor.getOption(discussionPlugin, 'currentUserId'),
    };

    const newDiscussion = {
      comments: [newComment],
      createdAt: new Date(),
      documentContent: deserializeMd(editor, aiComment.content)
        .map((node: TNode) => NodeApi.string(node))
        .join('\n'),
      id: discussionId,
      isResolved: false,
      userId: editor.getOption(discussionPlugin, 'currentUserId'),
    };

    editor.setOption(discussionPlugin, 'discussions', [...discussions, newDiscussion]);

    editor.tf.withMerging(() => {
      editor.tf.setNodes(
        {
          [getCommentKey(newDiscussion.id)]: true,
          [getTransientCommentKey()]: true,
          [KEYS.comment]: true,
        },
        {
          at: range,
          match: TextApi.isText,
          split: true,
        }
      );
    });
  }
};

'use client';

import * as React from 'react';

import { type UseChatHelpers, useChat as useBaseChat } from '@ai-sdk/react';
import { faker } from '@faker-js/faker';
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
import { type UIMessage, DefaultChatTransport } from 'ai';
import { type TNode, getPluginType, KEYS, nanoid, NodeApi, PathApi, TextApi } from 'platejs';
import { type PlateEditor, useEditorRef, usePluginOption } from 'platejs/react';

import { aiChatPlugin } from '@/components/editor/plugins/ai-kit';
import { commentPlugin } from '@/components/editor/plugins/comment-kit';
import { requestHostAiStream } from '@/lib/ai-host-transport';

import { discussionPlugin } from './plugins/discussion-kit';
import { withAIBatch } from '@platejs/ai';

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

export type Chat = UseChatHelpers<ChatMessage>;

export type ChatMessage = UIMessage<{}, MessageDataPart>;

type StructuredAction = 'add' | 'comment' | 'inline';

type ParsedStructuredResponse = {
  action: StructuredAction;
  content: string;
  isClosed: boolean;
  isStructured: boolean;
};

export const MadenResponseOpenTagPattern =
  /<maden-response\s+action="(inline|comment|add)">/i;
export const MadenResponseCloseTag = '</maden-response>';
export const AnyMadenResponseTagPattern = /<\/?maden-response\b[^>]*>/gi;
export const PartialMadenResponseSuffixPattern = /<\/?maden-response[^>]*$/i;

const trimPartialCloseTagSuffix = (value: string) => {
  for (let length = MadenResponseCloseTag.length - 1; length > 0; length -= 1) {
    if (value.endsWith(MadenResponseCloseTag.slice(0, length))) {
      return value.slice(0, -length);
    }
  }

  return value;
};

const readTextParts = (value: unknown): string[] => {
  if (typeof value === 'string') {
    return [value];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((part) => {
      if (typeof part === 'string') {
        return part;
      }

      if (!part || typeof part !== 'object') {
        return '';
      }

      const maybePart = part as { text?: unknown; content?: unknown; type?: unknown };
      if (typeof maybePart.text === 'string') {
        return maybePart.text;
      }
      if (maybePart.type === 'text' && typeof maybePart.content === 'string') {
        return maybePart.content;
      }
      if (typeof maybePart.content === 'string') {
        return maybePart.content;
      }

      return '';
    })
    .filter((part) => part.length > 0);
};

const extractMarkdownFromPotentialJson = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return trimmed;
  }

  try {
    const parsed = JSON.parse(trimmed) as
      | {
          input?: unknown;
          messages?: unknown;
          prompt?: unknown;
          selectedContext?: unknown;
          userPrompt?: unknown;
        }
      | unknown[];

    if (Array.isArray(parsed)) {
      return trimmed;
    }

    if (typeof parsed.selectedContext === 'string' && parsed.selectedContext.trim()) {
      return parsed.selectedContext.trim();
    }
    if (typeof parsed.userPrompt === 'string' && parsed.userPrompt.trim()) {
      return parsed.userPrompt.trim();
    }
    if (typeof parsed.input === 'string' && parsed.input.trim()) {
      return parsed.input.trim();
    }
    if (typeof parsed.prompt === 'string' && parsed.prompt.trim()) {
      return parsed.prompt.trim();
    }

    if (Array.isArray(parsed.messages)) {
      const normalized = normalizeMessagesForHost(parsed.messages);
      const latestUser = [...normalized]
        .reverse()
        .find((message) => message.role === 'user');
      if (latestUser?.content) {
        return latestUser.content;
      }
    }
  } catch {
    // Keep original text if it's not a JSON payload.
  }

  return trimmed;
};

const normalizeMessagesForHost = (messages: unknown): Array<{
  role: 'assistant' | 'system' | 'user';
  content: string;
}> => {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const message = entry as { role?: unknown; content?: unknown; parts?: unknown };
      const role = message.role;
      if (role !== 'assistant' && role !== 'system' && role !== 'user') {
        return null;
      }

      const content = [
        ...readTextParts(message.parts),
        ...readTextParts(message.content),
      ]
        .join('\n')
        .trim();

      if (!content) {
        return null;
      }

      const normalizedContent = extractMarkdownFromPotentialJson(content);
      if (!normalizedContent) {
        return null;
      }

      return {
        role,
        content: normalizedContent,
      };
    })
    .filter(
      (
        message
      ): message is { role: 'assistant' | 'system' | 'user'; content: string } =>
        message !== null
    );
};

const pickLatestUserMessage = (
  messages: Array<{ role: 'assistant' | 'system' | 'user'; content: string }>
) => {
  const latestUser = [...messages].reverse().find((message) => message.role === 'user');
  return latestUser ? [latestUser] : messages.slice(-1);
};

const extractMessageText = (message: {
  content?: unknown;
  parts?: unknown;
}): string => {
  const content = [
    ...readTextParts(message.parts),
    ...readTextParts(message.content),
  ]
    .join('\n')
    .trim();

  return content ? extractMarkdownFromPotentialJson(content) : '';
};

const getLatestAssistantText = (messages: ChatMessage[]) => {
  const latestAssistant = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant');

  if (!latestAssistant) {
    return null;
  }

  const content = extractMessageText(latestAssistant);
  if (!content) {
    return null;
  }

  return {
    content,
    id: latestAssistant.id,
  };
};

const parseStructuredResponse = (value: string): ParsedStructuredResponse | null => {
  const match = value.match(MadenResponseOpenTagPattern);
  if (!match || match.index === undefined) {
    return null;
  }

  const action = match[1]?.toLowerCase() as StructuredAction | undefined;
  if (action !== 'inline' && action !== 'comment' && action !== 'add') {
    return null;
  }

  const bodyStart = match.index + match[0].length;
  const remainder = value.slice(bodyStart);
  const closeIndex = remainder.indexOf(MadenResponseCloseTag);
  const rawContent =
    closeIndex >= 0
      ? remainder.slice(0, closeIndex)
      : trimPartialCloseTagSuffix(remainder);
  const content = rawContent.replace(/^\s+/, '');

  return {
    action,
    content,
    isClosed: closeIndex >= 0,
    isStructured: true,
  };
};

export const stripStructuredResponseWrappers = (value: string): string =>
  value
    .replace(AnyMadenResponseTagPattern, '')
    .replace(PartialMadenResponseSuffixPattern, '')
    .trim();

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

const beginStreamingInsert = (editor: PlateEditor) => {
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

const addCommentDiscussionFromText = (
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
    id: nanoid(),
    contentRich: [{ children: [{ text: normalizedComment }], type: 'p' }],
    createdAt: new Date(),
    discussionId,
    isEdited: false,
    userId: editor.getOption(discussionPlugin, 'currentUserId'),
  };

  const newDiscussion = {
    id: discussionId,
    comments: [newComment],
    createdAt: new Date(),
    documentContent,
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

export const useChat = () => {
  const editor = useEditorRef();
  const options = usePluginOption(aiChatPlugin, 'chatOptions');

  const _abortFakeStream = () => {};

  const baseChat = useBaseChat<ChatMessage>({
    id: 'editor',
    transport: new DefaultChatTransport({
      api: options.api || '/api/ai/command',
      fetch: (async (input, init) => {
        const bodyOptions = editor.getOptions(aiChatPlugin).chatOptions?.body;
        const rawBody = typeof init?.body === 'string' ? init.body : '{}';
        const initBody = JSON.parse(rawBody);
        const merged = {
          ...(initBody as Record<string, unknown>),
          ...((bodyOptions as Record<string, unknown> | undefined) ?? {}),
        };
        const normalizedMessages = normalizeMessagesForHost(merged.messages);
        const compactMessages = pickLatestUserMessage(normalizedMessages);

        const body = {
          messages: compactMessages,
          selectedContext:
            typeof merged.selectedContext === 'string' ? merged.selectedContext : undefined,
          provider: typeof merged.provider === 'string' ? merged.provider : undefined,
          model: typeof merged.model === 'string' ? merged.model : undefined,
          apiKey: typeof merged.apiKey === 'string' ? merged.apiKey : undefined,
          baseUrl: typeof merged.baseUrl === 'string' ? merged.baseUrl : undefined,
          enabled: typeof merged.enabled === 'boolean' ? merged.enabled : undefined,
          gigachatMode:
            merged.gigachatMode === 'native' || merged.gigachatMode === 'openaiCompatible'
              ? merged.gigachatMode
              : undefined,
          gigachatClientId:
            typeof merged.gigachatClientId === 'string'
              ? merged.gigachatClientId
              : undefined,
          gigachatClientSecret:
            typeof merged.gigachatClientSecret === 'string'
              ? merged.gigachatClientSecret
              : undefined,
          gigachatScope:
            typeof merged.gigachatScope === 'string' ? merged.gigachatScope : undefined,
          maxTokens:
            typeof merged.maxTokens === 'number' && Number.isFinite(merged.maxTokens)
              ? merged.maxTokens
              : undefined,
          temperature:
            typeof merged.temperature === 'number' && Number.isFinite(merged.temperature)
              ? merged.temperature
              : undefined,
        };

        const route =
          typeof input === 'string' && input.includes('/api/ai/copilot')
            ? 'copilot'
            : 'command';

        return requestHostAiStream({
          body: JSON.stringify(body),
          route,
          signal: init?.signal ?? undefined,
        });
      }) as typeof fetch,
    }),
    onData(data) {
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

        const discussions =
          editor.getOption(discussionPlugin, 'discussions') || [];

        // Generate a new discussion ID
        const discussionId = nanoid();

        // Create a new comment
        const newComment = {
          id: nanoid(),
          contentRich: [{ children: [{ text: aiComment.comment }], type: 'p' }],
          createdAt: new Date(),
          discussionId,
          isEdited: false,
          userId: editor.getOption(discussionPlugin, 'currentUserId'),
        };

        // Create a new discussion
        const newDiscussion = {
          id: discussionId,
          comments: [newComment],
          createdAt: new Date(),
          documentContent: deserializeMd(editor, aiComment.content)
            .map((node: TNode) => NodeApi.string(node))
            .join('\n'),
          isResolved: false,
          userId: editor.getOption(discussionPlugin, 'currentUserId'),
        };

        // Update discussions
        const updatedDiscussions = [...discussions, newDiscussion];
        editor.setOption(discussionPlugin, 'discussions', updatedDiscussions);

        // Apply comment marks to the editor
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
    },

    ...options,
  });

  const chat = {
    ...baseChat,
    _abortFakeStream,
  };

  const handledCommentMessageIdRef = React.useRef<string | null>(null);
  const streamedStructuredRef = React.useRef<{
    action: StructuredAction;
    consumed: number;
    id: string;
    started: boolean;
  } | null>(null);

  React.useEffect(() => {
    const toolName = editor.getOption(AIChatPlugin, 'toolName');
    if (toolName !== 'comment') {
      streamedStructuredRef.current = null;
      return;
    }

    const latestAssistant = getLatestAssistantText(chat.messages);
    if (!latestAssistant) {
      return;
    }

    const parsed = parseStructuredResponse(latestAssistant.content);
    if (!parsed?.isStructured) {
      return;
    }

    if (chat.status === 'streaming' && parsed.action === 'add') {
      const previous = streamedStructuredRef.current;
      if (!previous || previous.id !== latestAssistant.id) {
        streamedStructuredRef.current = {
          action: parsed.action,
          consumed: 0,
          id: latestAssistant.id,
          started: false,
        };
      }

      const state = streamedStructuredRef.current;
      if (!state) {
        return;
      }

      if (!state.started) {
        beginStreamingInsert(editor);
        state.started = true;
      }

      const nextContent = parsed.content;
      if (nextContent.length <= state.consumed) {
        return;
      }

      const delta = nextContent.slice(state.consumed);
      state.consumed = nextContent.length;

      withAIBatch(editor, () => {
        streamInsertChunk(editor, delta, {
          textProps: {
            [getPluginType(editor, KEYS.ai)]: true,
          },
        });
      });
    }
  }, [chat.messages, chat.status, editor]);

  React.useEffect(() => {
    const toolName = editor.getOption(AIChatPlugin, 'toolName');
    if (toolName !== 'comment' || chat.status !== 'ready') {
      return;
    }

    const latestAssistant = getLatestAssistantText(chat.messages);
    if (!latestAssistant) {
      return;
    }

    if (handledCommentMessageIdRef.current === latestAssistant.id) {
      return;
    }

    const parsed = parseStructuredResponse(latestAssistant.content);
    if (parsed?.isStructured) {
      if (parsed.action === 'comment') {
        const discussionId = addCommentDiscussionFromText(editor, parsed.content);
        if (!discussionId) {
          return;
        }
      }

      if (parsed.action === 'inline') {
        editor.setOption(AIChatPlugin, 'mode', 'chat');
        editor.setOption(AIChatPlugin, 'toolName', 'edit');
        withAIBatch(editor, () => {
          applyAISuggestions(editor, stripStructuredResponseWrappers(parsed.content));
        });
      }

      if (parsed.action === 'add') {
        const streamed = streamedStructuredRef.current;
        if (!streamed || streamed.id !== latestAssistant.id) {
          beginStreamingInsert(editor);
          withAIBatch(editor, () => {
            streamInsertChunk(editor, stripStructuredResponseWrappers(parsed.content), {
              textProps: {
                [getPluginType(editor, KEYS.ai)]: true,
              },
            });
          });
        }
        editor.getApi(BlockSelectionPlugin).blockSelection.deselect();
        editor.getApi(AIChatPlugin).aiChat.hide();
      }
    } else {
      const discussionId = addCommentDiscussionFromText(editor, latestAssistant.content);
      if (!discussionId) {
        return;
      }
    }

    handledCommentMessageIdRef.current = latestAssistant.id;
    streamedStructuredRef.current = null;
  }, [chat.messages, chat.status, editor]);

  React.useEffect(() => {
    editor.setOption(AIChatPlugin, 'chat', chat as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.status, chat.messages, chat.error]);

  return chat;
};

// Used for testing. Remove it after implementing useChat api.
const fakeStreamText = ({
  chunkCount = 10,
  editor,
  sample = null,
  signal,
}: {
  editor: PlateEditor;
  chunkCount?: number;
  sample?: 'comment' | 'markdown' | 'mdx' | 'table' | null;
  signal?: AbortSignal;
}) => {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const blocks = (() => {
        if (sample === 'markdown') {
          return markdownChunks;
        }

        if (sample === 'mdx') {
          return mdxChunks;
        }

        if (sample === 'comment') {
          const commentChunks = createCommentChunks(editor);
          return commentChunks;
        }

        if (sample === 'table') {
          const tableChunks = createTableCellChunks(editor);
          return tableChunks;
        }

        return [
          Array.from({ length: chunkCount }, () => ({
            delay: faker.number.int({ max: 100, min: 30 }),
            texts: `${faker.lorem.words({ max: 3, min: 1 })} `,
          })),

          Array.from({ length: chunkCount + 2 }, () => ({
            delay: faker.number.int({ max: 100, min: 30 }),
            texts: `${faker.lorem.words({ max: 3, min: 1 })} `,
          })),

          Array.from({ length: chunkCount + 4 }, () => ({
            delay: faker.number.int({ max: 100, min: 30 }),
            texts: `${faker.lorem.words({ max: 3, min: 1 })} `,
          })),
        ];
      })();
      if (signal?.aborted) {
        controller.error(new Error('Aborted before start'));
        return;
      }

      const abortHandler = () => {
        controller.error(new Error('Stream aborted'));
      };

      signal?.addEventListener('abort', abortHandler);

      // Generate a unique message ID
      const messageId = `msg_${faker.string.alphanumeric(40)}`;

      // Handle comment and table data differently (they use data events, not text streams)
      if (sample === 'comment' || sample === 'table') {
        controller.enqueue(encoder.encode('data: {"type":"start"}\n\n'));
        await new Promise((resolve) => setTimeout(resolve, 10));

        controller.enqueue(encoder.encode('data: {"type":"start-step"}\n\n'));
        await new Promise((resolve) => setTimeout(resolve, 10));

        // For comments and tables, send data events directly
        for (const block of blocks) {
          for (const chunk of block) {
            await new Promise((resolve) => setTimeout(resolve, chunk.delay));

            if (signal?.aborted) {
              signal?.removeEventListener('abort', abortHandler);
              return;
            }

            // Send the data event directly (already formatted as JSON)
            controller.enqueue(encoder.encode(`data: ${chunk.texts}\n\n`));
          }
        }

        // Send the final DONE event
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      } else {
        // Send initial stream events for text content
        controller.enqueue(encoder.encode('data: {"type":"start"}\n\n'));
        await new Promise((resolve) => setTimeout(resolve, 10));

        controller.enqueue(encoder.encode('data: {"type":"start-step"}\n\n'));
        await new Promise((resolve) => setTimeout(resolve, 10));

        controller.enqueue(
          encoder.encode(
            `data: {"type":"text-start","id":"${messageId}","providerMetadata":{"openai":{"itemId":"${messageId}"}}}\n\n`
          )
        );
        await new Promise((resolve) => setTimeout(resolve, 10));

        for (let i = 0; i < blocks.length; i++) {
          const block = blocks[i];

          // Stream the block content
          for (const chunk of block) {
            await new Promise((resolve) => setTimeout(resolve, chunk.delay));

            if (signal?.aborted) {
              signal?.removeEventListener('abort', abortHandler);
              return;
            }

            // Properly escape the text for JSON
            const escapedText = chunk.texts
              .replace(/\\/g, '\\\\') // Escape backslashes first
              .replace(/"/g, String.raw`\"`) // Escape quotes
              .replace(/\n/g, String.raw`\n`) // Escape newlines
              .replace(/\r/g, String.raw`\r`) // Escape carriage returns
              .replace(/\t/g, String.raw`\t`); // Escape tabs

            controller.enqueue(
              encoder.encode(
                `data: {"type":"text-delta","id":"${messageId}","delta":"${escapedText}"}\n\n`
              )
            );
          }

          // Add double newline after each block except the last one
          if (i < blocks.length - 1) {
            controller.enqueue(
              encoder.encode(
                `data: {"type":"text-delta","id":"${messageId}","delta":"\\n\\n"}\n\n`
              )
            );
          }
        }

        // Send end events
        controller.enqueue(
          encoder.encode(`data: {"type":"text-end","id":"${messageId}"}\n\n`)
        );
        await new Promise((resolve) => setTimeout(resolve, 10));

        controller.enqueue(encoder.encode('data: {"type":"finish-step"}\n\n'));
        await new Promise((resolve) => setTimeout(resolve, 10));

        controller.enqueue(encoder.encode('data: {"type":"finish"}\n\n'));
        await new Promise((resolve) => setTimeout(resolve, 10));

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      }

      signal?.removeEventListener('abort', abortHandler);
      controller.close();
    },
  });
};

const delay = faker.number.int({ max: 20, min: 5 });

const markdownChunks = [
  [
    { delay, texts: 'Make text ' },
    { delay, texts: '**bold**' },
    { delay, texts: ', ' },
    { delay, texts: '*italic*' },
    { delay, texts: ', ' },
    { delay, texts: '__underlined__' },
    { delay, texts: ', or apply a ' },
    {
      delay,
      texts: '***combination***',
    },
    { delay, texts: ' ' },
    { delay, texts: 'of ' },
    { delay, texts: 'these ' },
    { delay, texts: 'styles ' },
    { delay, texts: 'for ' },
    { delay, texts: 'a ' },
    { delay, texts: 'visually ' },
    { delay, texts: 'striking ' },
    { delay, texts: 'effect.' },
    { delay, texts: '\n\n' },
    { delay, texts: 'Add ' },
    {
      delay,
      texts: '~~strikethrough~~',
    },
    { delay, texts: ' ' },
    { delay, texts: 'to ' },
    { delay, texts: 'indicate ' },
    { delay, texts: 'deleted ' },
    { delay, texts: 'or ' },
    { delay, texts: 'outdated ' },
    { delay, texts: 'content.' },
    { delay, texts: '\n\n' },
    { delay, texts: 'Write ' },
    { delay, texts: 'code ' },
    { delay, texts: 'snippets ' },
    { delay, texts: 'with ' },
    { delay, texts: 'inline ' },
    { delay, texts: '`code`' },
    { delay, texts: ' formatting ' },
    { delay, texts: 'for ' },
    { delay, texts: 'easy ' },
    { delay: faker.number.int({ max: 100, min: 30 }), texts: 'readability.' },
    { delay, texts: '\n\n' },
    { delay, texts: 'Add ' },
    {
      delay,
      texts: '[links](https://example.com)',
    },
    { delay: faker.number.int({ max: 100, min: 30 }), texts: ' to ' },
    { delay: faker.number.int({ max: 100, min: 30 }), texts: 'external ' },
    { delay, texts: 'resources ' },
    { delay, texts: 'or ' },
    {
      delay,
      texts: 'references.\n\n',
    },

    { delay, texts: 'Use ' },
    { delay, texts: 'inline ' },
    { delay, texts: 'math ' },
    { delay, texts: 'equations ' },
    { delay, texts: 'like ' },
    { delay, texts: '$E = mc^2$ ' },
    { delay, texts: 'for ' },
    { delay, texts: 'scientific ' },
    { delay, texts: 'notation.' },
    { delay, texts: '\n\n' },

    { delay, texts: '# ' },
    { delay, texts: 'Heading ' },
    { delay, texts: '1\n\n' },
    { delay, texts: '## ' },
    { delay, texts: 'Heading ' },
    { delay, texts: '2\n\n' },
    { delay, texts: '### ' },
    { delay, texts: 'Heading ' },
    { delay, texts: '3\n\n' },
    { delay, texts: '> ' },
    { delay, texts: 'Blockquote\n\n' },
    { delay, texts: '- ' },
    { delay, texts: 'Unordered ' },
    { delay, texts: 'list ' },
    { delay, texts: 'item ' },
    { delay, texts: '1\n' },
    { delay, texts: '- ' },
    { delay, texts: 'Unordered ' },
    { delay, texts: 'list ' },
    { delay, texts: 'item ' },
    { delay, texts: '2\n\n' },
    { delay, texts: '1. ' },
    { delay, texts: 'Ordered ' },
    { delay, texts: 'list ' },
    { delay, texts: 'item ' },
    { delay, texts: '1\n' },
    { delay, texts: '2. ' },
    { delay, texts: 'Ordered ' },
    { delay, texts: 'list ' },
    { delay, texts: 'item ' },
    { delay, texts: '2\n\n' },
    { delay, texts: '- ' },
    { delay, texts: '[ ' },
    { delay, texts: '] ' },
    { delay, texts: 'Task ' },
    { delay, texts: 'list ' },
    { delay, texts: 'item ' },
    { delay, texts: '1\n' },
    { delay, texts: '- ' },
    { delay, texts: '[x] ' },
    { delay, texts: 'Task ' },
    { delay, texts: 'list ' },
    { delay, texts: 'item ' },
    { delay, texts: '2\n\n' },
    { delay, texts: '![Alt ' },
    {
      delay,
      texts:
        'text](https://images.unsplash.com/photo-1712688930249-98e1963af7bd?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)\n\n',
    },
    {
      delay,
      texts: '### Advantage blocks:\n',
    },
    { delay, texts: '\n' },
    { delay, texts: '$$\n' },
    {
      delay,
      texts: 'a^2 + b^2 = c^2\n',
    },
    { delay, texts: '$$\n' },
    { delay, texts: '\n' },
    { delay, texts: '```python\n' },
    { delay, texts: '# ' },
    { delay, texts: 'Code ' },
    { delay, texts: 'block\n' },
    { delay, texts: 'print("Hello, ' },
    { delay, texts: 'World!")\n' },
    { delay, texts: '```\n\n' },
    { delay, texts: 'Horizontal ' },
    { delay, texts: 'rule\n\n' },
    { delay, texts: '---\n\n' },
    { delay, texts: '| ' },
    { delay, texts: 'Header ' },
    { delay, texts: '1 ' },
    { delay, texts: '| ' },
    { delay, texts: 'Header ' },
    { delay, texts: '2 ' },
    { delay, texts: '|\n' },
    {
      delay,
      texts: '|----------|----------|\n',
    },
    { delay, texts: '| ' },
    { delay, texts: 'Row ' },
    { delay, texts: '1   ' },
    { delay, texts: ' | ' },
    { delay, texts: 'Data    ' },
    { delay, texts: ' |\n' },
    { delay, texts: '| ' },
    { delay, texts: 'Row ' },
    { delay, texts: '2   ' },
    { delay, texts: ' | ' },
    { delay, texts: 'Data    ' },
    { delay, texts: ' |' },
  ],
];

const mdxChunks = [
  [
    {
      delay,
      texts: '## ',
    },
    {
      delay,
      texts: 'Basic ',
    },
    {
      delay,
      texts: 'Markdown\n\n',
    },
    {
      delay,
      texts: '> ',
    },
    {
      delay,
      texts: 'The ',
    },
    {
      delay,
      texts: 'following ',
    },
    {
      delay,
      texts: 'node ',
    },
    {
      delay,
      texts: 'and ',
    },
    {
      delay,
      texts: 'marks ',
    },
    {
      delay,
      texts: 'is ',
    },
    {
      delay,
      texts: 'supported ',
    },
    {
      delay,
      texts: 'by ',
    },
    {
      delay,
      texts: 'the ',
    },
    {
      delay,
      texts: 'Markdown ',
    },
    {
      delay,
      texts: 'standard.\n\n',
    },
    {
      delay,
      texts: 'Format ',
    },
    {
      delay,
      texts: 'text ',
    },
    {
      delay,
      texts: 'with **b',
    },
    {
      delay,
      texts: 'old**, _',
    },
    {
      delay,
      texts: 'italic_,',
    },
    {
      delay,
      texts: ' _**comb',
    },
    {
      delay,
      texts: 'ined sty',
    },
    {
      delay,
      texts: 'les**_, ',
    },
    {
      delay,
      texts: '~~strike',
    },
    {
      delay,
      texts: 'through~',
    },
    {
      delay,
      texts: '~, `code',
    },
    {
      delay,
      texts: '` format',
    },
    {
      delay,
      texts: 'ting, an',
    },
    {
      delay,
      texts: 'd [hyper',
    },
    {
      delay,
      texts: 'links](https://en.wikipedia.org/wiki/Hypertext).\n\n',
    },
    {
      delay,
      texts: '```javascript\n',
    },
    {
      delay,
      texts: '// Use code blocks to showcase code snippets\n',
    },
    {
      delay,
      texts: 'function greet() {\n',
    },
    {
      delay,
      texts: '  console.info("Hello World!")\n',
    },
    {
      delay,
      texts: '}\n',
    },
    {
      delay,
      texts: '```\n\n',
    },
    {
      delay,
      texts: '- Simple',
    },
    {
      delay,
      texts: ' lists f',
    },
    {
      delay,
      texts: 'or organ',
    },
    {
      delay,
      texts: 'izing co',
    },
    {
      delay,
      texts: 'ntent\n',
    },
    {
      delay,
      texts: '1. ',
    },
    {
      delay,
      texts: 'Numbered ',
    },
    {
      delay,
      texts: 'lists ',
    },
    {
      delay,
      texts: 'for ',
    },
    {
      delay,
      texts: 'sequential ',
    },
    {
      delay,
      texts: 'steps\n\n',
    },
    {
      delay,
      texts: '| **Plugin**  | **Element** | **Inline** | **Void** |\n',
    },
    {
      delay,
      texts: '| ----------- | ----------- | ---------- | -------- |\n',
    },
    {
      delay,
      texts: '| **Heading** |             |            | No       |\n',
    },
    {
      delay,
      texts: '| **Image**   | Yes         | No         | Yes      |\n',
    },
    {
      delay,
      texts: '| **Ment',
    },
    {
      delay,
      texts: 'ion** | Yes         | Yes        | Yes      |\n\n',
    },
    {
      delay,
      texts:
        '![](https://images.unsplash.com/photo-1712688930249-98e1963af7bd?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)\n\n',
    },
    {
      delay,
      texts: '- [x] Co',
    },
    {
      delay,
      texts: 'mpleted ',
    },
    {
      delay,
      texts: 'tasks\n',
    },
    {
      delay,
      texts: '- [ ] Pe',
    },
    {
      delay,
      texts: 'nding ta',
    },
    {
      delay,
      texts: 'sks\n\n',
    },
    {
      delay,
      texts: '---\n\n## Advan',
    },
    {
      delay,
      texts: 'ced Feat',
    },
    {
      delay,
      texts: 'ures\n\n',
    },
    {
      delay,
      texts: '<callout> ',
    },
    {
      delay,
      texts: 'The ',
    },
    {
      delay,
      texts: 'following ',
    },
    {
      delay,
      texts: 'node ',
    },
    {
      delay,
      texts: 'and ',
    },
    {
      delay,
      texts: 'marks ',
    },
    {
      delay,
      texts: 'are ',
    },
    {
      delay,
      texts: 'not ',
    },
    {
      delay,
      texts: 'supported ',
    },
    {
      delay,
      texts: 'in ',
    },
    {
      delay,
      texts: 'Markdown ',
    },
    {
      delay,
      texts: 'but ',
    },
    {
      delay,
      texts: 'can ',
    },
    {
      delay,
      texts: 'be ',
    },
    {
      delay,
      texts: 'serialized ',
    },
    {
      delay,
      texts: 'and ',
    },
    {
      delay,
      texts: 'deserialized ',
    },
    {
      delay,
      texts: 'using ',
    },
    {
      delay,
      texts: 'MDX ',
    },
    {
      delay,
      texts: 'or ',
    },
    {
      delay,
      texts: 'specialized ',
    },
    {
      delay,
      texts: 'UnifiedJS ',
    },
    {
      delay,
      texts: 'plugins. ',
    },
    {
      delay,
      texts: '</callout>\n\n',
    },
    {
      delay,
      texts: 'Advanced ',
    },
    {
      delay,
      texts: 'marks: ',
    },
    {
      delay,
      texts: '<kbd>⌘ ',
    },
    {
      delay,
      texts: '+ ',
    },
    {
      delay,
      texts: 'B</kbd>,<u>underlined</u>, ',
    },
    {
      delay,
      texts: '<mark',
    },
    {
      delay,
      texts: '>highli',
    },
    {
      delay,
      texts: 'ghted</m',
    },
    {
      delay,
      texts: 'ark',
    },
    {
      delay,
      texts: '> text, ',
    },
    {
      delay,
      texts: '<span s',
    },
    {
      delay,
      texts: 'tyle="co',
    },
    {
      delay,
      texts: 'lor: #93',
    },
    {
      delay,
      texts: 'C47D;">c',
    },
    {
      delay,
      texts: 'olored t',
    },
    {
      delay,
      texts: 'ext</spa',
    },
    {
      delay,
      texts: 'n> and ',
    },
    {
      delay,
      texts: '<spa',
    },
    {
      delay,
      texts: 'n',
    },
    {
      delay,
      texts: ' style="',
    },
    {
      delay,
      texts: 'backgrou',
    },
    {
      delay,
      texts: 'nd-color',
    },
    {
      delay,
      texts: ': #6C9EE',
    },
    {
      delay,
      texts: 'B;">back',
    },
    {
      delay,
      texts: 'ground h',
    },
    {
      delay,
      texts: 'ighlight',
    },
    {
      delay,
      texts: 's</spa',
    },
    {
      delay,
      texts: 'n> for ',
    },
    {
      delay,
      texts: 'visual e',
    },
    {
      delay,
      texts: 'mphasis.\n\n',
    },
    {
      delay,
      texts: 'Superscript ',
    },
    {
      delay,
      texts: 'like ',
    },
    {
      delay,
      texts: 'E=mc<sup>2</sup> ',
    },
    {
      delay,
      texts: 'and ',
    },
    {
      delay,
      texts: 'subscript ',
    },
    {
      delay,
      texts: 'like ',
    },
    {
      delay,
      texts: 'H<sub>2</sub>O ',
    },
    {
      delay,
      texts: 'demonstrate ',
    },
    {
      delay,
      texts: 'mathematical ',
    },
    {
      delay,
      texts: 'and ',
    },
    {
      delay,
      texts: 'chemical ',
    },
    {
      delay,
      texts: 'notation ',
    },
    {
      delay,
      texts: 'capabilities.\n\n',
    },
    {
      delay,
      texts: 'Add ',
    },
    {
      delay,
      texts: 'mentions ',
    },
    {
      delay,
      texts: 'like ',
    },
    {
      delay,
      texts: '@BB-8, d',
    },
    {
      delay,
      texts: 'ates (<d',
    },
    {
      delay,
      texts: 'ate>2025',
    },
    {
      delay,
      texts: '-05-08</',
    },
    {
      delay,
      texts: 'date>), ',
    },
    {
      delay,
      texts: 'and math',
    },
    {
      delay,
      texts: ' formula',
    },
    {
      delay,
      texts: 's ($E=mc',
    },
    {
      delay,
      texts: '^2$).\n\n',
    },
    {
      delay,
      texts: 'The ',
    },
    {
      delay,
      texts: 'table ',
    },
    {
      delay,
      texts: 'of ',
    },
    {
      delay,
      texts: 'contents ',
    },
    {
      delay,
      texts: 'feature ',
    },
    {
      delay,
      texts: 'automatically ',
    },
    {
      delay,
      texts: 'generates ',
    },
    {
      delay,
      texts: 'document ',
    },
    {
      delay,
      texts: 'structure ',
    },
    {
      delay,
      texts: 'for ',
    },
    {
      delay,
      texts: 'easy ',
    },
    {
      delay,
      texts: 'navigation.\n\n',
    },
    {
      delay,
      texts: '<toc ',
    },
    {
      delay,
      texts: '/>\n\n',
    },
    {
      delay,
      texts: 'Math ',
    },
    {
      delay,
      texts: 'formula ',
    },
    {
      delay,
      texts: 'support ',
    },
    {
      delay,
      texts: 'makes ',
    },
    {
      delay,
      texts: 'displaying ',
    },
    {
      delay,
      texts: 'complex ',
    },
    {
      delay,
      texts: 'mathematical ',
    },
    {
      delay,
      texts: 'expressions ',
    },
    {
      delay,
      texts: 'simple.\n\n',
    },
    {
      delay,
      texts: '$$\n',
    },
    {
      delay,
      texts: 'a^2',
    },
    {
      delay,
      texts: '+b^2',
    },
    {
      delay,
      texts: '=c^2\n',
    },
    {
      delay,
      texts: '$$\n\n',
    },
    {
      delay,
      texts: 'Multi-co',
    },
    {
      delay,
      texts: 'lumn lay',
    },
    {
      delay,
      texts: 'out feat',
    },
    {
      delay,
      texts: 'ures ena',
    },
    {
      delay,
      texts: 'ble rich',
    },
    {
      delay,
      texts: 'er page ',
    },
    {
      delay,
      texts: 'designs ',
    },
    {
      delay,
      texts: 'and cont',
    },
    {
      delay,
      texts: 'ent layo',
    },
    {
      delay,
      texts: 'uts.\n\n',
    },
    // {
    //  delay,
    //   texts: '<column_group layout="[50,50]">\n',
    // },
    // {
    //  delay,
    //   texts: '<column width="50%">\n',
    // },
    // {
    //  delay,
    //   texts: '  left\n',
    // },
    // {
    //  delay,
    //   texts: '</column>\n',
    // },
    // {
    //  delay,
    //   texts: '<column width="50%">\n',
    // },
    // {
    //  delay,
    //   texts: '  right\n',
    // },
    // {
    //  delay,
    //   texts: '</column>\n',
    // },
    // {
    //  delay,
    //   texts: '</column_group>\n\n',
    // },
    {
      delay,
      texts: 'PDF ',
    },
    {
      delay,
      texts: 'embedding ',
    },
    {
      delay,
      texts: 'makes ',
    },
    {
      delay,
      texts: 'document ',
    },
    {
      delay,
      texts: 'referencing ',
    },
    {
      delay,
      texts: 'simple ',
    },
    {
      delay,
      texts: 'and ',
    },
    {
      delay,
      texts: 'intuitive.\n\n',
    },
    {
      delay,
      texts: '<file ',
    },
    {
      delay,
      texts: 'name="sample.pdf" ',
    },
    {
      delay,
      texts: 'align="center" ',
    },
    {
      delay,
      texts:
        'src="https://s26.q4cdn.com/900411403/files/doc_downloads/test.pdf" width="80%" isUpload="true" />\n\n',
    },
    {
      delay,
      texts: 'Audio ',
    },
    {
      delay,
      texts: 'players ',
    },
    {
      delay,
      texts: 'can ',
    },
    {
      delay,
      texts: 'be ',
    },
    {
      delay,
      texts: 'embedded ',
    },
    {
      delay,
      texts: 'directly ',
    },
    {
      delay,
      texts: 'into ',
    },
    {
      delay,
      texts: 'documents, ',
    },
    {
      delay,
      texts: 'supporting ',
    },
    {
      delay,
      texts: 'online ',
    },
    {
      delay,
      texts: 'audio ',
    },
    {
      delay,
      texts: 'resources.\n\n',
    },
    {
      delay,
      texts: '<audio ',
    },
    {
      delay,
      texts: 'align="center" ',
    },
    {
      delay,
      texts:
        'src="https://samplelib.com/lib/preview/mp3/sample-3s.mp3" width="80%" />\n\n',
    },
    {
      delay,
      texts: 'Video ',
    },
    {
      delay,
      texts: 'playback ',
    },
    {
      delay,
      texts: 'features ',
    },
    {
      delay,
      texts: 'support ',
    },
    {
      delay,
      texts: 'embedding ',
    },
    {
      delay,
      texts: 'various ',
    },
    {
      delay,
      texts: 'online ',
    },
    {
      delay,
      texts: 'video ',
    },
    {
      delay,
      texts: 'resources, ',
    },
    {
      delay,
      texts: 'enriching ',
    },
    {
      delay,
      texts: 'document ',
    },
    {
      delay,
      texts: 'content.\n\n',
    },
    {
      delay,
      texts: '<video ',
    },
    {
      delay,
      texts: 'align="center" ',
    },
    {
      delay,
      texts:
        'src="https://videos.pexels.com/video-files/6769791/6769791-uhd_2560_1440_24fps.mp4" width="80%" isUpload="true" />',
    },
  ],
];

const createCommentChunks = (editor: PlateEditor) => {
  const selectedBlocksApi = editor.getApi(BlockSelectionPlugin).blockSelection;

  const selectedBlocks = selectedBlocksApi
    .getNodes({
      selectionFallback: true,
      sort: true,
    })
    .map(([block]) => block);

  const isSelectingSome = editor.getOption(
    BlockSelectionPlugin,
    'isSelectingSome'
  );

  const blocks =
    selectedBlocks.length > 0 && (editor.api.isExpanded() || isSelectingSome)
      ? selectedBlocks
      : editor.children;

  const max = blocks.length;

  const commentCount = Math.ceil(max / 2);

  const result = new Set<number>();

  while (result.size < commentCount) {
    const num = Math.floor(Math.random() * max); // 0 to max-1 (fixed: was 1 to max)
    result.add(num);
  }

  const indexes = Array.from(result).sort((a, b) => a - b);

  const chunks = indexes
    .map((index, i) => {
      const block = blocks[index];
      if (!block) {
        return [];
      }

      const blockString = NodeApi.string(block);
      const endIndex = blockString.indexOf('.');
      const content =
        endIndex === -1 ? blockString : blockString.slice(0, endIndex);

      return [
        {
          delay: faker.number.int({ max: 500, min: 200 }),
          texts: `{"id":"${nanoid()}","data":{"comment":{"blockId":"${block.id}","comment":"${faker.lorem.sentence()}","content":"${content}"},"status":"${i === indexes.length - 1 ? 'finished' : 'streaming'}"},"type":"data-comment"}`,
        },
      ];
    })
    .filter((chunk) => chunk.length > 0);

  const result_chunks = [
    [{ delay: 50, texts: '{"data":"comment","type":"data-toolName"}' }],
    ...chunks,
  ];

  return result_chunks;
};

const createTableCellChunks = (editor: PlateEditor) => {
  // Get selected table cells from the TablePlugin
  const selectedCells =
    editor.getOption({ key: KEYS.table }, 'selectedCells') || [];

  // If no cells selected, try to get cells from current selection
  let cellIds: string[] = [];

  if (selectedCells.length > 0) {
    cellIds = selectedCells
      .map((cell: { id?: string }) => cell.id)
      .filter(Boolean);
  } else {
    // Try to find table cells in current selection
    const cells = Array.from(
      editor.api.nodes({
        at: editor.selection ?? undefined,
        match: (n) =>
          (n as { type?: string }).type === KEYS.td ||
          (n as { type?: string }).type === KEYS.th,
      })
    );
    cellIds = cells
      .map(([node]) => (node as { id?: string }).id)
      .filter(Boolean) as string[];
  }

  // If still no cells, return empty chunks
  if (cellIds.length === 0) {
    return [
      [{ delay: 50, texts: '{"data":"edit","type":"data-toolName"}' }],
      [
        {
          delay: 100,
          texts: `{"id":"${nanoid()}","data":{"cellUpdate":null,"status":"finished"},"type":"data-table"}`,
        },
      ],
    ];
  }

  // Generate mock content for each cell
  const chunks = cellIds.map((cellId, i) => [
    {
      delay: faker.number.int({ max: 300, min: 100 }),
      texts: `{"id":"${nanoid()}","data":{"cellUpdate":{"id":"${cellId}","content":"${faker.lorem.sentence()}"},"status":"${i === cellIds.length - 1 ? 'finished' : 'streaming'}"},"type":"data-table"}`,
    },
  ]);

  const result_chunks = [
    [{ delay: 50, texts: '{"data":"edit","type":"data-toolName"}' }],
    ...chunks,
  ];

  return result_chunks;
};

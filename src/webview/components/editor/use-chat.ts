'use client';

import * as React from 'react';

import { type UseChatHelpers, useChat as useBaseChat } from '@ai-sdk/react';
import { AIChatPlugin } from '@platejs/ai/react';
import { type UIMessage } from 'ai';
import { useEditorRef, usePluginOption } from 'platejs/react';

import { aiChatPlugin } from '@/components/editor/plugins/ai-kit';
import {
  addCommentDiscussionFromText,
  addStructuredTextBelow,
  applyInlineStructuredSuggestion,
  beginStreamingInsert,
  handleAiDataPart,
  streamStructuredAddDelta,
  type MessageDataPart,
} from '@/components/editor/ai-editor-actions';
import { extractAiMessageText } from '../../../shared/ai-message-normalization';
import { createAiCommandTransport } from '@/lib/ai-command-request';
import {
  parseStructuredResponse,
  stripStructuredResponseWrappers,
  type StructuredResponseAction,
} from '@/lib/structured-response';

export type { MessageDataPart, ToolName, TComment, TTableCellUpdate } from './ai-editor-actions';
export { stripStructuredResponseWrappers };

export type Chat = UseChatHelpers<ChatMessage>;
export type ChatMessage = UIMessage<{}, MessageDataPart>;

const getLatestAssistantText = (messages: ChatMessage[]) => {
  const latestAssistant = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant');

  if (!latestAssistant) {
    return null;
  }

  const content = extractAiMessageText(latestAssistant);
  if (!content) {
    return null;
  }

  return {
    content,
    id: latestAssistant.id,
  };
};

export const useChat = () => {
  const editor = useEditorRef();
  const options = usePluginOption(aiChatPlugin, 'chatOptions');

  const chat = useBaseChat<ChatMessage>({
    id: 'editor',
    transport: createAiCommandTransport(
      () => editor.getOptions(aiChatPlugin).chatOptions?.body as
        | Record<string, unknown>
        | undefined
    ),
    onData(data) {
      handleAiDataPart(editor, data);
    },
    ...options,
  });

  const handledCommentMessageIdRef = React.useRef<string | null>(null);
  const streamedStructuredRef = React.useRef<{
    action: StructuredResponseAction;
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

      streamStructuredAddDelta(editor, delta);
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
        applyInlineStructuredSuggestion(editor, parsed.content);
      }

      if (parsed.action === 'add') {
        const streamed = streamedStructuredRef.current;
        if (!streamed || streamed.id !== latestAssistant.id) {
          addStructuredTextBelow(editor, parsed.content);
        }
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

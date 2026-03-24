'use client';

import * as React from 'react';

import { serializeMd } from '@platejs/markdown';
import { BlockSelectionPlugin } from '@platejs/selection/react';
import {
  BoldIcon,
  Code2Icon,
  ItalicIcon,
  MessageSquarePlusIcon,
  StrikethroughIcon,
  UnderlineIcon,
  WandSparklesIcon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorReadOnly, useEditorRef } from 'platejs/react';

import { ENABLE_ADD_TO_CHAT, ENABLE_AI_FEATURES } from '../../../shared/feature-flags';
import { useAiEnabled } from '@/hooks/use-ai-enabled';
import { postToHost } from '@/vscode';

import { AIToolbarButton } from './ai-toolbar-button';
import { CommentToolbarButton } from './comment-toolbar-button';
import { InlineEquationToolbarButton } from './equation-toolbar-button';
import { LinkToolbarButton } from './link-toolbar-button';
import { MarkToolbarButton } from './mark-toolbar-button';
import { MoreToolbarButton } from './more-toolbar-button';
import { SuggestionToolbarButton } from './suggestion-toolbar-button';
import { ToolbarButton, ToolbarGroup } from './toolbar';
import { TurnIntoToolbarButton } from './turn-into-toolbar-button';

export function FloatingToolbarButtons() {
  const readOnly = useEditorReadOnly();
  const editor = useEditorRef();
  const aiEnabled = useAiEnabled();

  return (
    <>
      {!readOnly && (
        <>
          {aiEnabled && (
            <ToolbarGroup>
              <AIToolbarButton tooltip="AI commands">
                <WandSparklesIcon />
                Ask AI
              </AIToolbarButton>
            </ToolbarGroup>
          )}

          <ToolbarGroup>
            <TurnIntoToolbarButton />

            <MarkToolbarButton nodeType={KEYS.bold} tooltip="Bold (⌘+B)">
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.italic} tooltip="Italic (⌘+I)">
              <ItalicIcon />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={KEYS.underline}
              tooltip="Underline (⌘+U)"
            >
              <UnderlineIcon />
            </MarkToolbarButton>

            <MarkToolbarButton
              nodeType={KEYS.strikethrough}
              tooltip="Strikethrough (⌘+⇧+M)"
            >
              <StrikethroughIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.code} tooltip="Code (⌘+E)">
              <Code2Icon />
            </MarkToolbarButton>

            <InlineEquationToolbarButton />

            <LinkToolbarButton />

            {ENABLE_ADD_TO_CHAT && (
              <ToolbarButton
                tooltip="Add to chat"
                onMouseDown={(event) => {
                  event.preventDefault();
                }}
                onClick={() => {
                  let markdown = '';

                  try {
                    const blocks = editor
                      .getApi(BlockSelectionPlugin)
                      .blockSelection.getNodes({ sort: true })
                      .map(([block]) => block);

                    if (blocks.length > 0) {
                      markdown = serializeMd(editor, { value: blocks as any });
                    } else {
                      const fragment = editor.api.fragment();
                      if (fragment && fragment.length > 0) {
                        markdown = serializeMd(editor, { value: fragment as any });
                      } else {
                        markdown = serializeMd(editor, { value: editor.children as any });
                      }
                    }
                  } catch {
                    markdown = '';
                  }

                  const normalized = markdown.replace(/\r\n/g, '\n').trim();
                  if (!normalized) {
                    return;
                  }

                  postToHost({
                    type: 'addSelectedBlocksToChat',
                    taskDescription: normalized,
                  });
                }}
              >
                <MessageSquarePlusIcon />
                Add to chat
              </ToolbarButton>
            )}
          </ToolbarGroup>
        </>
      )}

      <ToolbarGroup>
        <CommentToolbarButton />
        <SuggestionToolbarButton />

        {!readOnly && <MoreToolbarButton />}
      </ToolbarGroup>
    </>
  );
}

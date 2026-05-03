'use client';

import * as React from 'react';

import { WandSparklesIcon } from 'lucide-react';
import { useEditorReadOnly } from 'platejs/react';

import { useAiEnabled } from '@/hooks/use-ai-enabled';

import { AIToolbarButton } from './ai-toolbar-button';
import { BasicMarkToolbarButtons } from './basic-mark-toolbar-buttons';
import { CommentToolbarButton } from './comment-toolbar-button';
import { InlineEquationToolbarButton } from './equation-toolbar-button';
import { LinkToolbarButton } from './link-toolbar-button';
import { MoreToolbarButton } from './more-toolbar-button';
import { SuggestionToolbarButton } from './suggestion-toolbar-button';
import { ToolbarGroup } from './toolbar';
import { TurnIntoToolbarButton } from './turn-into-toolbar-button';

export function FloatingToolbarButtons() {
  const readOnly = useEditorReadOnly();
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

            <BasicMarkToolbarButtons />

            <InlineEquationToolbarButton />

            <LinkToolbarButton />
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

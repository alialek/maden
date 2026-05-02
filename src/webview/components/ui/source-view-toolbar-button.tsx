'use client';

import { SquareSplitHorizontalIcon } from 'lucide-react';

import { postToHost } from '@/vscode';

import { ToolbarButton } from './toolbar';

export function SourceViewToolbarButton() {
  return (
    <ToolbarButton
      tooltip="Open source view (split)"
      onClick={() => {
        postToHost({ type: 'openSourceView' });
      }}
    >
      <SquareSplitHorizontalIcon />
    </ToolbarButton>
  );
}

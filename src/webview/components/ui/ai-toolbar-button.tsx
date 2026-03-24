'use client';

import * as React from 'react';

import { AIChatPlugin } from '@platejs/ai/react';
import { useEditorPlugin } from 'platejs/react';

import { ToolbarButton } from './toolbar';

export function AIToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const { api } = useEditorPlugin(AIChatPlugin);
  const { onClick, onMouseDown, ...rest } = props;

  return (
    <ToolbarButton
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        api.aiChat.show();
      }}
      onMouseDown={(event) => {
        onMouseDown?.(event);
        event.preventDefault();
        event.stopPropagation();
        api.aiChat.show();
      }}
    />
  );
}

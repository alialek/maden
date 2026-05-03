'use client';

import { AIChatPlugin } from '@platejs/ai/react';

export const madenAiChatPlugin = AIChatPlugin.extend({
  options: {
    chatOptions: {
      api: '/api/ai/command',
      body: {},
    },
    madenAnchorPath: null,
    madenAnchorRect: null,
  },
});

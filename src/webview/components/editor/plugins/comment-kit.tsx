'use client';

import { CommentLeaf } from '@/components/ui/comment-node';

import { commentPlugin } from './comment-plugin';

export { commentPlugin } from './comment-plugin';
export type { CommentConfig } from './comment-plugin';

export const CommentKit = [
  commentPlugin.configure({
    node: { component: CommentLeaf },
    shortcuts: {
      setDraft: { keys: 'mod+shift+m' },
    },
  }),
];

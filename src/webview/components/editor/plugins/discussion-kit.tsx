'use client';

import { BlockDiscussion } from '@/components/ui/block-discussion';

import { discussionPlugin } from './discussion-plugin';

export { discussionPlugin } from './discussion-plugin';
export type { TComment, TDiscussion } from './discussion-types';

export const DiscussionKit = [
  discussionPlugin.configure({
    render: { aboveNodes: BlockDiscussion },
  }),
];

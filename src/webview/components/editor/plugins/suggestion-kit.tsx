'use client';

import {
  SuggestionLeaf,
  SuggestionLineBreak,
} from '@/components/ui/suggestion-node';

import {
  type SuggestionConfig,
  suggestionPlugin,
} from './suggestion-plugin';

export { suggestionPlugin } from './suggestion-plugin';
export type { SuggestionConfig } from './suggestion-plugin';

export const SuggestionKit = [
  suggestionPlugin.configure({
    render: {
      belowNodes: SuggestionLineBreak as any,
      node: SuggestionLeaf,
    },
  }),
];

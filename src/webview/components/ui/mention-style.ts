import type { TMentionElement } from 'platejs';

import { KEYS } from 'platejs';

export const getMentionMarkClassNames = (element: TMentionElement) => [
  element.children[0][KEYS.bold] === true && 'font-bold',
  element.children[0][KEYS.italic] === true && 'italic',
  element.children[0][KEYS.underline] === true && 'underline',
];

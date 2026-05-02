import path from 'node:path';

export { reconcileMarkdownPreservingUnchangedFormatting } from '../shared/markdown-format-reconcile';

export const DEFAULT_DEBOUNCE_MS = 300;

export function getFileNameWithoutExtension(filePath: string): string {
  const parsed = path.parse(filePath);
  return parsed.name || 'Untitled';
}

export function enforceTitleHeading(markdown: string, filePath: string): string {
  void filePath;
  return markdown.replace(/\r\n/g, '\n');
}

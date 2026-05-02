import { BaseEditorKit } from './editor-base-kit';

// IMPORTANT: This is the single plugin set for Markdown <-> Plate conversion.
// The webview document import path, tests, and scripts/debug-markdown.mjs must
// all use this kit through markdown-plate-conversion.ts. Do not duplicate or
// reimplement conversion-only plugin lists in the extension or console tooling.
export const MarkdownConversionKit = BaseEditorKit;

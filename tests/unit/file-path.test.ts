import { describe, expect, it } from 'vitest';

import {
  normalizeDroppedPath,
  resolveMediaInsertUrl,
  toRelativeFromDocument,
} from '../../src/webview/lib/file-path';

describe('file-path utilities', () => {
  const setDocumentPath = (value: string, workspaceRoots: string[] = []) => {
    (globalThis as {
      window?: {
        __MADEN_DOCUMENT_PATH__?: string;
        __MADEN_WORKSPACE_ROOTS__?: string[];
      };
    }).window = {
      __MADEN_DOCUMENT_PATH__: value,
      __MADEN_WORKSPACE_ROOTS__: workspaceRoots,
    };
  };

  it('normalizes file uri into filesystem path', () => {
    expect(normalizeDroppedPath('file:///workspace/test/image.png')).toBe('/workspace/test/image.png');
  });

  it('resolves relative path from current document', () => {
    setDocumentPath('/workspace/project/docs/note.md');
    const relative = toRelativeFromDocument('/workspace/project/assets/image.png');

    expect(relative).toBe('../assets/image.png');
  });

  it('resolves media URL from file path when available', () => {
    setDocumentPath('/workspace/project/docs/note.md', ['/workspace/project']);
    const file = { path: '/workspace/project/assets/image.png' } as File & { path: string };

    expect(resolveMediaInsertUrl({ file })).toBe('../assets/image.png');
  });

  it('uses absolute path when file is outside workspace roots', () => {
    setDocumentPath('/workspace/project/docs/note.md', ['/workspace/project']);
    const file = { path: '/external/storage/image.png' } as File & { path: string };

    expect(resolveMediaInsertUrl({ file })).toBe('/external/storage/image.png');
  });

  it('falls back to blob URL when local file path is unavailable', () => {
    const file = new File(['x'], 'image.png', { type: 'image/png' });
    const value = resolveMediaInsertUrl({ file });

    expect(value.startsWith('blob:')).toBe(true);
  });
});

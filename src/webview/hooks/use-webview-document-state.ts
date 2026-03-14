import * as React from 'react';

import { ENABLE_AI_FEATURES } from '../../shared/feature-flags';
import type { HostToWebviewMessage } from '../../shared/messages';

import { postToHost } from '@/vscode';

export type DocumentState = {
  aiEnabled: boolean;
  fileName: string;
  filePath: string;
  markdown: string;
  readOnly: boolean;
  workspacePaths: string[];
};

export const DEV_FALLBACK_MARKDOWN = `# untitled

This is standalone browser mode for the Maden webview.

- Turn into dropdown should open
- Floating toolbar should remain visible while interacting
- Drag handles should appear on block hover`;

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, '\n');

export const useWebviewDocumentState = () => {
  const [documentState, setDocumentState] = React.useState<DocumentState | null>(null);

  React.useEffect(() => {
    const isStandaloneBrowser = typeof window.acquireVsCodeApi !== 'function';

    const listener = (event: MessageEvent<HostToWebviewMessage>) => {
      const message = event.data;

      if (message.type === 'setReadonly') {
        setDocumentState((current) =>
          current
            ? {
                ...current,
                readOnly: message.readOnly,
              }
            : current
        );
        return;
      }

      if (message.type === 'initDocument') {
        setDocumentState({
          aiEnabled: message.aiEnabled,
          fileName: message.fileName,
          filePath: message.filePath,
          markdown: normalizeLineEndings(message.markdown),
          readOnly: message.readOnly,
          workspacePaths: message.workspacePaths,
        });
        return;
      }

      if (message.type !== 'externalDocumentUpdated') {
        return;
      }

      const incoming = normalizeLineEndings(message.markdown);

      setDocumentState((current) => {
        if (!current) {
          return {
            aiEnabled: message.aiEnabled,
            fileName: message.fileName,
            filePath: message.filePath,
            markdown: incoming,
            readOnly: message.readOnly,
            workspacePaths: message.workspacePaths,
          };
        }

        if (incoming === current.markdown) {
          return {
            ...current,
            aiEnabled: message.aiEnabled,
            fileName: message.fileName,
            filePath: message.filePath,
            readOnly: message.readOnly,
            workspacePaths: message.workspacePaths,
          };
        }

        return {
          ...current,
          markdown: incoming,
          aiEnabled: message.aiEnabled,
          fileName: message.fileName,
          filePath: message.filePath,
          readOnly: message.readOnly,
          workspacePaths: message.workspacePaths,
        };
      });
    };

    window.addEventListener('message', listener);
    postToHost({ type: 'ready' });

    if (isStandaloneBrowser) {
      setDocumentState({
        aiEnabled: false,
        fileName: 'untitled.md',
        filePath: 'untitled.md',
        markdown: DEV_FALLBACK_MARKDOWN,
        readOnly: false,
        workspacePaths: [],
      });
    }

    return () => {
      window.removeEventListener('message', listener);
    };
  }, []);

  React.useEffect(() => {
    (window as Window & { __MADEN_AI_ENABLED__?: boolean }).__MADEN_AI_ENABLED__ =
      (documentState?.aiEnabled ?? false) && ENABLE_AI_FEATURES;
  }, [documentState?.aiEnabled]);

  React.useEffect(() => {
    (window as Window & { __MADEN_DOCUMENT_PATH__?: string }).__MADEN_DOCUMENT_PATH__ =
      documentState?.filePath;
  }, [documentState?.filePath]);

  React.useEffect(() => {
    (window as Window & { __MADEN_WORKSPACE_ROOTS__?: string[] }).__MADEN_WORKSPACE_ROOTS__ =
      documentState?.workspacePaths ?? [];
  }, [documentState?.workspacePaths]);

  return {
    documentState,
  };
};

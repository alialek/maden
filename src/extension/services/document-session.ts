import type { HostToWebviewMessage } from '../../shared/messages';

export type DocumentSession = {
  filePath: string;
  key: string;
  markdown: string;
};

export const createDocumentSession = ({
  filePath,
  key,
  markdown,
}: DocumentSession): DocumentSession => ({
  filePath,
  key,
  markdown,
});

export const createStateMessage = ({
  aiEnabled,
  fileName,
  filePath,
  markdown,
  readOnly,
  type,
  workspacePaths,
}: {
  aiEnabled: boolean;
  fileName: string;
  filePath: string;
  markdown: string;
  readOnly: boolean;
  type: Extract<HostToWebviewMessage['type'], 'initDocument' | 'externalDocumentUpdated'>;
  workspacePaths: string[];
}): HostToWebviewMessage => ({
  type,
  markdown,
  fileName,
  filePath,
  workspacePaths,
  readOnly,
  aiEnabled,
});

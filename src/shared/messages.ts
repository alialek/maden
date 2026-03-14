export type HostToWebviewMessage =
  | {
    type: 'initDocument';
    markdown: string;
    fileName: string;
    filePath: string;
    workspacePaths: string[];
    readOnly: boolean;
    aiEnabled: boolean;
  }
  | {
    type: 'externalDocumentUpdated';
    markdown: string;
    fileName: string;
    filePath: string;
    workspacePaths: string[];
    readOnly: boolean;
    aiEnabled: boolean;
  }
  | {
    type: 'setReadonly';
    readOnly: boolean;
  };

export type WebviewToHostMessage =
  | {
    type: 'ready';
  }
  | {
    type: 'documentChanged';
    markdown: string;
  }
  | {
    type: 'addSelectedBlocksToChat';
    taskDescription: string;
  }
  | {
    type: 'saveExportFile';
    base64: string;
    mimeType: string;
    suggestedFileName: string;
  }
  | {
    type: 'webviewError';
    message: string;
    stack?: string;
    source?: string;
  };

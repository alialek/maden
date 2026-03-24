export type AiProviderId =
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'openrouter'
  | 'codex-cli'
  | 'gigachat-openai-compatible'
  | 'gigachat-native'
  | 'gigachat';

export type AiRequestRoute = 'command' | 'copilot';

export type GigaChatMode = 'native' | 'openaiCompatible';

export type AiSettingsInput = {
  enabled: boolean;
  provider: AiProviderId;
  model: string;
  maxTokens?: number;
  temperature?: number;
  baseUrl?: string;
  apiKey?: string;
  gigachatMode?: GigaChatMode;
  gigachatClientId?: string;
  gigachatClientSecret?: string;
  gigachatScope?: string;
};

export type AiSettingsPublic = Omit<
  AiSettingsInput,
  'apiKey' | 'gigachatClientId' | 'gigachatClientSecret'
> & {
  hasApiKey: boolean;
  hasGigaChatClientId: boolean;
  hasGigaChatClientSecret: boolean;
};

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
  }
  | {
    type: 'setAiEnabled';
    aiEnabled: boolean;
  }
  | {
    type: 'aiSettingsState';
    settings: AiSettingsPublic;
  }
  | {
    type: 'aiStreamChunk';
    requestId: string;
    chunk: string;
  }
  | {
    type: 'aiStreamEnd';
    requestId: string;
  }
  | {
    type: 'aiStreamError';
    requestId: string;
    message: string;
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
  }
  | {
    type: 'aiSettingsLoad';
  }
  | {
    type: 'aiSettingsSave';
    settings: AiSettingsInput;
  }
  | {
    type: 'aiRequestStart';
    requestId: string;
    route: AiRequestRoute;
    body: string;
  }
  | {
    type: 'aiRequestCancel';
    requestId: string;
  };

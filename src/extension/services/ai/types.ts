import type { ChildProcess } from 'node:child_process';

import type {
  AiProviderId,
  AiRequestRoute,
  AiSettingsInput,
} from '../../../shared/messages';
import type { NormalizedAiMessage } from '../../../shared/ai-message-normalization';

export type NormalizedMessage = NormalizedAiMessage;

export type ResolvedProvider =
  | 'codex-cli'
  | 'qwen-cli'
  | 'gigachat-cli'
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'openrouter'
  | 'gigachat-openai-compatible'
  | 'gigachat-native';

export type AiRuntimeStreamHandlers = {
  onChunk: (chunk: string) => void;
  onEnd: () => void;
  onError: (message: string) => void;
};

export type StoredAiSettings = AiSettingsInput;

export type RequestBodyOverrides = {
  apiKey?: string;
  baseUrl?: string;
  gigachatClientId?: string;
  gigachatClientSecret?: string;
  gigachatMode?: 'native' | 'openaiCompatible';
  gigachatScope?: string;
  maxTokens?: number;
  model?: string;
  provider?: AiProviderId;
  temperature?: number;
};

export type ResolvedRequestConfig = {
  apiKey?: string;
  baseUrl: string;
  enabled: boolean;
  gigachatClientId?: string;
  gigachatClientSecret?: string;
  gigachatScope?: string;
  maxTokens?: number;
  messages: NormalizedMessage[];
  model: string;
  provider: ResolvedProvider;
  route: AiRequestRoute;
  temperature?: number;
};

export type CliProcessRegistry = Map<string, ChildProcess>;

import * as vscode from 'vscode';
import { spawn, type ChildProcess } from 'node:child_process';
import { readFile, unlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import type {
  AiProviderId,
  AiRequestRoute,
  AiSettingsInput,
  AiSettingsPublic,
} from '../../shared/messages';

const AI_SETTINGS_SECRET_KEY = 'maden.ai.settings.v1';

type NormalizedMessage = {
  content: string;
  role: 'assistant' | 'system' | 'user';
};

type ResolvedProvider =
  | 'codex-cli'
  | 'openai'
  | 'anthropic'
  | 'gemini'
  | 'openrouter'
  | 'gigachat-openai-compatible'
  | 'gigachat-native';

type AiRuntimeStreamHandlers = {
  onChunk: (chunk: string) => void;
  onEnd: () => void;
  onError: (message: string) => void;
};

type StoredAiSettings = AiSettingsInput;

type RequestBodyOverrides = {
  apiKey?: string;
  baseUrl?: string;
  enabled?: boolean;
  gigachatClientId?: string;
  gigachatClientSecret?: string;
  gigachatMode?: 'native' | 'openaiCompatible';
  gigachatScope?: string;
  maxTokens?: number;
  model?: string;
  provider?: AiProviderId;
  temperature?: number;
};

type ResolvedRequestConfig = {
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

const DEFAULT_SETTINGS: StoredAiSettings = {
  baseUrl: '',
  enabled: false,
  gigachatMode: 'native',
  model: '',
  provider: 'openai',
};

const defaultModelByProvider: Record<ResolvedProvider, string> = {
  'codex-cli': 'gpt-5-codex',
  anthropic: 'claude-3-7-sonnet-latest',
  gemini: 'gemini-2.5-flash',
  'gigachat-native': 'GigaChat-2-Max',
  'gigachat-openai-compatible': 'GigaChat-2-Max',
  openai: 'gpt-4o-mini',
  openrouter: 'openai/gpt-4o-mini',
};

const envApiKeyByProvider: Record<ResolvedProvider, string[]> = {
  'codex-cli': [],
  anthropic: ['ANTHROPIC_API_KEY'],
  gemini: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'],
  'gigachat-native': ['GIGACHAT_API_KEY', 'GIGACHAT_NATIVE_ACCESS_TOKEN'],
  'gigachat-openai-compatible': ['GIGACHAT_API_KEY'],
  openai: ['OPENAI_API_KEY'],
  openrouter: ['OPENROUTER_API_KEY'],
};

const toPublicSettings = (settings: StoredAiSettings): AiSettingsPublic => ({
  baseUrl: settings.baseUrl ?? '',
  enabled: settings.enabled,
  gigachatMode: settings.gigachatMode ?? 'native',
  gigachatScope: settings.gigachatScope ?? '',
  hasApiKey: Boolean(settings.apiKey?.trim()),
  hasGigaChatClientId: Boolean(settings.gigachatClientId?.trim()),
  hasGigaChatClientSecret: Boolean(settings.gigachatClientSecret?.trim()),
  model: settings.model,
  provider: settings.provider,
});

const sanitizeSettings = (
  previous: StoredAiSettings,
  next: AiSettingsInput
): StoredAiSettings => {
  const trimOptional = (value: string | undefined) => value?.trim() ?? undefined;

  return {
    ...previous,
    ...next,
    apiKey:
      next.apiKey === undefined
        ? previous.apiKey
        : trimOptional(next.apiKey) || undefined,
    baseUrl:
      next.baseUrl === undefined
        ? previous.baseUrl
        : trimOptional(next.baseUrl) ?? '',
    gigachatClientId:
      next.gigachatClientId === undefined
        ? previous.gigachatClientId
        : trimOptional(next.gigachatClientId) || undefined,
    gigachatClientSecret:
      next.gigachatClientSecret === undefined
        ? previous.gigachatClientSecret
        : trimOptional(next.gigachatClientSecret) || undefined,
    gigachatScope:
      next.gigachatScope === undefined
        ? previous.gigachatScope
        : trimOptional(next.gigachatScope) ?? '',
    model:
      next.model === undefined
        ? previous.model
        : trimOptional(next.model) ?? '',
  };
};

const createSseEnvelope = (id: string) => ({
  finish: () => `data: {"type":"finish"}\n\n`,
  finishStep: () => `data: {"type":"finish-step"}\n\n`,
  start: () => `data: {"type":"start"}\n\n`,
  startStep: () => `data: {"type":"start-step"}\n\n`,
  textDelta: (text: string) =>
    `data: {"type":"text-delta","id":"${id}","delta":${JSON.stringify(text)}}\n\n`,
  textEnd: () => `data: {"type":"text-end","id":"${id}"}\n\n`,
  textStart: () =>
    `data: {"type":"text-start","id":"${id}","providerMetadata":{"maden":{"itemId":"${id}"}}}\n\n`,
});

const trimSlash = (value: string) => value.replace(/\/+$/, '');

const joinUrl = (base: string, suffix: string) =>
  `${trimSlash(base)}/${suffix.replace(/^\/+/, '')}`;

const readTextParts = (value: unknown): string[] => {
  if (typeof value === 'string') {
    return [value];
  }

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((part) => {
      if (typeof part === 'string') {
        return part;
      }

      if (!part || typeof part !== 'object') {
        return '';
      }

      const maybePart = part as { text?: unknown; type?: unknown; content?: unknown };
      if (typeof maybePart.text === 'string') {
        return maybePart.text;
      }

      if (maybePart.type === 'text' && typeof maybePart.content === 'string') {
        return maybePart.content;
      }

      return '';
    })
    .filter((part) => part.length > 0);
};

const extractMarkdownFromPotentialJson = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return trimmed;
  }

  try {
    const parsed = JSON.parse(trimmed) as
      | {
          input?: unknown;
          messages?: unknown;
          prompt?: unknown;
          selectedContext?: unknown;
          userPrompt?: unknown;
        }
      | unknown[];

    if (Array.isArray(parsed)) {
      return trimmed;
    }

    if (typeof parsed.selectedContext === 'string' && parsed.selectedContext.trim()) {
      return parsed.selectedContext.trim();
    }
    if (typeof parsed.userPrompt === 'string' && parsed.userPrompt.trim()) {
      return parsed.userPrompt.trim();
    }
    if (typeof parsed.input === 'string' && parsed.input.trim()) {
      return parsed.input.trim();
    }
    if (typeof parsed.prompt === 'string' && parsed.prompt.trim()) {
      return parsed.prompt.trim();
    }

    if (Array.isArray(parsed.messages)) {
      const nested = normalizeIncomingMessages({ messages: parsed.messages });
      const latestUser = [...nested].reverse().find((message) => message.role === 'user');
      if (latestUser?.content) {
        return latestUser.content;
      }
    }
  } catch {
    // Keep original text if payload is not JSON.
  }

  return trimmed;
};

const normalizeIncomingMessages = (
  parsed: { messages?: unknown }
): NormalizedMessage[] => {
  const source = Array.isArray(parsed.messages) ? parsed.messages : [];

  const normalized = source
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const message = entry as {
        content?: unknown;
        parts?: unknown;
        role?: unknown;
      };

      const role = message.role;
      if (role !== 'assistant' && role !== 'system' && role !== 'user') {
        return null;
      }

      const text = [
        ...readTextParts(message.parts),
        ...readTextParts(message.content),
      ]
        .join('\n')
        .trim();

      if (!text) {
        return null;
      }

      const normalizedText = extractMarkdownFromPotentialJson(text);
      if (!normalizedText) {
        return null;
      }

      return {
        content: normalizedText,
        role,
      } as NormalizedMessage;
    })
    .filter((value): value is NormalizedMessage => value !== null);

  return normalized.length > 0
    ? normalized
    : [
        {
          content: 'Help with the current text.',
          role: 'user',
        },
      ];
};

const prependSelectedContextMessage = (
  messages: NormalizedMessage[],
  selectedContext: string | undefined
): NormalizedMessage[] => {
  const context = selectedContext?.trim();
  if (!context) {
    return messages;
  }

  return [
    {
      content: `Selected content:\n${context}`,
      role: 'user',
    },
    ...messages,
  ];
};

const parseRequestBody = (
  rawBody: string
): { messages: NormalizedMessage[]; overrides: RequestBodyOverrides } => {
  try {
    const parsed = JSON.parse(rawBody) as {
      apiKey?: unknown;
      baseUrl?: unknown;
      enabled?: unknown;
      gigachatClientId?: unknown;
      gigachatClientSecret?: unknown;
      gigachatMode?: unknown;
      gigachatScope?: unknown;
      maxTokens?: unknown;
      messages?: unknown;
      model?: unknown;
      provider?: unknown;
      selectedContext?: unknown;
      temperature?: unknown;
    };

    const asString = (value: unknown) =>
      typeof value === 'string' ? value.trim() : undefined;
    const asNumber = (value: unknown) =>
      typeof value === 'number' && Number.isFinite(value) ? value : undefined;

    return {
      messages: prependSelectedContextMessage(
        normalizeIncomingMessages(parsed),
        asString(parsed.selectedContext)
      ),
      overrides: {
        apiKey: asString(parsed.apiKey),
        baseUrl: asString(parsed.baseUrl),
        enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : undefined,
        gigachatClientId: asString(parsed.gigachatClientId),
        gigachatClientSecret: asString(parsed.gigachatClientSecret),
        gigachatMode:
          parsed.gigachatMode === 'openaiCompatible' || parsed.gigachatMode === 'native'
            ? parsed.gigachatMode
            : undefined,
        gigachatScope: asString(parsed.gigachatScope),
        maxTokens: asNumber(parsed.maxTokens),
        model: asString(parsed.model),
        provider: isAiProviderId(parsed.provider) ? parsed.provider : undefined,
        temperature: asNumber(parsed.temperature),
      },
    };
  } catch {
    return {
      messages: normalizeIncomingMessages({}),
      overrides: {},
    };
  }
};

function isAiProviderId(value: unknown): value is AiProviderId {
  return (
    value === 'codex-cli' ||
    value === 'openai' ||
    value === 'anthropic' ||
    value === 'gemini' ||
    value === 'openrouter' ||
    value === 'gigachat' ||
    value === 'gigachat-openai-compatible' ||
    value === 'gigachat-native'
  );
}

const detectProviderFromModel = (model: string): ResolvedProvider | undefined => {
  const normalized = model.trim().toLowerCase();
  if (!normalized.includes('/')) {
    return undefined;
  }

  const [prefix] = normalized.split('/', 1);
  if (prefix === 'openai') {
    return 'openai';
  }
  if (prefix === 'anthropic') {
    return 'anthropic';
  }
  if (prefix === 'google' || prefix === 'gemini') {
    return 'gemini';
  }
  if (prefix === 'openrouter') {
    return 'openrouter';
  }
  if (prefix === 'gigachat') {
    return 'gigachat-openai-compatible';
  }
  if (prefix === 'codex') {
    return 'codex-cli';
  }

  return 'openrouter';
};

const resolveProvider = (
  provider: AiProviderId | undefined,
  gigachatMode: 'native' | 'openaiCompatible' | undefined,
  model: string
): ResolvedProvider => {
  if (provider === 'gigachat-native') {
    return 'gigachat-native';
  }

  if (provider === 'gigachat-openai-compatible') {
    return 'gigachat-openai-compatible';
  }

  if (provider === 'gigachat') {
    return gigachatMode === 'openaiCompatible'
      ? 'gigachat-openai-compatible'
      : 'gigachat-native';
  }

  if (provider === 'openai' || provider === 'anthropic' || provider === 'gemini' || provider === 'openrouter') {
    return provider;
  }
  if (provider === 'codex-cli') {
    return provider;
  }

  return detectProviderFromModel(model) ?? 'openai';
};

const normalizeModelForProvider = (provider: ResolvedProvider, model: string): string => {
  const normalized = model.trim();
  if (!normalized.includes('/')) {
    return normalized;
  }

  if (provider === 'openrouter') {
    return normalized;
  }

  const [prefix, ...rest] = normalized.split('/');
  const suffix = rest.join('/').trim();
  if (!suffix) {
    return normalized;
  }

  const loweredPrefix = prefix.toLowerCase();
  if (
    (provider === 'openai' && loweredPrefix === 'openai') ||
    (provider === 'anthropic' && loweredPrefix === 'anthropic') ||
    (provider === 'gemini' && (loweredPrefix === 'google' || loweredPrefix === 'gemini')) ||
    (provider === 'gigachat-openai-compatible' && loweredPrefix === 'gigachat') ||
    (provider === 'gigachat-native' && loweredPrefix === 'gigachat')
  ) {
    return suffix;
  }

  return normalized;
};

const defaultBaseUrlByProvider = (provider: ResolvedProvider): string => {
  switch (provider) {
    case 'codex-cli':
      return '';
    case 'anthropic':
      return 'https://api.anthropic.com/v1';
    case 'gemini':
      return 'https://generativelanguage.googleapis.com/v1beta';
    case 'openrouter':
      return 'https://openrouter.ai/api/v1';
    case 'gigachat-openai-compatible':
    case 'gigachat-native':
      return 'https://gigachat.devices.sberbank.ru/api/v1';
    case 'openai':
    default:
      return 'https://api.openai.com/v1';
  }
};

const resolveApiKey = (
  provider: ResolvedProvider,
  settings: StoredAiSettings,
  overrides: RequestBodyOverrides
): string | undefined => {
  if (overrides.apiKey?.trim()) {
    return overrides.apiKey.trim();
  }

  if (settings.apiKey?.trim()) {
    return settings.apiKey.trim();
  }

  const envKeys = envApiKeyByProvider[provider] ?? [];
  for (const envKey of envKeys) {
    const value = process.env[envKey]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
};

const resolveRequestConfig = (
  settings: StoredAiSettings,
  route: AiRequestRoute,
  messages: NormalizedMessage[],
  overrides: RequestBodyOverrides
): ResolvedRequestConfig => {
  const modelSeed = overrides.model?.trim() || settings.model?.trim() || '';
  const provider = resolveProvider(
    overrides.provider ?? settings.provider,
    overrides.gigachatMode ?? settings.gigachatMode,
    modelSeed
  );
  const model = normalizeModelForProvider(
    provider,
    modelSeed || defaultModelByProvider[provider]
  );

  const temperature =
    overrides.temperature ??
    (typeof settings.temperature === 'number' ? settings.temperature : undefined) ??
    (route === 'copilot' ? 0.2 : 0.5);

  const maxTokens =
    overrides.maxTokens ??
    (typeof settings.maxTokens === 'number' ? settings.maxTokens : undefined) ??
    (route === 'copilot' ? 240 : 2048);

  return {
    apiKey: resolveApiKey(provider, settings, overrides),
    baseUrl: (overrides.baseUrl?.trim() || settings.baseUrl?.trim() || defaultBaseUrlByProvider(provider)).replace(/\/$/, ''),
    enabled: overrides.enabled ?? settings.enabled,
    gigachatClientId:
      overrides.gigachatClientId?.trim() || settings.gigachatClientId?.trim(),
    gigachatClientSecret:
      overrides.gigachatClientSecret?.trim() || settings.gigachatClientSecret?.trim(),
    gigachatScope:
      overrides.gigachatScope?.trim() || settings.gigachatScope?.trim() || 'GIGACHAT_API_PERS',
    maxTokens,
    messages,
    model,
    provider,
    route,
    temperature,
  };
};

const isAbortError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.name === 'AbortError' || /aborted/i.test(error.message);
};

const toDisplayError = async (
  providerLabel: string,
  response: Response
): Promise<Error> => {
  const details = await response.text();
  const summary = details.length > 600 ? `${details.slice(0, 600)}...` : details;
  return new Error(`${providerLabel} request failed (${response.status}): ${summary}`);
};

async function* readSseData(
  response: Response,
  abortSignal: AbortSignal
): AsyncGenerator<string> {
  if (!response.body) {
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (!abortSignal.aborted) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

      let eventBoundary = buffer.indexOf('\n\n');
      while (eventBoundary >= 0) {
        const event = buffer.slice(0, eventBoundary);
        buffer = buffer.slice(eventBoundary + 2);

        const payload = event
          .split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trim())
          .join('\n');

        if (payload) {
          yield payload;
        }

        eventBoundary = buffer.indexOf('\n\n');
      }
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // no-op
    }
  }
}

const readOpenAiDelta = (payload: unknown): string => {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const maybe = payload as {
    choices?: Array<{
      delta?: {
        content?: unknown;
      };
    }>;
  };

  const content = maybe.choices?.[0]?.delta?.content;
  if (typeof content === 'string') {
    return content;
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return '';
      }
      const value = item as { text?: unknown; type?: unknown };
      if (value.type === 'text' && typeof value.text === 'string') {
        return value.text;
      }
      return '';
    })
    .join('');
};

async function* streamOpenAiLike(
  response: Response,
  abortSignal: AbortSignal
): AsyncGenerator<string> {
  for await (const data of readSseData(response, abortSignal)) {
    if (data === '[DONE]') {
      break;
    }

    try {
      const json = JSON.parse(data) as unknown;
      const delta = readOpenAiDelta(json);
      if (delta) {
        yield delta;
      }
    } catch {
      // ignore malformed chunks
    }
  }
}

async function* streamAnthropicLike(
  response: Response,
  abortSignal: AbortSignal
): AsyncGenerator<string> {
  for await (const data of readSseData(response, abortSignal)) {
    try {
      const json = JSON.parse(data) as {
        delta?: { text?: string };
        type?: string;
      };

      if (json.type === 'content_block_delta' && json.delta?.text) {
        yield json.delta.text;
      }
    } catch {
      // ignore malformed chunks
    }
  }
}

const splitTextForStream = (text: string): string[] => {
  if (!text) {
    return [];
  }

  const maxChunk = 80;
  const chunks: string[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const next = Math.min(cursor + maxChunk, text.length);
    chunks.push(text.slice(cursor, next));
    cursor = next;
  }

  return chunks;
};

const buildCodexPrompt = (messages: NormalizedMessage[]): string => {
  if (messages.length === 0) {
    return 'Help me improve current text.';
  }

  return messages
    .map((message) => `${message.role.toUpperCase()}:\n${message.content}`)
    .join('\n\n');
};

const cleanupTempFile = async (filePath: string) => {
  try {
    await unlink(filePath);
  } catch {
    // no-op
  }
};

const resolveGigaChatOauthUrl = (config: ResolvedRequestConfig): string => {
  if (config.baseUrl.includes('ngw.devices.sberbank.ru')) {
    return joinUrl(config.baseUrl, 'oauth');
  }

  return 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth';
};

const fetchGigaChatNativeAccessToken = async (
  config: ResolvedRequestConfig,
  abortSignal: AbortSignal
): Promise<string> => {
  if (config.gigachatClientId && config.gigachatClientSecret) {
    const basicAuth = Buffer.from(
      `${config.gigachatClientId}:${config.gigachatClientSecret}`
    ).toString('base64');

    const response = await fetch(resolveGigaChatOauthUrl(config), {
      body: new URLSearchParams({
        scope: config.gigachatScope || 'GIGACHAT_API_PERS',
      }),
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        RqUID: `${Date.now()}`,
      },
      method: 'POST',
      signal: abortSignal,
    });

    if (!response.ok) {
      throw await toDisplayError('GigaChat token', response);
    }

    const json = (await response.json()) as { access_token?: string };
    if (json.access_token?.trim()) {
      return json.access_token.trim();
    }

    throw new Error('GigaChat token response did not include access_token.');
  }

  if (config.apiKey?.trim()) {
    return config.apiKey.trim();
  }

  throw new Error('GigaChat native requires either API token or client credentials.');
};

export class AiRuntimeService implements vscode.Disposable {
  private readonly inFlight = new Map<string, AbortController>();
  private readonly cliProcessByRequest = new Map<string, ChildProcess>();

  public constructor(private readonly context: vscode.ExtensionContext) {}

  public dispose() {
    for (const controller of this.inFlight.values()) {
      controller.abort();
    }
    for (const process of this.cliProcessByRequest.values()) {
      try {
        process.kill('SIGTERM');
      } catch {
        // no-op
      }
    }

    this.inFlight.clear();
    this.cliProcessByRequest.clear();
  }

  public cancelRequest(requestId: string) {
    this.inFlight.get(requestId)?.abort();
    const process = this.cliProcessByRequest.get(requestId);
    if (process) {
      try {
        process.kill('SIGTERM');
      } catch {
        // no-op
      } finally {
        this.cliProcessByRequest.delete(requestId);
      }
    }
  }

  public async loadSettingsPublic(): Promise<AiSettingsPublic> {
    const settings = await this.readSettings();
    return toPublicSettings(settings);
  }

  public async saveSettings(next: AiSettingsInput): Promise<AiSettingsPublic> {
    const previous = await this.readSettings();
    const merged = sanitizeSettings(previous, next);
    await this.context.secrets.store(AI_SETTINGS_SECRET_KEY, JSON.stringify(merged));
    return toPublicSettings(merged);
  }

  public async streamRequest(
    params: {
      body: string;
      requestId: string;
      route: AiRequestRoute;
    },
    handlers: AiRuntimeStreamHandlers
  ) {
    const abortController = new AbortController();
    this.inFlight.set(params.requestId, abortController);

    const sseId = `${params.requestId}_${Math.random().toString(36).slice(2, 8)}`;
    const sse = createSseEnvelope(sseId);

    try {
      const settings = await this.readSettings();
      const { messages, overrides } = parseRequestBody(params.body);
      const config = resolveRequestConfig(settings, params.route, messages, overrides);

      if (!config.enabled) {
        throw new Error('AI is disabled in AI settings.');
      }

      if (!config.model.trim()) {
        throw new Error('Model is required. Configure it in AI settings.');
      }

      handlers.onChunk(sse.start());
      handlers.onChunk(sse.startStep());
      handlers.onChunk(sse.textStart());

      for await (const delta of this.streamProvider(params.requestId, config, abortController.signal)) {
        if (abortController.signal.aborted) {
          break;
        }

        handlers.onChunk(sse.textDelta(delta));
      }

      handlers.onChunk(sse.textEnd());
      handlers.onChunk(sse.finishStep());
      handlers.onChunk(sse.finish());
      handlers.onChunk('data: [DONE]\n\n');
      handlers.onEnd();
    } catch (error) {
      if (isAbortError(error) || abortController.signal.aborted) {
        handlers.onEnd();
        return;
      }

      const message = error instanceof Error ? error.message : String(error);
      handlers.onError(message);
    } finally {
      this.inFlight.delete(params.requestId);
    }
  }

  private async readSettings(): Promise<StoredAiSettings> {
    const raw = await this.context.secrets.get(AI_SETTINGS_SECRET_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    try {
      const parsed = JSON.parse(raw) as StoredAiSettings;
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  private async runCodexCli(
    requestId: string,
    config: ResolvedRequestConfig,
    abortSignal: AbortSignal
  ): Promise<string> {
    const prompt = buildCodexPrompt(config.messages);
    const outputPath = path.join(
      os.tmpdir(),
      `maden-codex-${requestId}-${Date.now().toString(36)}.txt`
    );
    const cwd =
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();
    const args = [
      'exec',
      '--skip-git-repo-check',
      '--sandbox',
      'read-only',
      '--output-last-message',
      outputPath,
    ];

    if (config.model.trim()) {
      args.push('-m', config.model.trim());
    }

    args.push(prompt);

    const child = spawn('codex', args, {
      cwd,
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    this.cliProcessByRequest.set(requestId, child);

    let stderr = '';
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    await new Promise<void>((resolve, reject) => {
      const onAbort = () => {
        try {
          child.kill('SIGTERM');
        } catch {
          // no-op
        }
      };
      abortSignal.addEventListener('abort', onAbort, { once: true });

      child.on('error', (error) => {
        abortSignal.removeEventListener('abort', onAbort);
        reject(error);
      });

      child.on('close', (code) => {
        abortSignal.removeEventListener('abort', onAbort);
        if (abortSignal.aborted) {
          reject(new Error('Codex CLI request cancelled.'));
          return;
        }
        if (code !== 0) {
          const details = stderr.trim();
          reject(
            new Error(
              details
                ? `codex exec failed (${code}): ${details}`
                : `codex exec failed with code ${code}`
            )
          );
          return;
        }
        resolve();
      });
    });

    try {
      const content = (await readFile(outputPath, 'utf8')).trim();
      if (!content) {
        throw new Error('codex exec returned an empty response.');
      }
      return content;
    } finally {
      await cleanupTempFile(outputPath);
      this.cliProcessByRequest.delete(requestId);
    }
  }

  private async *streamProvider(
    requestId: string,
    config: ResolvedRequestConfig,
    abortSignal: AbortSignal
  ): AsyncGenerator<string> {
    if (config.provider === 'codex-cli') {
      const output = await this.runCodexCli(requestId, config, abortSignal);
      for (const chunk of splitTextForStream(output)) {
        if (abortSignal.aborted) {
          break;
        }
        yield chunk;
      }
      return;
    }

    if (config.provider === 'anthropic') {
      if (!config.apiKey) {
        throw new Error('Anthropic API key is missing.');
      }

      const endpoint = joinUrl(config.baseUrl, 'messages');
      const response = await fetch(endpoint, {
        body: JSON.stringify({
          max_tokens: config.maxTokens,
          messages: config.messages
            .filter((message) => message.role !== 'system')
            .map((message) => ({
              content: message.content,
              role: message.role === 'assistant' ? 'assistant' : 'user',
            })),
          model: config.model,
          stream: true,
          system:
            config.messages
              .filter((message) => message.role === 'system')
              .map((message) => message.content)
              .join('\n') ||
            'You are a writing assistant for markdown documents.',
          temperature: config.temperature,
        }),
        headers: {
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
        },
        method: 'POST',
        signal: abortSignal,
      });

      if (!response.ok) {
        throw await toDisplayError('Anthropic', response);
      }

      yield* streamAnthropicLike(response, abortSignal);
      return;
    }

    if (config.provider === 'gemini') {
      if (!config.apiKey) {
        throw new Error('Gemini API key is missing.');
      }

      const endpoint = `${joinUrl(
        config.baseUrl,
        `models/${encodeURIComponent(config.model)}:generateContent`
      )}?key=${encodeURIComponent(config.apiKey)}`;

      const response = await fetch(endpoint, {
        body: JSON.stringify({
          contents: config.messages
            .filter((message) => message.role !== 'system')
            .map((message) => ({
              parts: [{ text: message.content }],
              role: message.role === 'assistant' ? 'model' : 'user',
            })),
          generationConfig: {
            maxOutputTokens: config.maxTokens,
            temperature: config.temperature,
          },
          systemInstruction:
            config.messages.find((message) => message.role === 'system')
              ? {
                  parts: [
                    {
                      text: config.messages
                        .filter((message) => message.role === 'system')
                        .map((message) => message.content)
                        .join('\n'),
                    },
                  ],
                }
              : undefined,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        signal: abortSignal,
      });

      if (!response.ok) {
        throw await toDisplayError('Gemini', response);
      }

      const json = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };

      const text =
        json.candidates?.[0]?.content?.parts
          ?.map((part) => part.text || '')
          .join('') || '';

      for (const chunk of splitTextForStream(text)) {
        if (abortSignal.aborted) {
          break;
        }
        yield chunk;
      }

      return;
    }

    if (config.provider === 'gigachat-native') {
      const token = await fetchGigaChatNativeAccessToken(config, abortSignal);
      const endpoint = joinUrl(config.baseUrl, 'chat/completions');
      const response = await fetch(endpoint, {
        body: JSON.stringify({
          max_tokens: config.maxTokens,
          messages: config.messages.map((message) => ({
            content: message.content,
            role: message.role,
          })),
          model: config.model,
          stream: true,
          temperature: config.temperature,
        }),
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
        signal: abortSignal,
      });

      if (!response.ok) {
        throw await toDisplayError('GigaChat native', response);
      }

      yield* streamOpenAiLike(response, abortSignal);
      return;
    }

    if (!config.apiKey) {
      throw new Error('API key is missing for the selected AI provider.');
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    };

    if (config.provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://github.com/alialek/maden';
      headers['X-Title'] = 'Maden';
    }

    const endpoint = joinUrl(config.baseUrl, 'chat/completions');
    const response = await fetch(endpoint, {
      body: JSON.stringify({
        max_tokens: config.maxTokens,
        messages: config.messages.map((message) => ({
          content: message.content,
          role: message.role,
        })),
        model: config.model,
        stream: true,
        temperature: config.temperature,
      }),
      headers,
      method: 'POST',
      signal: abortSignal,
    });

    if (!response.ok) {
      const label =
        config.provider === 'gigachat-openai-compatible'
          ? 'GigaChat OpenAI-compatible'
          : config.provider.charAt(0).toUpperCase() + config.provider.slice(1);
      throw await toDisplayError(label, response);
    }

    yield* streamOpenAiLike(response, abortSignal);
  }
}

import type { AiProviderId, AiRequestRoute } from '../../../shared/messages';
import { normalizeAiMessages } from '../../../shared/ai-message-normalization';
import type {
  NormalizedMessage,
  RequestBodyOverrides,
  ResolvedProvider,
  ResolvedRequestConfig,
  StoredAiSettings,
} from './types';

const defaultModelByProvider: Record<ResolvedProvider, string> = {
  'codex-cli': 'gpt-5-codex',
  'qwen-cli': '',
  'gigachat-cli': '',
  anthropic: 'claude-3-7-sonnet-latest',
  gemini: 'gemini-2.5-flash',
  'gigachat-native': 'GigaChat-2-Max',
  'gigachat-openai-compatible': 'GigaChat-2-Max',
  openai: 'gpt-4o-mini',
  openrouter: 'openai/gpt-4o-mini',
};

const envApiKeyByProvider: Record<ResolvedProvider, string[]> = {
  'codex-cli': [],
  'qwen-cli': [],
  'gigachat-cli': [],
  anthropic: ['ANTHROPIC_API_KEY'],
  gemini: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'],
  'gigachat-native': ['GIGACHAT_API_KEY', 'GIGACHAT_NATIVE_ACCESS_TOKEN'],
  'gigachat-openai-compatible': ['GIGACHAT_API_KEY'],
  openai: ['OPENAI_API_KEY'],
  openrouter: ['OPENROUTER_API_KEY'],
};

const normalizeIncomingMessages = (parsed: {
  messages?: unknown;
}): NormalizedMessage[] => {
  const normalized = normalizeAiMessages(parsed.messages);

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

export const parseRequestBody = (
  rawBody: string
): { messages: NormalizedMessage[]; overrides: RequestBodyOverrides } => {
  try {
    const parsed = JSON.parse(rawBody) as {
      apiKey?: unknown;
      baseUrl?: unknown;
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
    value === 'qwen-cli' ||
    value === 'gigachat-cli' ||
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

  if (
    provider === 'openai' ||
    provider === 'anthropic' ||
    provider === 'gemini' ||
    provider === 'openrouter'
  ) {
    return provider;
  }
  if (
    provider === 'codex-cli' ||
    provider === 'qwen-cli' ||
    provider === 'gigachat-cli'
  ) {
    return provider;
  }

  return detectProviderFromModel(model) ?? 'openai';
};

const normalizeModelForProvider = (
  provider: ResolvedProvider,
  model: string
): string => {
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
    (provider === 'gemini' &&
      (loweredPrefix === 'google' || loweredPrefix === 'gemini')) ||
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
    case 'qwen-cli':
    case 'gigachat-cli':
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

export const resolveRequestConfig = (
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
    0.5;

  const maxTokens =
    overrides.maxTokens ??
    (typeof settings.maxTokens === 'number' ? settings.maxTokens : undefined) ??
    2048;

  return {
    apiKey: resolveApiKey(provider, settings, overrides),
    baseUrl: (
      overrides.baseUrl?.trim() ||
      settings.baseUrl?.trim() ||
      defaultBaseUrlByProvider(provider)
    ).replace(/\/$/, ''),
    enabled: settings.enabled,
    gigachatClientId:
      overrides.gigachatClientId?.trim() || settings.gigachatClientId?.trim(),
    gigachatClientSecret:
      overrides.gigachatClientSecret?.trim() ||
      settings.gigachatClientSecret?.trim(),
    gigachatScope:
      overrides.gigachatScope?.trim() ||
      settings.gigachatScope?.trim() ||
      'GIGACHAT_API_PERS',
    maxTokens,
    messages,
    model,
    provider,
    route,
    temperature,
  };
};

export const allowsEmptyModel = (provider: ResolvedProvider): boolean =>
  provider === 'qwen-cli' || provider === 'gigachat-cli';

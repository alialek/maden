import type { AiSettingsInput, AiSettingsPublic } from '../../../shared/messages';
import type { StoredAiSettings } from './types';

export const AI_SETTINGS_SECRET_KEY = 'maden.ai.settings.v1';

export const DEFAULT_SETTINGS: StoredAiSettings = {
  baseUrl: '',
  enabled: false,
  gigachatMode: 'native',
  model: '',
  provider: 'openai',
};

export const toPublicSettings = (
  settings: StoredAiSettings
): AiSettingsPublic => ({
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

export const sanitizeSettings = (
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

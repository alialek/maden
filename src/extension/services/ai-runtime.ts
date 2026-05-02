import type { ChildProcess } from 'node:child_process';

import * as vscode from 'vscode';

import type {
  AiRequestRoute,
  AiSettingsInput,
  AiSettingsPublic,
} from '../../shared/messages';
import {
  AI_SETTINGS_SECRET_KEY,
  DEFAULT_SETTINGS,
  sanitizeSettings,
  toPublicSettings,
} from './ai/settings';
import type { AiRuntimeStreamHandlers, StoredAiSettings } from './ai/types';
import {
  allowsEmptyModel,
  parseRequestBody,
  resolveRequestConfig,
} from './ai/request-config';
import { streamProvider } from './ai/providers';
import { createSseEnvelope, isAbortError } from './ai/sse';

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
      const config = resolveRequestConfig(
        settings,
        params.route,
        messages,
        overrides
      );

      if (!config.enabled) {
        throw new Error('AI is disabled in AI settings.');
      }

      if (!config.model.trim() && !allowsEmptyModel(config.provider)) {
        throw new Error('Model is required. Configure it in AI settings.');
      }

      handlers.onChunk(sse.start());
      handlers.onChunk(sse.startStep());
      handlers.onChunk(sse.textStart());

      for await (const delta of streamProvider({
        abortSignal: abortController.signal,
        cliProcessByRequest: this.cliProcessByRequest,
        config,
        requestId: params.requestId,
      })) {
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
}

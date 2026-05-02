import { spawn } from 'node:child_process';
import { readFile, unlink } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import * as vscode from 'vscode';

import type {
  CliProcessRegistry,
  NormalizedMessage,
  ResolvedRequestConfig,
} from './types';
import {
  joinUrl,
  splitTextForStream,
  streamAnthropicLike,
  streamOpenAiLike,
  toDisplayError,
} from './sse';

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

const runCodexCli = async (
  requestId: string,
  config: ResolvedRequestConfig,
  abortSignal: AbortSignal,
  cliProcessByRequest: CliProcessRegistry
): Promise<string> => {
  const prompt = buildCodexPrompt(config.messages);
  const outputPath = path.join(
    os.tmpdir(),
    `maden-codex-${requestId}-${Date.now().toString(36)}.txt`
  );
  const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();
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
  cliProcessByRequest.set(requestId, child);

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
    cliProcessByRequest.delete(requestId);
  }
};

const runQwenLikeCli = async (
  binary: 'qwen' | 'gigacode',
  requestId: string,
  config: ResolvedRequestConfig,
  abortSignal: AbortSignal,
  cliProcessByRequest: CliProcessRegistry
): Promise<string> => {
  const providerLabel = binary === 'qwen' ? 'Qwen CLI' : 'GigaChat CLI';
  const prompt = buildCodexPrompt(config.messages);
  const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();
  const args: string[] = ['-p', prompt];

  if (config.model.trim()) {
    args.unshift('-m', config.model.trim());
  }

  const child = spawn(binary, args, {
    cwd,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  cliProcessByRequest.set(requestId, child);

  let stdout = '';
  let stderr = '';
  child.stdout?.on('data', (chunk) => {
    stdout += chunk.toString();
  });
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
      const maybeError = error as NodeJS.ErrnoException;
      if (maybeError.code === 'ENOENT') {
        reject(new Error(`${providerLabel} is not installed or not found in PATH.`));
        return;
      }
      reject(new Error(`${providerLabel} failed to start: ${error.message}`));
    });

    child.on('close', (code) => {
      abortSignal.removeEventListener('abort', onAbort);
      if (abortSignal.aborted) {
        reject(new Error(`${providerLabel} request cancelled.`));
        return;
      }
      if (code !== 0) {
        const details = stderr.trim();
        reject(
          new Error(
            details
              ? `${binary} -p failed (${code}): ${details}`
              : `${binary} -p failed with code ${code}`
          )
        );
        return;
      }
      resolve();
    });
  });

  try {
    const content = stdout.trim();
    if (!content) {
      throw new Error(`${binary} -p returned an empty response.`);
    }
    return content;
  } finally {
    cliProcessByRequest.delete(requestId);
  }
};

const yieldTextChunks = async function* (
  text: string,
  abortSignal: AbortSignal
): AsyncGenerator<string> {
  for (const chunk of splitTextForStream(text)) {
    if (abortSignal.aborted) {
      break;
    }
    yield chunk;
  }
};

export async function* streamProvider({
  abortSignal,
  cliProcessByRequest,
  config,
  requestId,
}: {
  abortSignal: AbortSignal;
  cliProcessByRequest: CliProcessRegistry;
  config: ResolvedRequestConfig;
  requestId: string;
}): AsyncGenerator<string> {
  if (config.provider === 'codex-cli') {
    yield* yieldTextChunks(
      await runCodexCli(requestId, config, abortSignal, cliProcessByRequest),
      abortSignal
    );
    return;
  }

  if (config.provider === 'qwen-cli') {
    yield* yieldTextChunks(
      await runQwenLikeCli(
        'qwen',
        requestId,
        config,
        abortSignal,
        cliProcessByRequest
      ),
      abortSignal
    );
    return;
  }

  if (config.provider === 'gigachat-cli') {
    yield* yieldTextChunks(
      await runQwenLikeCli(
        'gigacode',
        requestId,
        config,
        abortSignal,
        cliProcessByRequest
      ),
      abortSignal
    );
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
            .join('\n') || 'You are a writing assistant for markdown documents.',
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
        systemInstruction: config.messages.find((message) => message.role === 'system')
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

    yield* yieldTextChunks(text, abortSignal);
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

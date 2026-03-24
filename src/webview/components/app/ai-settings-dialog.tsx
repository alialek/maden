import * as React from 'react';

import type { AiProviderId, AiSettingsInput, AiSettingsPublic } from '../../../shared/messages';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const PROVIDERS: Array<{ label: string; value: AiProviderId }> = [
  { label: 'Codex CLI (subscription)', value: 'codex-cli' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'Anthropic', value: 'anthropic' },
  { label: 'Gemini', value: 'gemini' },
  { label: 'OpenRouter', value: 'openrouter' },
  { label: 'GigaChat', value: 'gigachat' },
];

const EMPTY_SETTINGS: AiSettingsInput = {
  apiKey: '',
  baseUrl: '',
  enabled: true,
  gigachatMode: 'native',
  model: '',
  provider: 'openai',
};

export function AiSettingsDialog({
  onOpenChange,
  onSave,
  open,
  settings,
}: {
  onOpenChange: (open: boolean) => void;
  onSave: (settings: AiSettingsInput) => void;
  open: boolean;
  settings: AiSettingsPublic | null;
}) {
  const [draft, setDraft] = React.useState<AiSettingsInput>(EMPTY_SETTINGS);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    setDraft({
      apiKey: '',
      baseUrl: settings?.baseUrl ?? '',
      enabled: settings?.enabled ?? true,
      gigachatMode: settings?.gigachatMode ?? 'native',
      model: settings?.model ?? '',
      provider: settings?.provider ?? 'openai',
    });
  }, [open, settings]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave(draft);
    onOpenChange(false);
  };
  const isCodexCli = draft.provider === 'codex-cli';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>AI Settings</DialogTitle>
          <DialogDescription>
            Select a provider, model, and credentials for AI text actions.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={submit}>
          <label className="flex items-center gap-2 text-sm">
            <input
              checked={draft.enabled}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, enabled: event.target.checked }))
              }
              type="checkbox"
            />
            Enable AI actions
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Provider
            <select
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={draft.provider}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  provider: event.target.value as AiProviderId,
                }))
              }
            >
              {PROVIDERS.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </label>

          {draft.provider === 'gigachat' && (
            <label className="flex flex-col gap-1 text-sm">
              GigaChat mode
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={draft.gigachatMode}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    gigachatMode:
                      event.target.value === 'openaiCompatible'
                        ? 'openaiCompatible'
                        : 'native',
                  }))
                }
              >
                <option value="native">Native</option>
                <option value="openaiCompatible">OpenAI-compatible</option>
              </select>
            </label>
          )}

          <label className="flex flex-col gap-1 text-sm">
            Model
            <Input
              placeholder="e.g. gpt-4.1-mini"
              value={draft.model}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, model: event.target.value }))
              }
            />
          </label>

          {!isCodexCli && (
            <label className="flex flex-col gap-1 text-sm">
              Base URL (optional)
              <Input
                placeholder="https://api.openai.com/v1"
                value={draft.baseUrl ?? ''}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, baseUrl: event.target.value }))
                }
              />
            </label>
          )}

          {!isCodexCli && (
            <label className="flex flex-col gap-1 text-sm">
              API Key
              <Input
                placeholder={
                  settings?.hasApiKey
                    ? 'Saved. Enter new key to rotate.'
                    : 'Enter provider API key'
                }
                value={draft.apiKey ?? ''}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, apiKey: event.target.value }))
                }
                type="password"
              />
            </label>
          )}

          {isCodexCli && (
            <p className="text-muted-foreground text-xs">
              Codex CLI uses your Codex subscription session and does not require an API token.
            </p>
          )}

          <Button className="w-full" type="submit">
            Save AI settings
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import * as React from 'react';

import type {
  AiSettingsInput,
  AiSettingsPublic,
  HostToWebviewMessage,
} from '../../shared/messages';

import { postToHost } from '@/vscode';

export const useAiSettings = () => {
  const [settings, setSettings] = React.useState<AiSettingsPublic | null>(null);

  React.useEffect(() => {
    const listener = (event: MessageEvent<HostToWebviewMessage>) => {
      const message = event.data;
      if (message.type !== 'aiSettingsState') {
        return;
      }

      setSettings(message.settings);
    };

    window.addEventListener('message', listener);
    postToHost({ type: 'aiSettingsLoad' });

    return () => {
      window.removeEventListener('message', listener);
    };
  }, []);

  const save = React.useCallback((next: AiSettingsInput) => {
    postToHost({
      type: 'aiSettingsSave',
      settings: next,
    });
  }, []);

  const reload = React.useCallback(() => {
    postToHost({ type: 'aiSettingsLoad' });
  }, []);

  return {
    reload,
    save,
    settings,
  };
};

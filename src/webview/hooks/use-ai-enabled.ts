import * as React from 'react';

import { ENABLE_AI_FEATURES } from '../../shared/feature-flags';

const AI_ENABLED_EVENT = 'maden:ai-enabled-changed';

const readAiEnabled = () =>
  ENABLE_AI_FEATURES && window.__MADEN_AI_ENABLED__ === true;

export const dispatchAiEnabledChanged = () => {
  window.dispatchEvent(new Event(AI_ENABLED_EVENT));
};

export const useAiEnabled = () => {
  const [aiEnabled, setAiEnabled] = React.useState<boolean>(() => readAiEnabled());

  React.useEffect(() => {
    const sync = () => {
      setAiEnabled(readAiEnabled());
    };

    sync();
    window.addEventListener(AI_ENABLED_EVENT, sync);

    return () => {
      window.removeEventListener(AI_ENABLED_EVENT, sync);
    };
  }, []);

  return aiEnabled;
};

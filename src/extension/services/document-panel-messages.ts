import * as vscode from 'vscode';

import type { HostToWebviewMessage } from '../../shared/messages';

export type PanelsByDocument = Map<string, Set<vscode.WebviewPanel>>;

export const postToDocumentPanels = (
  panelsByDocument: PanelsByDocument,
  key: string,
  message: HostToWebviewMessage
) => {
  const panels = panelsByDocument.get(key);
  if (!panels) {
    return;
  }

  for (const panel of panels) {
    void panel.webview.postMessage(message);
  }
};

export const postToOtherDocumentPanels = (
  panelsByDocument: PanelsByDocument,
  key: string,
  sourcePanel: vscode.WebviewPanel,
  message: HostToWebviewMessage
) => {
  const panels = panelsByDocument.get(key);
  if (!panels) {
    return;
  }

  for (const panel of panels) {
    if (panel === sourcePanel) {
      continue;
    }
    void panel.webview.postMessage(message);
  }
};

export const postAiEnabledToAllPanels = (
  panelsByDocument: PanelsByDocument,
  aiEnabled: boolean
) => {
  for (const panels of panelsByDocument.values()) {
    for (const panel of panels) {
      void panel.webview.postMessage({
        type: 'setAiEnabled',
        aiEnabled,
      });
    }
  }
};

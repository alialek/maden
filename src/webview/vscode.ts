import type { WebviewToHostMessage } from '../shared/messages';

type VsCodeApi = {
  postMessage: (message: WebviewToHostMessage) => void;
};

declare global {
  interface Window {
    acquireVsCodeApi?: () => VsCodeApi;
  }
}

const fallbackApi: VsCodeApi = {
  postMessage: () => {
    // Browser dev mode: no extension host available.
  },
};

export const vscode = window.acquireVsCodeApi?.() ?? fallbackApi;

export const postToHost = (message: WebviewToHostMessage) => {
  vscode.postMessage(message);
};

export {};

declare global {
  interface Window {
    __MADEN_AI_ENABLED__?: boolean;
    __MADEN_DOCUMENT_PATH__?: string;
    __MADEN_WORKSPACE_ROOTS__?: string[];
  }
}

declare module 'lodash/debounce.js';

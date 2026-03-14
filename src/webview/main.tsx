import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

// Some browser-targeted dependencies expect Node-like global.
if (!(globalThis as { global?: typeof globalThis }).global) {
  (globalThis as { global: typeof globalThis }).global = globalThis;
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

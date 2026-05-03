#!/usr/bin/env node

import { runDebugEntry } from './debug-launcher.mjs';

// IMPORTANT: Keep this launcher as a thin wrapper only. Markdown conversion
// lives in src/webview/lib/markdown-plate-conversion.ts; save-format reconcile
// lives in src/shared/markdown-format-reconcile.ts. The webview, extension,
// tests, and this debug utility must share those paths with zero console-only
// conversion logic.
await runDebugEntry({
  entryPoint: 'debug-markdown-entry.ts',
  tempPrefix: 'maden-debug-markdown-',
});

#!/usr/bin/env node

import { build } from 'esbuild';
import { access, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const buildDir = await mkdtemp(join(tmpdir(), 'maden-debug-plate-'));
const outfile = join(buildDir, 'debug-plate-entry.mjs');

const resolveExistingPath = async (basePath) => {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    `${basePath}.mjs`,
    `${basePath}.json`,
    join(basePath, 'index.ts'),
    join(basePath, 'index.tsx'),
    join(basePath, 'index.js'),
  ];

  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next extension/index candidate.
    }
  }

  return basePath;
};

const webviewAliasPlugin = {
  name: 'maden-webview-alias',
  setup(buildContext) {
    buildContext.onResolve({ filter: /^@\// }, async (args) => ({
      path: await resolveExistingPath(resolve(repoRoot, 'src/webview', args.path.slice(2))),
    }));
  },
};

// IMPORTANT: Keep this launcher as a thin wrapper only. Plate -> Markdown
// serialization lives in src/webview/lib/markdown-plate-conversion.ts;
// save-format reconcile lives in src/shared/markdown-format-reconcile.ts. The
// webview, extension, tests, and this debug utility must share those paths with
// zero console-only conversion logic.
await build({
  absWorkingDir: repoRoot,
  bundle: true,
  entryPoints: [join(repoRoot, 'scripts/debug-plate-entry.ts')],
  format: 'esm',
  jsx: 'automatic',
  loader: {
    '.css': 'empty',
  },
  outfile,
  platform: 'node',
  plugins: [webviewAliasPlugin],
  sourcemap: 'inline',
  target: 'node22',
});

const { main } = await import(pathToFileURL(outfile).href);
await main(process.argv.slice(2));

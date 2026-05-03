import { build } from 'esbuild';
import { access, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');

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

export const runDebugEntry = async ({
  entryPoint,
  tempPrefix,
}) => {
  const buildDir = await mkdtemp(join(tmpdir(), tempPrefix));
  const outfile = join(buildDir, `${entryPoint.replace(/\.ts$/, '')}.mjs`);

  await build({
    absWorkingDir: repoRoot,
    bundle: true,
    entryPoints: [join(repoRoot, 'scripts', entryPoint)],
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
};

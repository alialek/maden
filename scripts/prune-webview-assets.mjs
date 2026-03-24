#!/usr/bin/env node

import { readdir, readFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';

const workspaceRoot = process.cwd();
const webviewDistDir = path.join(workspaceRoot, 'dist', 'webview');
const assetsDir = path.join(webviewDistDir, 'assets');

const TEXT_FILE_RE = /\.(?:css|js|html)$/i;
const ASSET_REF_RE = /(?:^|[("'`\s])(?:\/|\.\.\/|\.\/)?assets\/([^"'`)\s?#]+)/g;

const fileExists = async (filePath) => {
  try {
    const info = await stat(filePath);
    return info.isFile() || info.isDirectory();
  } catch {
    return false;
  }
};

const walkFiles = async (dirPath) => {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(absolute)));
      continue;
    }
    if (entry.isFile()) {
      files.push(absolute);
    }
  }

  return files;
};

const extractAssetRefs = (content) => {
  const refs = new Set();
  for (const match of content.matchAll(ASSET_REF_RE)) {
    const ref = match[1]?.trim();
    if (!ref) continue;
    refs.add(path.basename(ref));
  }
  return refs;
};

const run = async () => {
  if (!(await fileExists(webviewDistDir))) {
    console.log('[prune-webview-assets] Skip: dist/webview does not exist.');
    return;
  }

  if (!(await fileExists(assetsDir))) {
    console.log('[prune-webview-assets] Skip: dist/webview/assets does not exist.');
    return;
  }

  const allWebviewFiles = await walkFiles(webviewDistDir);
  const sourceFiles = allWebviewFiles.filter((filePath) => {
    if (filePath.startsWith(assetsDir + path.sep)) return false;
    return TEXT_FILE_RE.test(filePath);
  });

  const referencedAssets = new Set();
  for (const filePath of sourceFiles) {
    const content = await readFile(filePath, 'utf8');
    const refs = extractAssetRefs(content);
    for (const ref of refs) {
      referencedAssets.add(ref);
    }
  }

  const assetEntries = await readdir(assetsDir, { withFileTypes: true });
  let removed = 0;
  let kept = 0;

  for (const entry of assetEntries) {
    if (!entry.isFile()) continue;
    const assetName = entry.name;
    const assetPath = path.join(assetsDir, assetName);

    if (referencedAssets.has(assetName)) {
      kept += 1;
      continue;
    }

    await rm(assetPath, { force: true });
    removed += 1;
  }

  console.log(
    `[prune-webview-assets] Done. kept=${kept} removed=${removed} referenced=${referencedAssets.size}`
  );
};

run().catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  console.error(`[prune-webview-assets] Failed: ${message}`);
  process.exitCode = 1;
});


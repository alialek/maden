import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

import type { Value } from 'platejs';

import {
  canonicalizeMarkdown,
  serializePlateValueWithConversionEditor,
} from '../src/webview/lib/markdown-plate-conversion';
import { reconcileMarkdownPreservingUnchangedFormatting } from '../src/shared/markdown-format-reconcile';

type DebugPlateArgs = {
  comparePath?: string;
  outDir?: string;
  platePath: string;
  strictCompare: boolean;
};

type DifferenceLocation = {
  column: number;
  index: number;
  line: number;
};

const usage = `Usage: npm run debug:plate -- <plate.json> [--compare <file.md>] [--out <dir>] [--strict-compare]

Runs the production Plate -> Markdown serialization path against a Plate JSON file.
The conversion always imports the production webview serialization entrypoint.
Use --compare to diff the serialized Markdown against an original Markdown file.`;

const parseArgs = (argv: string[]): DebugPlateArgs => {
  let platePath = '';
  let comparePath: string | undefined;
  let outDir: string | undefined;
  let strictCompare = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      console.info(usage);
      process.exit(0);
    }

    if (arg === '--compare') {
      const next = argv[index + 1];
      if (!next) {
        throw new Error('--compare requires a Markdown file path');
      }
      comparePath = next;
      index += 1;
      continue;
    }

    if (arg === '--out') {
      const next = argv[index + 1];
      if (!next) {
        throw new Error('--out requires a directory');
      }
      outDir = next;
      index += 1;
      continue;
    }

    if (arg === '--strict' || arg === '--strict-compare') {
      strictCompare = true;
      continue;
    }

    if (!platePath) {
      platePath = arg;
      continue;
    }

    throw new Error(`Unexpected argument: ${arg}`);
  }

  if (!platePath) {
    throw new Error(usage);
  }

  return {
    comparePath: comparePath ? resolve(comparePath) : undefined,
    outDir: outDir ? resolve(outDir) : undefined,
    platePath: resolve(platePath),
    strictCompare,
  };
};

const safeBaseName = (filePath: string): string => {
  const fallback = createHash('sha1').update(filePath).digest('hex').slice(0, 8);
  const safe = basename(filePath)
    .replace(/\.[^.]+$/, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return safe || `plate-${fallback}`;
};

const defaultOutDir = (filePath: string): string => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const hash = createHash('sha1').update(filePath).digest('hex').slice(0, 8);

  return resolve('.maden-debug', `${safeBaseName(filePath)}-${hash}-${stamp}`);
};

const lineColumnAt = (value: string, index: number): DifferenceLocation => {
  const before = value.slice(0, index);
  const lines = before.split('\n');

  return {
    column: lines[lines.length - 1].length + 1,
    index,
    line: lines.length,
  };
};

const lineAt = (value: string, line: number): string => value.split('\n')[line - 1] ?? '';

const firstDifferenceIndex = (left: string, right: string): number => {
  const length = Math.min(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    if (left[index] !== right[index]) {
      return index;
    }
  }

  return left.length === right.length ? -1 : length;
};

const excerptLines = (value: string, centerLine: number, radius = 3): string => {
  const lines = value.split('\n');
  const start = Math.max(1, centerLine - radius);
  const end = Math.min(lines.length, centerLine + radius);

  return lines
    .slice(start - 1, end)
    .map((line, offset) => `${String(start + offset).padStart(5, ' ')} | ${line}`)
    .join('\n');
};

const buildDiffReport = (original: string, serialized: string): string => {
  const diffIndex = firstDifferenceIndex(original, serialized);

  if (diffIndex === -1) {
    return 'Canonical original and serialized output are identical.\n';
  }

  const originalLocation = lineColumnAt(original, diffIndex);
  const serializedLocation = lineColumnAt(serialized, diffIndex);

  return [
    'Canonical original and serialized output differ.',
    '',
    `First difference index: ${diffIndex}`,
    `Original:   line ${originalLocation.line}, column ${originalLocation.column}`,
    `Serialized: line ${serializedLocation.line}, column ${serializedLocation.column}`,
    '',
    'Original line:',
    lineAt(original, originalLocation.line),
    '',
    'Serialized line:',
    lineAt(serialized, serializedLocation.line),
    '',
    'Original excerpt:',
    excerptLines(original, originalLocation.line),
    '',
    'Serialized excerpt:',
    excerptLines(serialized, serializedLocation.line),
    '',
  ].join('\n');
};

const parsePlateValue = (json: string): Value => {
  const parsed = JSON.parse(json) as unknown;

  if (Array.isArray(parsed)) {
    return parsed as Value;
  }

  if (
    parsed &&
    typeof parsed === 'object' &&
    Array.isArray((parsed as { value?: unknown }).value)
  ) {
    return (parsed as { value: Value }).value;
  }

  throw new Error('Plate JSON must be a Value array or an object with a value array');
};

export const main = async (argv: string[]) => {
  const args = parseArgs(argv);
  const plateJson = await readFile(args.platePath, 'utf8');
  const value = parsePlateValue(plateJson);
  const outDir = args.outDir ?? defaultOutDir(args.platePath);

  // IMPORTANT: This utility must stay in full sync with extension save behavior.
  // It intentionally imports the production Plate -> Markdown conversion module
  // and the shared host-side formatting reconcile. Do not reimplement either
  // conversion step in this console utility.
  const rawSerializedMarkdown = serializePlateValueWithConversionEditor(value);
  let serializedMarkdown = rawSerializedMarkdown;

  let compareExactMatch: boolean | undefined;
  let rawCompareExactMatch: boolean | undefined;
  let diffReport = 'No --compare file provided.\n';
  let compareLength: number | undefined;
  let compareLines: number | undefined;

  if (args.comparePath) {
    const originalMarkdown = await readFile(args.comparePath, 'utf8');
    serializedMarkdown = reconcileMarkdownPreservingUnchangedFormatting(
      originalMarkdown,
      rawSerializedMarkdown
    );
    compareLength = originalMarkdown.length;
    compareLines = originalMarkdown.split('\n').length;
    const canonicalOriginal = canonicalizeMarkdown(originalMarkdown);
    const canonicalRawSerialized = canonicalizeMarkdown(rawSerializedMarkdown);
    const canonicalSerialized = canonicalizeMarkdown(serializedMarkdown);
    rawCompareExactMatch = canonicalOriginal === canonicalRawSerialized;
    compareExactMatch = canonicalOriginal === canonicalSerialized;
    diffReport = buildDiffReport(canonicalOriginal, canonicalSerialized);
    await mkdir(outDir, { recursive: true });
    await writeFile(join(outDir, 'compare-original.md'), originalMarkdown);
  } else {
    await mkdir(outDir, { recursive: true });
  }

  const summary = {
    compareExactMatch,
    compareLength,
    compareLines,
    comparisonEntrypoint:
      'src/webview/lib/markdown-plate-conversion.ts#serializePlateValueWithConversionEditor + src/shared/markdown-format-reconcile.ts#reconcileMarkdownPreservingUnchangedFormatting',
    outputDirectory: outDir,
    plateNodes: value.length,
    rawCompareExactMatch,
    rawSerializedLength: rawSerializedMarkdown.length,
    rawSerializedLines: rawSerializedMarkdown.split('\n').length,
    serializedLength: serializedMarkdown.length,
    serializedLines: serializedMarkdown.split('\n').length,
  };

  await writeFile(join(outDir, 'input.plate.json'), `${JSON.stringify(value, null, 2)}\n`);
  await writeFile(join(outDir, 'serialized.raw.md'), rawSerializedMarkdown);
  await writeFile(join(outDir, 'serialized.md'), serializedMarkdown);
  await writeFile(join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(join(outDir, 'diff.txt'), diffReport);

  console.info('[Maden plate debug] summary', summary);
  console.info(`[Maden plate debug] artifacts: ${outDir}`);

  if (compareExactMatch === false) {
    console.warn(diffReport);
    if (args.strictCompare) {
      process.exitCode = 1;
    }
  }
};

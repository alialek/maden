import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

import {
  canonicalizeMarkdown,
  roundTripMarkdownWithPlate,
} from '../src/webview/lib/markdown-plate-conversion';
import { reconcileMarkdownPreservingUnchangedFormatting } from '../src/shared/markdown-format-reconcile';

type DebugMarkdownArgs = {
  filePath: string;
  outDir?: string;
  strictRoundTrip: boolean;
};

type DifferenceLocation = {
  column: number;
  index: number;
  line: number;
};

const usage = `Usage: npm run debug:markdown -- <file.md> [--out <dir>] [--strict-roundtrip]

Runs the production Markdown -> Plate -> Markdown path against a full file.
The Markdown -> Plate conversion always imports the production webview entrypoint.
Use --strict-roundtrip to exit with code 1 when serialized Markdown differs.`;

const parseArgs = (argv: string[]): DebugMarkdownArgs => {
  let filePath = '';
  let outDir: string | undefined;
  let strictRoundTrip = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      console.info(usage);
      process.exit(0);
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

    if (arg === '--strict' || arg === '--strict-roundtrip') {
      strictRoundTrip = true;
      continue;
    }

    if (arg === '--no-strict') {
      continue;
    }

    if (!filePath) {
      filePath = arg;
      continue;
    }

    throw new Error(`Unexpected argument: ${arg}`);
  }

  if (!filePath) {
    throw new Error(usage);
  }

  return {
    filePath: resolve(filePath),
    outDir: outDir ? resolve(outDir) : undefined,
    strictRoundTrip,
  };
};

const safeBaseName = (filePath: string): string => {
  const fallback = createHash('sha1').update(filePath).digest('hex').slice(0, 8);
  const safe = basename(filePath)
    .replace(/\.[^.]+$/, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return safe || `markdown-${fallback}`;
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
    return 'Canonical input and serialized output are identical.\n';
  }

  const originalLocation = lineColumnAt(original, diffIndex);
  const serializedLocation = lineColumnAt(serialized, diffIndex);

  return [
    'Canonical input and serialized output differ.',
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

export const main = async (argv: string[]) => {
  const args = parseArgs(argv);
  const markdown = await readFile(args.filePath, 'utf8');
  const outDir = args.outDir ?? defaultOutDir(args.filePath);

  // IMPORTANT: This utility must stay in full sync with the webview parser and
  // extension save behavior. It intentionally imports production conversion and
  // shared formatting reconcile functions instead of reimplementing console-only
  // Markdown/Plate behavior.
  const result = roundTripMarkdownWithPlate(markdown, {
    context: {
      fileName: basename(args.filePath),
      filePath: args.filePath,
    },
  });
  const rawSerializedMarkdown = result.serializedMarkdown;
  const serializedMarkdown = reconcileMarkdownPreservingUnchangedFormatting(
    markdown,
    rawSerializedMarkdown
  );

  const canonicalInput = canonicalizeMarkdown(markdown);
  const canonicalRawSerialized = canonicalizeMarkdown(rawSerializedMarkdown);
  const canonicalSerialized = canonicalizeMarkdown(serializedMarkdown);
  const rawExactMatch = canonicalInput === canonicalRawSerialized;
  const exactMatch = canonicalInput === canonicalSerialized;
  const diffReport = buildDiffReport(canonicalInput, canonicalSerialized);
  const summary = {
    conversionEntrypoint:
      'src/webview/lib/markdown-plate-conversion.ts#roundTripMarkdownWithPlate + src/shared/markdown-format-reconcile.ts#reconcileMarkdownPreservingUnchangedFormatting',
    inputLength: markdown.length,
    inputLines: markdown.split('\n').length,
    normalizedLength: result.normalizedMarkdown.length,
    outputDirectory: outDir,
    rawRoundTripExactMatch: rawExactMatch,
    rawSerializedLength: rawSerializedMarkdown.length,
    roundTripExactMatch: exactMatch,
    serializedLength: serializedMarkdown.length,
    stats: result.stats,
    valueNodes: result.value.length,
  };

  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'input.md'), markdown);
  await writeFile(join(outDir, 'normalized.md'), result.normalizedMarkdown);
  await writeFile(join(outDir, 'serialized.raw.md'), rawSerializedMarkdown);
  await writeFile(join(outDir, 'serialized.md'), serializedMarkdown);
  await writeFile(join(outDir, 'plate.json'), `${JSON.stringify(result.value, null, 2)}\n`);
  await writeFile(join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(join(outDir, 'diff.txt'), diffReport);

  console.info('[Maden markdown debug] summary', summary);
  console.info(`[Maden markdown debug] artifacts: ${outDir}`);

  if (!exactMatch) {
    console.warn(diffReport);
    if (args.strictRoundTrip) {
      process.exitCode = 1;
    }
  }
};

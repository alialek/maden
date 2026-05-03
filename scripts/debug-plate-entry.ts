import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type { Value } from 'platejs';

import {
  canonicalizeMarkdown,
  serializePlateValueWithConversionEditor,
} from '../src/webview/lib/markdown-plate-conversion';
import { reconcileMarkdownPreservingUnchangedFormatting } from '../src/shared/markdown-format-reconcile';
import {
  buildDiffReport,
  defaultOutDir,
  parseDebugEntryArgs,
} from './debug-entry-utils';

type DebugPlateArgs = {
  comparePath?: string;
  outDir?: string;
  platePath: string;
  strictCompare: boolean;
};

const usage = `Usage: npm run debug:plate -- <plate.json> [--compare <file.md>] [--out <dir>] [--strict-compare]

Runs the production Plate -> Markdown serialization path against a Plate JSON file.
The conversion always imports the production webview serialization entrypoint.
Use --compare to diff the serialized Markdown against an original Markdown file.`;

const parseArgs = (argv: string[]): DebugPlateArgs => {
  const args = parseDebugEntryArgs(argv, {
    compareOption: {
      flag: '--compare',
      missingValueMessage: '--compare requires a Markdown file path',
    },
    strictAliases: ['--strict', '--strict-compare'],
    usage,
  });

  return {
    comparePath: args.comparePath,
    outDir: args.outDir,
    platePath: args.inputPath,
    strictCompare: args.strict,
  };
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
  const outDir = args.outDir ?? defaultOutDir(args.platePath, 'plate');

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
    diffReport = buildDiffReport(canonicalOriginal, canonicalSerialized, {
      different: 'Canonical original and serialized output differ.',
      identical: 'Canonical original and serialized output are identical.',
    });
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

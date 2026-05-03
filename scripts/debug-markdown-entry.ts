import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

import {
  canonicalizeMarkdown,
  roundTripMarkdownWithPlate,
} from '../src/webview/lib/markdown-plate-conversion';
import { reconcileMarkdownPreservingUnchangedFormatting } from '../src/shared/markdown-format-reconcile';
import {
  buildDiffReport,
  defaultOutDir,
  parseDebugEntryArgs,
} from './debug-entry-utils';

type DebugMarkdownArgs = {
  filePath: string;
  outDir?: string;
  strictRoundTrip: boolean;
};

const usage = `Usage: npm run debug:markdown -- <file.md> [--out <dir>] [--strict-roundtrip]

Runs the production Markdown -> Plate -> Markdown path against a full file.
The Markdown -> Plate conversion always imports the production webview entrypoint.
Use --strict-roundtrip to exit with code 1 when serialized Markdown differs.`;

const parseArgs = (argv: string[]): DebugMarkdownArgs => {
  const args = parseDebugEntryArgs(argv, {
    strictAliases: ['--strict', '--strict-roundtrip'],
    usage,
  });

  return {
    filePath: args.inputPath,
    outDir: args.outDir,
    strictRoundTrip: args.strict,
  };
};

export const main = async (argv: string[]) => {
  const args = parseArgs(argv);
  const markdown = await readFile(args.filePath, 'utf8');
  const outDir = args.outDir ?? defaultOutDir(args.filePath, 'markdown');

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
  const diffReport = buildDiffReport(canonicalInput, canonicalSerialized, {
    different: 'Canonical input and serialized output differ.',
    identical: 'Canonical input and serialized output are identical.',
  });
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

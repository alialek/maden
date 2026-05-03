import { createHash } from 'node:crypto';
import { basename, resolve } from 'node:path';

type DifferenceLocation = {
  column: number;
  index: number;
  line: number;
};

export type ParsedDebugEntryArgs = {
  comparePath?: string;
  inputPath: string;
  outDir?: string;
  strict: boolean;
};

export const resolveOptionalPath = (value: string | undefined): string | undefined =>
  value ? resolve(value) : undefined;

export const parseDebugEntryArgs = (
  argv: string[],
  options: {
    compareOption?: {
      flag: string;
      missingValueMessage: string;
    };
    strictAliases: string[];
    usage: string;
  }
): ParsedDebugEntryArgs => {
  let inputPath = '';
  let comparePath: string | undefined;
  let outDir: string | undefined;
  let strict = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      console.info(options.usage);
      process.exit(0);
    }

    if (options.compareOption && arg === options.compareOption.flag) {
      const next = argv[index + 1];
      if (!next) {
        throw new Error(options.compareOption.missingValueMessage);
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

    if (options.strictAliases.includes(arg)) {
      strict = true;
      continue;
    }

    if (arg === '--no-strict') {
      continue;
    }

    if (!inputPath) {
      inputPath = arg;
      continue;
    }

    throw new Error(`Unexpected argument: ${arg}`);
  }

  if (!inputPath) {
    throw new Error(options.usage);
  }

  return {
    comparePath: resolveOptionalPath(comparePath),
    inputPath: resolve(inputPath),
    outDir: resolveOptionalPath(outDir),
    strict,
  };
};

export const safeBaseName = (
  filePath: string,
  fallbackPrefix: string
): string => {
  const fallback = createHash('sha1').update(filePath).digest('hex').slice(0, 8);
  const safe = basename(filePath)
    .replace(/\.[^.]+$/, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return safe || `${fallbackPrefix}-${fallback}`;
};

export const defaultOutDir = (
  filePath: string,
  fallbackPrefix: string
): string => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const hash = createHash('sha1').update(filePath).digest('hex').slice(0, 8);

  return resolve(
    '.maden-debug',
    `${safeBaseName(filePath, fallbackPrefix)}-${hash}-${stamp}`
  );
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

const lineAt = (value: string, line: number): string =>
  value.split('\n')[line - 1] ?? '';

const firstDifferenceIndex = (left: string, right: string): number => {
  const length = Math.min(left.length, right.length);

  for (let index = 0; index < length; index += 1) {
    if (left[index] !== right[index]) {
      return index;
    }
  }

  return left.length === right.length ? -1 : length;
};

const excerptLines = (
  value: string,
  centerLine: number,
  radius = 3
): string => {
  const lines = value.split('\n');
  const start = Math.max(1, centerLine - radius);
  const end = Math.min(lines.length, centerLine + radius);

  return lines
    .slice(start - 1, end)
    .map((line, offset) => `${String(start + offset).padStart(5, ' ')} | ${line}`)
    .join('\n');
};

export const buildDiffReport = (
  original: string,
  serialized: string,
  messages: {
    different: string;
    identical: string;
  }
): string => {
  const diffIndex = firstDifferenceIndex(original, serialized);

  if (diffIndex === -1) {
    return `${messages.identical}\n`;
  }

  const originalLocation = lineColumnAt(original, diffIndex);
  const serializedLocation = lineColumnAt(serialized, diffIndex);

  return [
    messages.different,
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

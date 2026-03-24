import path from 'node:path';

export const DEFAULT_DEBOUNCE_MS = 300;

export function getFileNameWithoutExtension(filePath: string): string {
  const parsed = path.parse(filePath);
  return parsed.name || 'Untitled';
}

export function enforceTitleHeading(markdown: string, filePath: string): string {
  void filePath;
  return markdown.replace(/\r\n/g, '\n');
}

const normalizeLineEndings = (value: string): string => value.replace(/\r\n/g, '\n');

const semanticLine = (line: string): string =>
  line
    .normalize('NFKC')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/!\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/^(\s*)([-*+]|\d+\.)\s+/u, '$1')
    .replace(/^\s{0,3}(#{1,6})\s+/u, '')
    .replace(/^\s{0,3}>\s?/u, '')
    .replace(/^(\s*)([-*_]\s*){3,}\s*$/u, '')
    .replace(/[`*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const buildLcsTable = (left: string[], right: string[]): number[][] => {
  const rows = left.length + 1;
  const cols = right.length + 1;
  const table: number[][] = Array.from({ length: rows }, () => Array<number>(cols).fill(0));

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      if (left[i - 1] === right[j - 1]) {
        table[i][j] = table[i - 1][j - 1] + 1;
      } else {
        table[i][j] = Math.max(table[i - 1][j], table[i][j - 1]);
      }
    }
  }

  return table;
};

export function reconcileMarkdownPreservingUnchangedFormatting(
  previousMarkdown: string,
  nextMarkdown: string
): string {
  const previousNormalized = normalizeLineEndings(previousMarkdown);
  const nextNormalized = normalizeLineEndings(nextMarkdown);

  if (previousNormalized === nextNormalized) {
    return previousNormalized;
  }

  const previousLines = previousNormalized.split('\n');
  const nextLines = nextNormalized.split('\n');
  const previousSemantic = previousLines.map(semanticLine);
  const nextSemantic = nextLines.map(semanticLine);

  // If only markdown punctuation/formatting changed, preserve the original text verbatim.
  if (
    previousSemantic.length === nextSemantic.length &&
    previousSemantic.every((line, index) => line === nextSemantic[index])
  ) {
    return previousNormalized;
  }

  const previousSemanticWithoutEmpty = previousSemantic.filter((line) => line.length > 0);
  const nextSemanticWithoutEmpty = nextSemantic.filter((line) => line.length > 0);
  if (
    previousSemanticWithoutEmpty.length === nextSemanticWithoutEmpty.length &&
    previousSemanticWithoutEmpty.every((line, index) => line === nextSemanticWithoutEmpty[index])
  ) {
    return previousNormalized;
  }

  const table = buildLcsTable(previousSemantic, nextSemantic);
  const operations: Array<
    | { type: 'equal'; previousIndex: number; nextIndex: number }
    | { type: 'insert'; nextIndex: number }
    | { type: 'delete'; previousIndex: number }
  > = [];

  let i = previousSemantic.length;
  let j = nextSemantic.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && previousSemantic[i - 1] === nextSemantic[j - 1]) {
      operations.push({ type: 'equal', previousIndex: i - 1, nextIndex: j - 1 });
      i -= 1;
      j -= 1;
      continue;
    }

    const left = i > 0 ? table[i - 1][j] : -1;
    const up = j > 0 ? table[i][j - 1] : -1;

    if (j > 0 && (i === 0 || up >= left)) {
      operations.push({ type: 'insert', nextIndex: j - 1 });
      j -= 1;
    } else {
      operations.push({ type: 'delete', previousIndex: i - 1 });
      i -= 1;
    }
  }

  operations.reverse();

  const mergedLines: string[] = [];

  for (const operation of operations) {
    if (operation.type === 'equal') {
      mergedLines.push(previousLines[operation.previousIndex] ?? '');
      continue;
    }

    if (operation.type === 'insert') {
      mergedLines.push(nextLines[operation.nextIndex] ?? '');
    }
  }

  const merged = mergedLines.join('\n');
  if (nextNormalized.endsWith('\n') && !merged.endsWith('\n')) {
    return `${merged}\n`;
  }

  return merged;
}

const normalizeLineEndings = (value: string): string => value.replace(/\r\n/g, '\n');

const ZERO_WIDTH_PATTERN = /[\u200B-\u200D\uFEFF]/g;
const ZERO_WIDTH_TEST_PATTERN = /[\u200B-\u200D\uFEFF]/u;
const EMPTY_PARAGRAPH_SEMANTIC_LINE = 'maden-empty-paragraph';

const isFenceLine = (line: string): boolean =>
  /^ {0,3}(`{3,}|~{3,})/u.test(line.trimStart());

const splitMarkdownTableCells = (line: string): string[] | null => {
  const trimmed = line.trim();

  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) {
    return null;
  }

  const content = trimmed.slice(1, -1);
  const cells: string[] = [];
  let current = '';

  for (let index = 0; index < content.length; index += 1) {
    const character = content[index] ?? '';
    let backslashCount = 0;

    for (
      let previousIndex = index - 1;
      previousIndex >= 0 && content[previousIndex] === '\\';
      previousIndex -= 1
    ) {
      backslashCount += 1;
    }

    if (character === '|' && backslashCount % 2 === 0) {
      cells.push(current);
      current = '';
      continue;
    }

    current += character;
  }

  cells.push(current);

  return cells;
};

const isTableDelimiterCell = (cell: string): boolean =>
  /^:?-{1,}:?$/u.test(cell.trim().replace(/\s+/g, ''));

const normalizeTableDelimiterCell = (cell: string): string => {
  const normalized = cell.trim().replace(/\s+/g, '');
  const left = normalized.startsWith(':');
  const right = normalized.endsWith(':');

  if (left && right) return ':---:';
  if (left) return ':---';
  if (right) return '---:';
  return '---';
};

const compactMarkdownTableLine = (line: string): string => {
  const cells = splitMarkdownTableCells(line);

  if (!cells || cells.length < 2) {
    return line;
  }

  const trimmedCells = cells.map((cell) => cell.trim().replace(ZERO_WIDTH_PATTERN, ''));

  if (trimmedCells.every(isTableDelimiterCell)) {
    return `| ${trimmedCells.map(normalizeTableDelimiterCell).join(' | ')} |`;
  }

  return `|${trimmedCells
    .map((cell) => (cell.length > 0 ? ` ${cell} ` : ' '))
    .join('|')}|`;
};

export const compactMarkdownTableWhitespace = (markdown: string): string => {
  let inFence = false;

  return markdown
    .split('\n')
    .map((line) => {
      if (isFenceLine(line)) {
        inFence = !inFence;
        return line;
      }

      if (inFence) {
        return line;
      }

      return compactMarkdownTableLine(line);
    })
    .join('\n');
};

const normalizeTableLine = (line: string): string => {
  const trimmed = line.trim();

  if (!trimmed.includes('|')) {
    return line;
  }

  const cells = trimmed
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());

  if (
    cells.length > 1 &&
    cells.every((cell) => /^:?-{3,}:?$/u.test(cell.replace(/\s+/g, '')))
  ) {
    return '';
  }

  return cells.join('|');
};

const isExplicitEmptyParagraphLine = (line: string): boolean =>
  ZERO_WIDTH_TEST_PATTERN.test(line) &&
  line.replace(ZERO_WIDTH_PATTERN, '').trim().length === 0;

const semanticLine = (line: string): string =>
  (() => {
    if (isExplicitEmptyParagraphLine(line)) {
      return EMPTY_PARAGRAPH_SEMANTIC_LINE;
    }

    const normalizedTableLine = normalizeTableLine(line);
    const codeFenceMatch = normalizedTableLine
      .trim()
      .match(/^(`{3,}|~{3,})(.*)$/u);

    if (codeFenceMatch) {
      return `code-fence:${codeFenceMatch[1][0]}:${codeFenceMatch[2].trim().toLowerCase()}`;
    }

    if (/^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/u.test(normalizedTableLine)) {
      return 'thematic-break';
    }

    return normalizedTableLine;
  })()
    .normalize('NFKC')
    .replace(ZERO_WIDTH_PATTERN, '')
    .replace(/&nbsp;|&#160;|&#xA0;/gi, ' ')
    .replace(/<br\s*\/?>/gi, '<br>')
    .replace(/\\([\\`*_[\]{}()#+\-.!|<>])/g, '$1')
    .replace(/!\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/^(\s*)(?:\\)?[-*+]\s+/u, '$1')
    .replace(/^(\s*)\d+\.\s+/u, '$1')
    .replace(/^\s{0,3}(#{1,6})\s+/u, '')
    .replace(/^\s{0,3}>\s?/u, '')
    .replace(/[`*_~]/g, '')
    .replace(/[\[\]]/g, '')
    .replace(/\\$/u, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const normalizeFormattingNoise = (line: string): string =>
  line
    .normalize('NFKC')
    .replace(ZERO_WIDTH_PATTERN, '')
    .replace(/&nbsp;|&#160;|&#xA0;/gi, ' ')
    .replace(/<br\s*\/?>/gi, '<br>')
    .replace(/\\([\\`*_[\]{}()#+\-.!|<>])/g, '$1')
    .replace(/(^|[^\w])__([^_\n]+?)__($|[^\w])/gu, '$1**$2**$3')
    .replace(/(^|[^\w])_([^_\n]+?)_($|[^\w])/gu, '$1*$2*$3')
    .replace(/\s+/g, ' ')
    .trim();

const isMarkdownFormattingNoiseVariant = (
  previousLine: string,
  nextLine: string
): boolean =>
  previousLine !== nextLine &&
  semanticLine(previousLine) === semanticLine(nextLine) &&
  normalizeFormattingNoise(previousLine) === normalizeFormattingNoise(nextLine);

const buildFenceMask = (lines: string[]): boolean[] => {
  let inFence = false;

  return lines.map((line) => {
    const lineIsInFence = inFence;

    if (isFenceLine(line)) {
      inFence = !inFence;
    }

    return lineIsInFence;
  });
};

const preserveUniquePreviousFormatting = (
  previousLines: string[],
  mergedLines: string[]
): string[] => {
  const previousFenceMask = buildFenceMask(previousLines);
  const mergedFenceMask = buildFenceMask(mergedLines);
  const previousBySemantic = new Map<
    string,
    { count: number; line: string }
  >();

  previousLines.forEach((line, index) => {
    if (previousFenceMask[index]) {
      return;
    }

    const semantic = semanticLine(line);

    if (!semantic || semantic === EMPTY_PARAGRAPH_SEMANTIC_LINE) {
      return;
    }

    const entry = previousBySemantic.get(semantic);
    if (entry) {
      entry.count += 1;
      return;
    }

    previousBySemantic.set(semantic, { count: 1, line });
  });

  return mergedLines.map((line, index) => {
    if (mergedFenceMask[index]) {
      return line;
    }

    const semantic = semanticLine(line);
    const previousEntry = previousBySemantic.get(semantic);

    if (
      previousEntry?.count === 1 &&
      isMarkdownFormattingNoiseVariant(previousEntry.line, line)
    ) {
      return previousEntry.line;
    }

    return line;
  });
};

const buildSemanticLines = (lines: string[]): string[] => {
  let inFence = false;

  return lines.map((line) => {
    if (isFenceLine(line)) {
      inFence = !inFence;
      return semanticLine(line);
    }

    if (inFence) {
      return `code:${line.normalize('NFKC').replace(ZERO_WIDTH_PATTERN, '')}`;
    }

    return semanticLine(line);
  });
};

const buildLcsTable = (left: string[], right: string[]): number[][] => {
  const rows = left.length + 1;
  const cols = right.length + 1;
  const table: number[][] = Array.from({ length: rows }, () =>
    Array<number>(cols).fill(0)
  );

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
  const nextNormalized = compactMarkdownTableWhitespace(normalizeLineEndings(nextMarkdown));

  if (previousNormalized === nextNormalized) {
    return previousNormalized;
  }

  const previousLines = previousNormalized.split('\n');
  const nextLines = nextNormalized.split('\n');
  const previousSemantic = buildSemanticLines(previousLines);
  const nextSemantic = buildSemanticLines(nextLines);

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

  for (let operationIndex = 0; operationIndex < operations.length; operationIndex += 1) {
    const operation = operations[operationIndex];

    if (operation.type === 'equal') {
      mergedLines.push(previousLines[operation.previousIndex] ?? '');
      continue;
    }

    if (operation.type === 'insert') {
      const previousOperation = operations[operationIndex - 1];
      const nextOperation = operations[operationIndex + 1];
      const insertedSemanticLine = nextSemantic[operation.nextIndex] ?? '';
      const isSerializerBlankBetweenUnchangedAdjacentLines =
        insertedSemanticLine.length === 0 &&
        previousOperation?.type === 'equal' &&
        nextOperation?.type === 'equal' &&
        nextOperation.previousIndex === previousOperation.previousIndex + 1;

      if (isSerializerBlankBetweenUnchangedAdjacentLines) {
        continue;
      }

      mergedLines.push(nextLines[operation.nextIndex] ?? '');
    }
  }

  const merged = preserveUniquePreviousFormatting(previousLines, mergedLines).join('\n');
  if (nextNormalized.endsWith('\n') && !merged.endsWith('\n')) {
    return `${merged}\n`;
  }

  return merged;
}

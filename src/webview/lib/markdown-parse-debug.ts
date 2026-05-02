import type { Value } from 'platejs';

type MarkdownParseContext = {
  fileName?: string;
  filePath?: string;
};

type MarkdownParseSnapshot = {
  context: MarkdownParseContext;
  hints: MarkdownAngleHint[];
  inputLength: number;
  lineCount: number;
  normalizedLength?: number;
  sections?: Array<{
    index: number;
    length: number;
    preview: string;
    type: string;
  }>;
  stage: string;
};

type MarkdownAngleHint = {
  column: number;
  line: number;
  token: string;
};

const PARSE_LOG_PREFIX = '[Maden markdown parse]';
const MAX_HINTS = 20;
const MAX_PREVIEW_LENGTH = 220;

const likelyHtmlTags = new Set([
  'a',
  'br',
  'code',
  'del',
  'details',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  'span',
  'strong',
  'summary',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
]);

const supportedMdxTags = new Set(['excalidraw', 'toc']);

const preview = (value: string): string =>
  value.replace(/\s+/g, ' ').trim().slice(0, MAX_PREVIEW_LENGTH);

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const getErrorLocation = (error: unknown): { column?: number; line?: number } => {
  if (!error || typeof error !== 'object') {
    return {};
  }

  const candidate = error as {
    column?: unknown;
    line?: unknown;
    place?: { column?: unknown; line?: unknown };
    position?: {
      start?: { column?: unknown; line?: unknown };
    };
  };

  const line =
    typeof candidate.line === 'number'
      ? candidate.line
      : typeof candidate.place?.line === 'number'
        ? candidate.place.line
        : typeof candidate.position?.start?.line === 'number'
          ? candidate.position.start.line
          : undefined;
  const column =
    typeof candidate.column === 'number'
      ? candidate.column
      : typeof candidate.place?.column === 'number'
        ? candidate.place.column
        : typeof candidate.position?.start?.column === 'number'
          ? candidate.position.start.column
          : undefined;

  return { column, line };
};

const snippetAround = (
  markdown: string,
  line: number | undefined,
  radius = 2
): string[] => {
  if (!line || line < 1) {
    return [];
  }

  const lines = markdown.split('\n');
  const start = Math.max(1, line - radius);
  const end = Math.min(lines.length, line + radius);
  const result: string[] = [];

  for (let current = start; current <= end; current += 1) {
    result.push(`${current}: ${lines[current - 1] ?? ''}`);
  }

  return result;
};

export const collectMarkdownAngleHints = (markdown: string): MarkdownAngleHint[] => {
  const hints: MarkdownAngleHint[] = [];
  const lines = markdown.split('\n');
  const tokenRegex = /<[^>\n]+>/g;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(line)) !== null) {
      const token = match[0];
      const tagMatch = token.match(/^<\/?\s*([A-Za-z][\w:-]*)/);
      const tagName = tagMatch?.[1]?.toLowerCase();
      const isSupportedMdx = tagName ? supportedMdxTags.has(tagName) : false;
      const isLikelyHtml = tagName ? likelyHtmlTags.has(tagName) : false;
      const containsWhitespace = /\s/.test(token.slice(1, -1).trim());
      const startsLikePlaceholder = /^<\s*[@А-Яа-яЁё]/.test(token);

      if (!isSupportedMdx && (!isLikelyHtml || containsWhitespace || startsLikePlaceholder)) {
        hints.push({
          column: match.index + 1,
          line: index + 1,
          token,
        });
      }

      if (hints.length >= MAX_HINTS) {
        return hints;
      }
    }
  }

  return hints;
};

const setLastParseDebugSnapshot = (snapshot: MarkdownParseSnapshot) => {
  (globalThis as typeof globalThis & { __MADEN_LAST_PARSE_DEBUG__?: MarkdownParseSnapshot })
    .__MADEN_LAST_PARSE_DEBUG__ = snapshot;
};

export const logMarkdownParseStart = ({
  context,
  markdown,
  stage,
}: {
  context: MarkdownParseContext;
  markdown: string;
  stage: string;
}) => {
  const snapshot: MarkdownParseSnapshot = {
    context,
    hints: collectMarkdownAngleHints(markdown),
    inputLength: markdown.length,
    lineCount: markdown.split('\n').length,
    stage,
  };
  setLastParseDebugSnapshot(snapshot);

  console.groupCollapsed(
    `${PARSE_LOG_PREFIX} ${stage}: start ${context.fileName ?? ''}`.trim()
  );
  console.info('context', context);
  console.info('input', {
    length: snapshot.inputLength,
    lineCount: snapshot.lineCount,
    preview: preview(markdown),
  });
  if (snapshot.hints.length > 0) {
    console.warn('possible MDX/HTML angle-bracket tokens', snapshot.hints);
  }
  console.info('debug snapshot', 'globalThis.__MADEN_LAST_PARSE_DEBUG__');
  console.groupEnd();
};

export const logMarkdownParseNormalized = ({
  context,
  markdown,
  normalized,
  sections,
  stage,
}: {
  context: MarkdownParseContext;
  markdown: string;
  normalized: string;
  sections: Array<{ content?: string; body?: string; type: string }>;
  stage: string;
}) => {
  const snapshot: MarkdownParseSnapshot = {
    context,
    hints: collectMarkdownAngleHints(normalized),
    inputLength: markdown.length,
    lineCount: markdown.split('\n').length,
    normalizedLength: normalized.length,
    sections: sections.map((section, index) => {
      const source = section.type === 'details' ? section.body ?? '' : section.content ?? '';
      return {
        index,
        length: source.length,
        preview: preview(source),
        type: section.type,
      };
    }),
    stage,
  };
  setLastParseDebugSnapshot(snapshot);

  console.groupCollapsed(
    `${PARSE_LOG_PREFIX} ${stage}: normalized ${context.fileName ?? ''}`.trim()
  );
  console.info('context', context);
  console.info('normalization', {
    changed: markdown !== normalized,
    inputLength: markdown.length,
    normalizedLength: normalized.length,
    sectionCount: sections.length,
  });
  console.info('sections', snapshot.sections);
  if (snapshot.hints.length > 0) {
    console.warn('possible MDX/HTML angle-bracket tokens after normalization', snapshot.hints);
  }
  console.groupEnd();
};

export const logMarkdownSectionParse = ({
  context,
  index,
  source,
  type,
}: {
  context: MarkdownParseContext;
  index: number;
  source: string;
  type: string;
}) => {
  console.debug(`${PARSE_LOG_PREFIX} section parse`, {
    context,
    index,
    length: source.length,
    preview: preview(source),
    type,
  });
};

export const logMarkdownParseSuccess = ({
  context,
  nodeCount,
  stage,
}: {
  context: MarkdownParseContext;
  nodeCount: number;
  stage: string;
}) => {
  console.info(`${PARSE_LOG_PREFIX} ${stage}: success`, {
    context,
    nodeCount,
  });
};

export const logMarkdownParseError = ({
  context,
  error,
  markdown,
  sectionIndex,
  stage,
}: {
  context: MarkdownParseContext;
  error: unknown;
  markdown: string;
  sectionIndex?: number;
  stage: string;
}) => {
  const location = getErrorLocation(error);
  const snippet = snippetAround(markdown, location.line);

  console.groupCollapsed(
    `${PARSE_LOG_PREFIX} ${stage}: error ${context.fileName ?? ''}`.trim()
  );
  console.error('error', error);
  console.error('message', errorMessage(error));
  console.info('context', context);
  console.info('location', {
    ...location,
    sectionIndex,
  });
  if (snippet.length > 0) {
    console.error('snippet', snippet.join('\n'));
  }
  console.warn('possible MDX/HTML angle-bracket tokens', collectMarkdownAngleHints(markdown));
  console.groupEnd();
};

export const logEditorValueSanitizeStats = ({
  context,
  nodeCount,
  stats,
  stage,
}: {
  context: MarkdownParseContext;
  nodeCount: number;
  stage: string;
  stats: {
    repairedExamples: string[];
    repairedMissingType: number;
    repairedNodes: number;
    repairedNonObject: number;
    repairedTableStructure: number;
    repairedWithoutChildren: number;
  };
}) => {
  if (stats.repairedNodes === 0) {
    return;
  }

  console.warn(`${PARSE_LOG_PREFIX} ${stage}: sanitized parsed value`, {
    context,
    nodeCount,
    stats,
  });
};

export const summarizeParseErrorForHost = (
  error: unknown,
  markdown: string,
  sectionIndex?: number
): string => {
  const location = getErrorLocation(error);
  const snippet = snippetAround(markdown, location.line);

  return [
    errorMessage(error),
    location.line
      ? `Location: line ${location.line}${location.column ? `, column ${location.column}` : ''}`
      : '',
    sectionIndex !== undefined ? `Section index: ${sectionIndex}` : '',
    snippet.length > 0 ? `Snippet:\n${snippet.join('\n')}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
};

export const countValueNodes = (value: Value): number => value.length;

import { imageTagToMarkdown } from '@/lib/html-markdown';

const normalizeImageParagraph = (inner: string): string | null => {
  const pieces: string[] = [];
  const hasLineBreak = /<br\s*\/?>/i.test(inner);
  const tokenRegex = /<a\b[^>]*>\s*<img\b[^>]*>\s*<\/a>|<img\b[^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(inner)) !== null) {
    const token = match[0];
    const imageTag = token.match(/<img\b[^>]*>/i)?.[0];
    if (!imageTag) continue;

    const markdownImage = imageTagToMarkdown(imageTag);
    if (!markdownImage) continue;
    pieces.push(markdownImage);
  }

  // Only rewrite paragraphs that are effectively image-only (plus whitespace).
  const stripped = inner.replace(tokenRegex, '').replace(/\s+/g, '');
  if (pieces.length === 0 || stripped.length > 0) {
    return null;
  }

  if (pieces.length === 1) {
    return `${pieces[0]}\n\n`;
  }

  if (hasLineBreak) {
    return `${pieces.join('\n')}\n\n`;
  }

  const headerRow = `| ${pieces.join(' | ')} |`;
  const separatorRow = `| ${pieces.map(() => '---').join(' | ')} |`;
  return `${headerRow}\n${separatorRow}\n\n`;
};

const FENCED_CODE_BLOCK_REGEX =
  /(^|\n)([ \t]*)(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n\2\3[ \t]*(?=\n|$)/g;

const applyOutsideFencedCodeBlocks = (
  markdown: string,
  transform: (markdown: string) => string
): string => {
  const blocks: string[] = [];
  const protectedMarkdown = markdown.replace(FENCED_CODE_BLOCK_REGEX, (block) => {
    const token = `\u0000MADEN_FENCED_CODE_${blocks.length}\u0000`;
    blocks.push(block);
    return token;
  });

  return transform(protectedMarkdown).replace(
    /\u0000MADEN_FENCED_CODE_(\d+)\u0000/g,
    (token, index: string) => blocks[Number(index)] ?? token
  );
};

const htmlTagNames = new Set([
  'a',
  'abbr',
  'b',
  'blockquote',
  'br',
  'caption',
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

const shouldEscapeAngleToken = (token: string): boolean => {
  const inner = token.slice(1, -1).trim();
  if (!inner) {
    return false;
  }

  if (
    /^!|^\?|^!--/.test(inner) ||
    /^[a-z][a-z\d+.-]*:/i.test(inner) ||
    /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(inner)
  ) {
    return false;
  }

  const tagMatch = inner.match(/^\/?\s*([A-Za-z][\w:-]*)/);
  const tagName = tagMatch?.[1]?.toLowerCase();
  if (tagName && htmlTagNames.has(tagName)) {
    return false;
  }

  if (inner.startsWith('/')) {
    return false;
  }

  if (/[А-Яа-яЁё]/.test(inner) || inner.startsWith('@')) {
    return true;
  }

  if (/\s/.test(inner) && !/[=\\"']/.test(inner)) {
    return true;
  }

  return false;
};

const replaceEscapedAngleTokens = (
  source: string,
  replacement: (inner: string) => string
): string =>
  source.replace(/\\<([^<>\n]+)>/g, (match, inner: string) => {
    const token = `<${inner}>`;
    return shouldEscapeAngleToken(token) ? replacement(inner) : match;
  });

export const escapeMarkdownPlaceholderAngles = (markdown: string): string =>
  applyOutsideFencedCodeBlocks(markdown, (source) =>
    replaceEscapedAngleTokens(source, (inner) => `&lt;${inner}&gt;`)
      .replace(/<[^<>\n]+>/g, (token) => {
        if (!shouldEscapeAngleToken(token)) {
          return token;
        }

        return `&lt;${token.slice(1, -1)}&gt;`;
      })
  );

export const unescapeMarkdownPlaceholderAngles = (markdown: string): string =>
  applyOutsideFencedCodeBlocks(markdown, (source) =>
    replaceEscapedAngleTokens(source, (inner) => `<${inner}>`)
  );

const isMarkdownTableLine = (line: string): boolean => {
  const trimmed = line.trim();
  return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.slice(1, -1).includes('|');
};

const normalizeHtmlBreaks = (markdown: string): string =>
  markdown
    .split('\n')
    .map((line) =>
      isMarkdownTableLine(line) ? line : line.replace(/<br\s*\/?>/gi, '\n')
    )
    .join('\n');

const isStandaloneFormattedLine = (line: string): boolean => {
  const trimmed = line.trim();
  return (
    /^\*\*\*[^*\n].*[^*\n]\*\*\*$/.test(trimmed) ||
    /^\*\*[^*\n].*[^*\n]\*\*$/.test(trimmed) ||
    /^\*[^*\n].*[^*\n]\*$/.test(trimmed) ||
    /^___[^_\n].*[^_\n]___$/.test(trimmed) ||
    /^__[^_\n].*[^_\n]__$/.test(trimmed) ||
    /^_[^_\n].*[^_\n]_$/.test(trimmed)
  );
};

const normalizeStandaloneFormattedLineBreaks = (markdown: string): string => {
  const lines = markdown.split('\n');

  return lines
    .map((line, index) => {
      const next = lines[index + 1];
      if (
        next === undefined ||
        !next.trim() ||
        isMarkdownTableLine(line) ||
        isMarkdownTableLine(next) ||
        !isStandaloneFormattedLine(line) ||
        /(?: {2}|\\)$/.test(line)
      ) {
        return line;
      }

      return `${line.replace(/\s+$/, '')}  `;
    })
    .join('\n');
};

export const normalizeOpenDocumentMarkdown = (markdown: string): string => {
  let result = markdown.replace(/\r\n/g, '\n');

  return applyOutsideFencedCodeBlocks(result, (outsideCode) => {
    result = outsideCode.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (_full, inner: string) => {
      const normalized = normalizeImageParagraph(inner);
      return normalized ?? _full;
    });

    result = result
      .replace(/<a\b[^>]*>\s*(<img\b[^>]*>)\s*<\/a>/gi, (_full, imgTag: string) => {
        return imageTagToMarkdown(imgTag) ?? _full;
      })
      .replace(/<img\b[^>]*>/gi, (imgTag) => {
        return imageTagToMarkdown(imgTag) ?? imgTag;
      })
      .replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, '**$2**')
      .replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, '*$2*')
      .replace(/<p\b[^>]*>/gi, '')
      .replace(/<\/p>/gi, '\n\n');

    result = normalizeHtmlBreaks(result);
    result = normalizeStandaloneFormattedLineBreaks(result);

    return escapeMarkdownPlaceholderAngles(result);
  });
};

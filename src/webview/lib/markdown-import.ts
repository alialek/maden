const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, '\n');

const getHtmlAttribute = (tag: string, attribute: string): string | null => {
  const escapedAttribute = attribute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(
    new RegExp(`${escapedAttribute}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')
  );

  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
};

const imageTagToMarkdown = (imgTag: string): string | null => {
  const src = getHtmlAttribute(imgTag, 'src');
  if (!src) return null;

  const alt = (getHtmlAttribute(imgTag, 'alt') ?? '').replace(/\]/g, '\\]');
  const safeSrc = src.replace(/>/g, '%3E');
  return `![${alt}](<${safeSrc}>)`;
};

const LINE_BREAK_TOKEN = '__MADEN_HTML_BR__';

const normalizeHtmlInlineSegment = (segment: string, keepLineBreakToken = false): string => {
  let normalized = segment
    .replace(/<br\s*\/?>/gi, LINE_BREAK_TOKEN)
    .replace(/>\s+</g, '><');

  normalized = normalized.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, (anchorTag) => {
    const href = getHtmlAttribute(anchorTag, 'href');
    const inner = anchorTag.match(/<a\b[^>]*>([\s\S]*?)<\/a>/i)?.[1] ?? '';

    if (!href) return anchorTag;

    const imageMatches = [...inner.matchAll(/<img\b[^>]*>/gi)];
    if (imageMatches.length > 0) {
      const imageMarkdownParts = imageMatches
        .map((match) => imageTagToMarkdown(match[0]))
        .filter((value): value is string => Boolean(value));

      if (imageMarkdownParts.length > 0) {
        return imageMarkdownParts.join('');
      }
    }

    // Keep non-image HTML anchors unchanged on import. Converting arbitrary hrefs
    // to markdown can break parsing when URLs include unescaped markdown chars.
    return anchorTag;
  });

  normalized = normalized.replace(/<img\b[^>]*>/gi, (imgTag) => {
    return imageTagToMarkdown(imgTag) ?? imgTag;
  });

  normalized = normalized
    .replace(/<(strong|b)>([\s\S]*?)<\/\1>/gi, '**$2**')
    .replace(/<(em|i)>([\s\S]*?)<\/\1>/gi, '*$2*');

  if (!keepLineBreakToken) {
    normalized = normalized.replace(new RegExp(LINE_BREAK_TOKEN, 'g'), '\n');
  }

  return normalized;
};

const collapseParagraphWhitespace = (content: string): string => {
  return content
    .replace(/[ \t\r\n]+/g, ' ')
    .replace(new RegExp(`\\s*${LINE_BREAK_TOKEN}\\s*`, 'g'), LINE_BREAK_TOKEN)
    .split(LINE_BREAK_TOKEN)
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .trim();
};

const IMAGE_MARKDOWN_REGEX = /!\[[^\]]*]\((?:<[^>]+>|[^)]+)\)/g;

const normalizeImageOnlyParagraph = (content: string): string | null => {
  const images = content.match(IMAGE_MARKDOWN_REGEX) ?? [];
  const remainder = content.replace(IMAGE_MARKDOWN_REGEX, '').replace(/\s+/g, '');
  const hasLineBreak = content.includes('\n');

  if (images.length === 0 || remainder.length > 0) {
    return null;
  }

  if (images.length === 1) {
    return images[0];
  }

  // If HTML paragraph had explicit <br> separators, keep stacked layout.
  if (hasLineBreak) {
    return images.join('\n');
  }

  const headerRow = `| ${images.join(' | ')} |`;
  const separatorRow = `| ${images.map(() => '---').join(' | ')} |`;
  return `${headerRow}\n${separatorRow}`;
};

const normalizeHtmlMarkdownSegment = (segment: string): string => {
  let normalized = segment;

  normalized = normalized.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (_fullMatch, inner: string) => {
    const inlineNormalized = normalizeHtmlInlineSegment(inner, true);
    const collapsed = collapseParagraphWhitespace(inlineNormalized);
    const imageOnly = normalizeImageOnlyParagraph(collapsed);
    if (imageOnly) {
      return `${imageOnly}\n\n`;
    }
    return collapsed.length > 0 ? `${collapsed}\n\n` : '\n\n';
  });

  normalized = normalizeHtmlInlineSegment(normalized)
    .replace(/<p\b[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n\n');

  return normalized;
};

export const normalizeImportedMarkdown = (markdown: string): string => {
  const normalized = normalizeLineEndings(markdown);
  if (!/<(?:p|a|img|br|strong|b|em|i)\b/i.test(normalized)) {
    return normalized;
  }
  const codeFenceRegex = /```[\s\S]*?```/g;
  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeFenceRegex.exec(normalized)) !== null) {
    result += normalizeHtmlMarkdownSegment(normalized.slice(lastIndex, match.index));
    result += match[0];
    lastIndex = codeFenceRegex.lastIndex;
  }

  result += normalizeHtmlMarkdownSegment(normalized.slice(lastIndex));
  return result.replace(/\n{3,}/g, '\n\n');
};

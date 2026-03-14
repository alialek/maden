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

export const normalizeOpenDocumentMarkdown = (markdown: string): string => {
  let result = markdown.replace(/\r\n/g, '\n');

  result = result.replace(/<p\b[^>]*>([\s\S]*?)<\/p>/gi, (_full, inner: string) => {
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
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<p\b[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n\n');

  return result;
};

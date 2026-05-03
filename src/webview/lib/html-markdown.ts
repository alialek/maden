export const getHtmlAttribute = (
  tag: string,
  attribute: string
): string | null => {
  const escapedAttribute = attribute.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(
    new RegExp(
      `${escapedAttribute}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,
      'i'
    )
  );

  return match?.[1] ?? match?.[2] ?? match?.[3] ?? null;
};

export const imageTagToMarkdown = (imgTag: string): string | null => {
  const src = getHtmlAttribute(imgTag, 'src');
  if (!src) return null;

  const alt = (getHtmlAttribute(imgTag, 'alt') ?? '').replace(/\]/g, '\\]');
  const safeSrc = src.replace(/>/g, '%3E');
  return `![${alt}](<${safeSrc}>)`;
};

export type StructuredResponseAction = 'add' | 'comment' | 'inline';

export type ParsedStructuredResponse = {
  action: StructuredResponseAction;
  content: string;
  isClosed: boolean;
  isStructured: boolean;
};

export const MadenResponseOpenTagPattern =
  /<maden-response\s+action="(inline|comment|add)">/i;
export const MadenResponseCloseTag = '</maden-response>';
export const AnyMadenResponseTagPattern = /<\/?maden-response\b[^>]*>/gi;
export const PartialMadenResponseSuffixPattern = /<\/?maden-response[^>]*$/i;

const trimPartialCloseTagSuffix = (value: string) => {
  for (let length = MadenResponseCloseTag.length - 1; length > 0; length -= 1) {
    if (value.endsWith(MadenResponseCloseTag.slice(0, length))) {
      return value.slice(0, -length);
    }
  }

  return value;
};

export const parseStructuredResponse = (
  value: string
): ParsedStructuredResponse | null => {
  const match = value.match(MadenResponseOpenTagPattern);
  if (!match || match.index === undefined) {
    return null;
  }

  const action = match[1]?.toLowerCase() as StructuredResponseAction | undefined;
  if (action !== 'inline' && action !== 'comment' && action !== 'add') {
    return null;
  }

  const bodyStart = match.index + match[0].length;
  const remainder = value.slice(bodyStart);
  const closeIndex = remainder.indexOf(MadenResponseCloseTag);
  const rawContent =
    closeIndex >= 0
      ? remainder.slice(0, closeIndex)
      : trimPartialCloseTagSuffix(remainder);
  const content = rawContent.replace(/^\s+/, '');

  return {
    action,
    content,
    isClosed: closeIndex >= 0,
    isStructured: true,
  };
};

export const stripStructuredResponseWrappers = (value: string): string =>
  trimPartialCloseTagSuffix(
    value
      .replace(AnyMadenResponseTagPattern, '')
      .replace(PartialMadenResponseSuffixPattern, '')
  ).trim();

import { KEYS, type TElement, type Value } from 'platejs';

const DETAILS_REGEX = /<details\b[^>]*>([\s\S]*?)<\/details>/gi;
const SUMMARY_REGEX = /<summary\b[^>]*>([\s\S]*?)<\/summary>/i;

export type DetailsSection =
  | {
      type: 'markdown';
      content: string;
    }
  | {
      type: 'details';
      summary: string;
      body: string;
    };

const stripHtmlTags = (value: string) =>
  value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const stripMarkdownWrappers = (value: string) =>
  value
    .replace(/^\s*(\*\*|__|\*|_)+\s*/, '')
    .replace(/\s*(\*\*|__|\*|_)+\s*$/, '')
    .trim();

export const splitMarkdownByDetails = (markdown: string): DetailsSection[] => {
  const sections: DetailsSection[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = DETAILS_REGEX.exec(markdown)) !== null) {
    const before = markdown.slice(lastIndex, match.index);
    if (before.trim().length > 0) {
      sections.push({ type: 'markdown', content: before });
    }

    const inner = match[1] ?? '';
    const summaryMatch = inner.match(SUMMARY_REGEX);
    if (!summaryMatch) {
      sections.push({ type: 'markdown', content: match[0] });
      lastIndex = DETAILS_REGEX.lastIndex;
      continue;
    }

    const summary = stripMarkdownWrappers(stripHtmlTags(summaryMatch[1] ?? '')) || 'Details';
    const body = inner.replace(SUMMARY_REGEX, '').trim();
    sections.push({
      type: 'details',
      summary,
      body,
    });

    lastIndex = DETAILS_REGEX.lastIndex;
  }

  const tail = markdown.slice(lastIndex);
  if (tail.trim().length > 0) {
    sections.push({ type: 'markdown', content: tail });
  }

  return sections;
};

export const materializeDetailsSections = (
  sections: DetailsSection[],
  parseMarkdown: (markdown: string) => Value
): Value => {
  const output: Value = [];

  for (const section of sections) {
    if (section.type === 'markdown') {
      output.push(...parseMarkdown(section.content));
      continue;
    }

    const bodyNodes = parseMarkdown(section.body);
    output.push({
      type: KEYS.toggle,
      children: [{ text: section.summary }],
    } as TElement);

    for (const node of bodyNodes) {
      const element = node as TElement;
      const currentIndent =
        typeof (element as { indent?: unknown })[KEYS.indent] === 'number'
          ? Number((element as { indent?: number })[KEYS.indent])
          : 0;

      output.push({
        ...element,
        [KEYS.indent]: currentIndent + 1,
      } as TElement);
    }
  }

  return output;
};

const getTextFromNode = (node: unknown): string => {
  if (!node || typeof node !== 'object') return '';

  const slateNode = node as { text?: unknown; children?: unknown[] };
  if (typeof slateNode.text === 'string') {
    return slateNode.text;
  }

  if (!Array.isArray(slateNode.children)) {
    return '';
  }

  return slateNode.children.map(getTextFromNode).join('');
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();

const normalizeSerializedBlock = (value: string): string => value.trim();

export const serializeDetailsSections = (
  value: Value,
  serializeMarkdown: (value: Value) => string
): string => {
  const blocks: string[] = [];
  let index = 0;

  while (index < value.length) {
    const current = value[index] as TElement;
    const currentType = String((current as { type?: unknown }).type ?? '');

    if (currentType !== KEYS.toggle) {
      const serialized = normalizeSerializedBlock(serializeMarkdown([current]));
      if (serialized.length > 0) {
        blocks.push(serialized);
      }
      index += 1;
      continue;
    }

    const summaryRaw = getTextFromNode(current).trim();
    const summary = escapeHtml(summaryRaw || 'Details');
    const bodyNodes: Value = [];
    let cursor = index + 1;

    while (cursor < value.length) {
      const node = value[cursor] as TElement;
      const indentRaw = (node as { indent?: unknown })[KEYS.indent];
      const indent = typeof indentRaw === 'number' ? indentRaw : 0;
      if (indent <= 0) break;

      bodyNodes.push({
        ...node,
        [KEYS.indent]: Math.max(0, indent - 1),
      } as TElement);
      cursor += 1;
    }

    const bodyMarkdown = normalizeSerializedBlock(serializeMarkdown(bodyNodes));
    const detailsMarkdown = bodyMarkdown.length
      ? `<details>\n<summary>${summary}</summary>\n\n${bodyMarkdown}\n</details>`
      : `<details>\n<summary>${summary}</summary>\n</details>`;

    blocks.push(detailsMarkdown);
    index = cursor;
  }

  return `${blocks.join('\n\n')}\n`;
};

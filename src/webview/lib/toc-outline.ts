import type { Heading } from '@platejs/toc';

export type TocTreeItem = Heading & {
  children: TocTreeItem[];
  fragmentId: string;
};

const slugifyHeading = (title: string) =>
  title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export const getHeadingFragmentId = (heading: Pick<Heading, 'id' | 'title'>) => {
  if (heading.id) {
    return heading.id;
  }

  return slugifyHeading(heading.title) || 'heading';
};

export const getDocumentOutlineHeadings = (headings: Heading[]) => {
  if (headings[0]?.depth === 1) {
    return headings.slice(1);
  }

  return headings;
};

export const buildTocTree = (headings: Heading[]): TocTreeItem[] => {
  const roots: TocTreeItem[] = [];
  const stack: TocTreeItem[] = [];

  for (const heading of getDocumentOutlineHeadings(headings)) {
    const item: TocTreeItem = {
      ...heading,
      children: [],
      fragmentId: getHeadingFragmentId(heading),
    };

    while (
      stack.length > 0 &&
      stack[stack.length - 1].depth >= item.depth
    ) {
      stack.pop();
    }

    const parent = stack[stack.length - 1];

    if (parent) {
      parent.children.push(item);
    } else {
      roots.push(item);
    }

    stack.push(item);
  }

  return roots;
};

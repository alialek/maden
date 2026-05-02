import type { CodeDrawingType } from '@platejs/code-drawing';
import type {
  MdCode,
  MdMdxJsxFlowElement,
  MdRules,
  MdTable,
} from '@platejs/markdown';
import type { TExcalidrawElement } from '@platejs/excalidraw';

import { VIEW_MODE } from '@platejs/code-drawing';
import {
  convertChildrenDeserialize,
  MarkdownPlugin,
  parseAttributes,
  propsToAttributes,
  remarkMdx,
  remarkMention,
} from '@platejs/markdown';
import { KEYS, type TElement, type TText } from 'platejs';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

import {
  decodeExcalidrawMdxData,
  encodeExcalidrawMdxData,
  EXCALIDRAW_MDX_DATA_ATTR,
} from '@/lib/excalidraw-markdown';

const diagramLangToDrawingType = (lang: unknown): CodeDrawingType | null => {
  if (typeof lang !== 'string') return null;

  switch (lang.trim().toLowerCase()) {
    case 'mermaid':
      return 'Mermaid';
    case 'plantuml':
      return 'PlantUml';
    case 'dot':
    case 'graphviz':
      return 'Graphviz';
    case 'flowchart':
      return 'Flowchart';
    default:
      return null;
  }
};

const drawingTypeToDiagramLang = (drawingType: unknown): string => {
  switch (drawingType) {
    case 'PlantUml':
      return 'plantuml';
    case 'Graphviz':
      return 'graphviz';
    case 'Flowchart':
      return 'flowchart';
    case 'Mermaid':
    default:
      return 'mermaid';
  }
};

const isTextNode = (node: unknown): node is TText =>
  Boolean(node) &&
  typeof node === 'object' &&
  !Array.isArray(node) &&
  typeof (node as { text?: unknown }).text === 'string';

const isElementNode = (node: unknown): node is TElement =>
  Boolean(node) &&
  typeof node === 'object' &&
  !Array.isArray(node) &&
  typeof (node as { type?: unknown }).type === 'string' &&
  Array.isArray((node as { children?: unknown }).children);

const getEditorPluginType = (options: any, key: string): string =>
  options.editor?.getType?.(key) ?? key;

const isInlineTableCellElement = (node: unknown, options: any): node is TElement => {
  if (!isElementNode(node)) {
    return false;
  }

  const inlineTypes = new Set([
    getEditorPluginType(options, KEYS.a),
    getEditorPluginType(options, KEYS.inlineEquation),
    getEditorPluginType(options, KEYS.mention),
  ]);

  return inlineTypes.has(String(node.type));
};

const groupTableCellChildren = (
  children: Array<TElement | TText>,
  paragraphType: string,
  options: any
): TElement[] => {
  const groupedChildren: TElement[] = [];
  let currentParagraphChildren: Array<TElement | TText> = [];

  const flushParagraph = () => {
    if (currentParagraphChildren.length === 0) {
      return;
    }

    groupedChildren.push({
      children: currentParagraphChildren,
      type: paragraphType,
    } as TElement);
    currentParagraphChildren = [];
  };

  for (const child of children) {
    if (isTextNode(child)) {
      const parts = child.text.split('\n');
      parts.forEach((part, index) => {
        if (part) {
          currentParagraphChildren.push({
            ...child,
            text: part,
          });
        }

        if (index < parts.length - 1) {
          flushParagraph();
        }
      });
      continue;
    }

    if (isInlineTableCellElement(child, options)) {
      currentParagraphChildren.push(child);
      continue;
    }

    flushParagraph();
    if (isElementNode(child)) {
      groupedChildren.push(child);
    }
  }

  flushParagraph();

  return groupedChildren.length > 0
    ? groupedChildren
    : [
        {
          children: [{ text: '' }],
          type: paragraphType,
        } as TElement,
      ];
};

export const codeDrawingMarkdownRules: MdRules = {
  [KEYS.codeBlock]: {
    deserialize: (mdastNode: MdCode, _deco, options) => {
      const drawingType = diagramLangToDrawingType(mdastNode.lang);

      if (drawingType) {
        return {
          children: [{ text: '' }],
          data: {
            code: mdastNode.value ?? '',
            drawingMode: VIEW_MODE.Both,
            drawingType,
          },
          type: options.editor?.getType(KEYS.codeDrawing) ?? KEYS.codeDrawing,
        };
      }

      return {
        children: (mdastNode.value || '').split('\n').map((line) => ({
          children: [{ text: line }],
          type: options.editor?.getType(KEYS.codeLine) ?? KEYS.codeLine,
        })),
        lang: mdastNode.lang ?? undefined,
        type: options.editor?.getType(KEYS.codeBlock) ?? KEYS.codeBlock,
      };
    },
  },
  [KEYS.codeDrawing]: {
    serialize: (slateNode) => ({
      lang: drawingTypeToDiagramLang(slateNode.data?.drawingType),
      type: 'code',
      value: slateNode.data?.code ?? '',
    }),
  },
  [KEYS.excalidraw]: {
    deserialize: (mdastNode: MdMdxJsxFlowElement, _deco, options) => {
      const props = parseAttributes(mdastNode.attributes);
      const data = decodeExcalidrawMdxData(props[EXCALIDRAW_MDX_DATA_ATTR]);

      return {
        children: [{ text: '' }],
        data,
        type: options.editor?.getType(KEYS.excalidraw) ?? KEYS.excalidraw,
      } satisfies TExcalidrawElement;
    },
    serialize: (slateNode: TExcalidrawElement) => ({
      attributes: propsToAttributes({
        [EXCALIDRAW_MDX_DATA_ATTR]: encodeExcalidrawMdxData(slateNode.data),
      }),
      children: [],
      name: KEYS.excalidraw,
      type: 'mdxJsxFlowElement',
    }),
  },
  [KEYS.table]: {
    deserialize: (node: MdTable, deco, options) => {
      const paragraphType = getEditorPluginType(options, KEYS.p);

      return {
        children:
          node.children?.map((row, rowIndex) => ({
            children:
              row.children?.map((cell) => {
                const cellType = rowIndex === 0 ? KEYS.th : KEYS.td;
                const cellChildren = convertChildrenDeserialize(
                  cell.children,
                  deco,
                  options
                ) as Array<TElement | TText>;

                return {
                  children: groupTableCellChildren(
                    cellChildren,
                    paragraphType,
                    options
                  ),
                  type: getEditorPluginType(options, cellType),
                };
              }) ?? [],
            type: getEditorPluginType(options, KEYS.tr),
          })) ?? [],
        type: getEditorPluginType(options, KEYS.table),
      };
    },
  },
};

export const MarkdownKit = [
  MarkdownPlugin.configure({
    options: {
      plainMarks: [KEYS.suggestion, KEYS.comment],
      remarkPlugins: [remarkMath, remarkGfm, remarkMdx, remarkMention],
      rules: codeDrawingMarkdownRules,
    },
  }),
];

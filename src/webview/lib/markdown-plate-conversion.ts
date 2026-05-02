import { deserializeMd, serializeMd } from '@platejs/markdown';
import { normalizeNodeId, type Value } from 'platejs';
import { createPlateEditor } from 'platejs/react';

import { MarkdownConversionKit } from '@/components/editor/markdown-conversion-kit';
import {
  materializeDetailsSections,
  serializeDetailsSections,
  splitMarkdownByDetails,
} from '@/lib/details-toggle';
import {
  normalizeOpenDocumentMarkdown,
  unescapeMarkdownPlaceholderAngles,
} from '@/lib/markdown-open-normalize';
import {
  countValueNodes,
  logEditorValueSanitizeStats,
  logMarkdownParseError,
  logMarkdownParseNormalized,
  logMarkdownParseStart,
  logMarkdownParseSuccess,
  logMarkdownSectionParse,
  summarizeParseErrorForHost,
} from '@/lib/markdown-parse-debug';

export const EMPTY_VALUE: Value = [
  {
    children: [{ text: '' }],
    type: 'p',
  },
];

export const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, '\n');
export const canonicalizeMarkdown = (value: string) =>
  normalizeLineEndings(value).trimEnd();
export const normalizeClipboardMarkdown = (value: string) =>
  normalizeLineEndings(value).replace(/\n{3,}/g, '\n\n').trimEnd();

export type MarkdownParseContext = {
  fileName?: string;
  filePath?: string;
};

export type MarkdownParseHostError = {
  message: string;
  stack: string;
};

export type MarkdownConversionResult = {
  normalizedMarkdown: string;
  stats: SanitizeStats;
  value: Value;
};

export type MarkdownRoundTripResult = MarkdownConversionResult & {
  serializedMarkdown: string;
};

type MarkdownPlugins = typeof MarkdownConversionKit;

type SanitizeStats = {
  repairedExamples: string[];
  repairedNodes: number;
  repairedWithoutChildren: number;
  repairedNonObject: number;
  repairedMissingType: number;
  repairedTableStructure: number;
};

type SlateLeaf = { text: string };
type SlateElement = { type: string; children: Array<SlateLeaf | SlateElement> } & Record<
  string,
  unknown
>;
type SlateNode = SlateLeaf | SlateElement;

const toTextLeaf = (value: unknown): { text: string } => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const candidate = value as { text?: unknown };
    if (typeof candidate.text === 'string') {
      return {
        ...(candidate as Record<string, unknown>),
        text: candidate.text,
      };
    }
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return { text: String(value) };
  }

  return { text: '' };
};

const emptySanitizeStats = (): SanitizeStats => ({
  repairedExamples: [],
  repairedNodes: 0,
  repairedWithoutChildren: 0,
  repairedNonObject: 0,
  repairedMissingType: 0,
  repairedTableStructure: 0,
});

const pushRepairExample = (stats: SanitizeStats | undefined, example: string) => {
  if (!stats) return;
  if (stats.repairedExamples.length >= 8) return;
  stats.repairedExamples.push(example);
};

const sanitizeSlateNode = (
  node: unknown,
  topLevel = true,
  stats?: SanitizeStats,
  path = 'root'
):
  | { text: string }
  | {
      type: string;
      children: Array<{ text: string } | { type: string; children: unknown[] }>;
    } => {
  if (node && typeof node === 'object' && !Array.isArray(node)) {
    const candidate = node as { children?: unknown; text?: unknown; type?: unknown };
    const candidateType = typeof candidate.type === 'string' ? candidate.type : undefined;
    if (Array.isArray(candidate.children)) {
      if (!candidateType && stats) {
        stats.repairedNodes += 1;
        stats.repairedMissingType += 1;
        pushRepairExample(stats, `${path}:missing-type`);
      }
      return {
        ...(candidate as Record<string, unknown>),
        type: candidateType ?? 'p',
        children:
          candidate.children.length > 0
            ? candidate.children.map((child, index) =>
                sanitizeSlateNode(child, false, stats, `${path}.children[${index}]`)
              )
            : [{ text: '' }],
      } as {
        type: string;
        children: Array<{ text: string } | { type: string; children: unknown[] }>;
      };
    }

    if (typeof candidate.text === 'string') {
      if (!topLevel) {
        return {
          ...(candidate as Record<string, unknown>),
          text: candidate.text,
        };
      }

      return {
        children: [
          {
            ...(candidate as Record<string, unknown>),
            text: candidate.text,
          },
        ],
        type: 'p',
      };
    }

    if (candidateType) {
      if (stats) {
        stats.repairedNodes += 1;
        stats.repairedWithoutChildren += 1;
        pushRepairExample(stats, `${path}:${candidateType}:missing-children`);
      }
      return {
        ...(candidate as Record<string, unknown>),
        children: [{ text: '' }],
        type: candidateType,
      };
    }
  }

  if (!topLevel) {
    if (stats) {
      stats.repairedNodes += 1;
      stats.repairedNonObject += 1;
      pushRepairExample(stats, `${path}:leaf-from-non-object`);
    }
    return toTextLeaf(node);
  }

  if (stats) {
    stats.repairedNodes += 1;
    stats.repairedNonObject += 1;
    pushRepairExample(stats, `${path}:paragraph-from-non-object`);
  }
  return {
    children: [toTextLeaf(node)],
    type: 'p',
  };
};

const isSlateLeaf = (node: unknown): node is SlateLeaf =>
  !!node &&
  typeof node === 'object' &&
  !Array.isArray(node) &&
  typeof (node as { text?: unknown }).text === 'string' &&
  !Array.isArray((node as { children?: unknown }).children);

const isSlateElement = (node: unknown): node is SlateElement =>
  !!node &&
  typeof node === 'object' &&
  !Array.isArray(node) &&
  typeof (node as { type?: unknown }).type === 'string' &&
  Array.isArray((node as { children?: unknown }).children);

const nodeText = (node: SlateNode): string => {
  if (isSlateLeaf(node)) {
    return node.text;
  }

  return node.children.map((child) => nodeText(child as SlateNode)).join('');
};

const paragraphFromText = (text = ''): SlateElement => ({
  children: [{ text }],
  type: 'p',
});

const tableCellFromText = (text = ''): SlateElement => ({
  children: [paragraphFromText(text)],
  type: 'td',
});

const tableRowFromText = (text = ''): SlateElement => ({
  children: [tableCellFromText(text)],
  type: 'tr',
});

const normalizeTableStructureNode = (
  node: SlateNode,
  stats: SanitizeStats,
  path: string
): SlateNode => {
  if (isSlateLeaf(node)) {
    return node;
  }

  let children = node.children.map((child, index) =>
    normalizeTableStructureNode(child as SlateNode, stats, `${path}.children[${index}]`)
  ) as Array<SlateLeaf | SlateElement>;

  if (node.type === 'table') {
    children = children.map((child, index) => {
      if (isSlateElement(child) && child.type === 'tr') {
        return child;
      }
      stats.repairedNodes += 1;
      stats.repairedTableStructure += 1;
      pushRepairExample(stats, `${path}.children[${index}]:table-child->tr`);
      return tableRowFromText(nodeText(child as SlateNode));
    });

    if (children.length === 0) {
      stats.repairedNodes += 1;
      stats.repairedTableStructure += 1;
      pushRepairExample(stats, `${path}:table-empty->default-row`);
      children = [tableRowFromText('')];
    }
  } else if (node.type === 'tr') {
    children = children.map((child, index) => {
      if (isSlateElement(child) && (child.type === 'td' || child.type === 'th')) {
        return child;
      }
      stats.repairedNodes += 1;
      stats.repairedTableStructure += 1;
      pushRepairExample(stats, `${path}.children[${index}]:tr-child->td`);
      return tableCellFromText(nodeText(child as SlateNode));
    });

    if (children.length === 0) {
      stats.repairedNodes += 1;
      stats.repairedTableStructure += 1;
      pushRepairExample(stats, `${path}:tr-empty->default-cell`);
      children = [tableCellFromText('')];
    }
  } else if (node.type === 'td' || node.type === 'th') {
    children = children.map((child, index) => {
      if (isSlateElement(child)) {
        return child;
      }
      stats.repairedNodes += 1;
      stats.repairedTableStructure += 1;
      pushRepairExample(stats, `${path}.children[${index}]:cell-leaf->paragraph`);
      return paragraphFromText(nodeText(child as SlateNode));
    });

    if (children.length === 0) {
      stats.repairedNodes += 1;
      stats.repairedTableStructure += 1;
      pushRepairExample(stats, `${path}:cell-empty->paragraph`);
      children = [paragraphFromText('')];
    }
  }

  return {
    ...node,
    children,
  };
};

export const sanitizeEditorValue = (
  value: Value
): { stats: SanitizeStats; value: Value } => {
  const stats = emptySanitizeStats();
  const sanitized = value.map((node, index) =>
    sanitizeSlateNode(node, true, stats, `root[${index}]`) as Value[number]
  );

  const tableSafe = sanitized.map((node, index) =>
    normalizeTableStructureNode(node as unknown as SlateNode, stats, `root[${index}]`)
  ) as Value;

  return { stats, value: tableSafe };
};

export const createMarkdownConversionEditor = (
  plugins: MarkdownPlugins = MarkdownConversionKit
) =>
  createPlateEditor({
    plugins,
    value: EMPTY_VALUE,
  });

// IMPORTANT: This function is the production Markdown -> Plate import path.
// The webview, debug CLI, and regression tests must call this exact function.
// Do not create a console-specific or extension-specific clone; keep all
// conversion behavior in this module so debug output and the editor stay in sync.
export const deserializeMarkdownToPlateValue = (
  markdown: string,
  {
    context = {},
    onHostError,
    plugins = MarkdownConversionKit,
  }: {
    context?: MarkdownParseContext;
    onHostError?: (error: MarkdownParseHostError) => void;
    plugins?: MarkdownPlugins;
  } = {}
): MarkdownConversionResult => {
  const parserEditor = createMarkdownConversionEditor(plugins);
  let normalized = markdown;
  logMarkdownParseStart({
    context,
    markdown,
    stage: 'document load',
  });

  try {
    normalized = normalizeOpenDocumentMarkdown(markdown);
    const sections = splitMarkdownByDetails(normalized);
    logMarkdownParseNormalized({
      context,
      markdown,
      normalized,
      sections,
      stage: 'document load',
    });

    let sectionIndex = 0;
    const value = materializeDetailsSections(
      sections,
      (source) => {
        const currentSectionIndex = sectionIndex;
        const section = sections[currentSectionIndex];
        sectionIndex += 1;
        logMarkdownSectionParse({
          context,
          index: currentSectionIndex,
          source,
          type: section?.type ?? 'unknown',
        });

        try {
          return deserializeMd(parserEditor, source) as Value;
        } catch (error) {
          logMarkdownParseError({
            context,
            error,
            markdown: source,
            sectionIndex: currentSectionIndex,
            stage: 'normalized section',
          });
          throw error;
        }
      }
    );
    const sanitized = sanitizeEditorValue(value);
    logEditorValueSanitizeStats({
      context,
      nodeCount: countValueNodes(sanitized.value),
      stage: 'document load',
      stats: sanitized.stats,
    });
    logMarkdownParseSuccess({
      context,
      nodeCount: countValueNodes(sanitized.value),
      stage: 'document load',
    });

    return {
      normalizedMarkdown: normalized,
      stats: sanitized.stats,
      value: normalizeNodeId(sanitized.value),
    };
  } catch (error) {
    logMarkdownParseError({
      context,
      error,
      markdown: normalized,
      stage: 'document load normalized',
    });
    onHostError?.({
      message: 'Failed to deserialize normalized markdown; retrying with raw markdown',
      stack: summarizeParseErrorForHost(error, normalized),
    });

    try {
      logMarkdownParseStart({
        context,
        markdown,
        stage: 'raw fallback',
      });
      const sanitized = sanitizeEditorValue(deserializeMd(parserEditor, markdown) as Value);
      logEditorValueSanitizeStats({
        context,
        nodeCount: countValueNodes(sanitized.value),
        stage: 'raw fallback',
        stats: sanitized.stats,
      });
      logMarkdownParseSuccess({
        context,
        nodeCount: countValueNodes(sanitized.value),
        stage: 'raw fallback',
      });
      return {
        normalizedMarkdown: markdown,
        stats: sanitized.stats,
        value: normalizeNodeId(sanitized.value),
      };
    } catch (rawError) {
      logMarkdownParseError({
        context,
        error: rawError,
        markdown,
        stage: 'raw fallback',
      });
      onHostError?.({
        message: 'Failed to deserialize raw markdown during document load',
        stack: summarizeParseErrorForHost(rawError, markdown),
      });
      return {
        normalizedMarkdown: markdown,
        stats: emptySanitizeStats(),
        value: EMPTY_VALUE,
      };
    }
  }
};

export const serializePlateValueToMarkdown = (
  editor: Parameters<typeof serializeMd>[0],
  value: Value
): string =>
  unescapeMarkdownPlaceholderAngles(
    normalizeLineEndings(
      serializeDetailsSections(value, (currentValue) =>
        serializeMd(editor as never, {
          value: currentValue,
        })
      )
    )
  );

// IMPORTANT: This is the production Plate -> Markdown debug/save entrypoint
// for conversion-only contexts. Debug scripts must call this instead of
// building a console-specific serializer or plugin list.
export const serializePlateValueWithConversionEditor = (
  value: Value,
  plugins: MarkdownPlugins = MarkdownConversionKit
): string => {
  const editor = createMarkdownConversionEditor(plugins);
  return serializePlateValueToMarkdown(editor as never, value);
};

export const roundTripMarkdownWithPlate = (
  markdown: string,
  options: Parameters<typeof deserializeMarkdownToPlateValue>[1] = {}
): MarkdownRoundTripResult => {
  const conversion = deserializeMarkdownToPlateValue(markdown, options);

  return {
    ...conversion,
    serializedMarkdown: serializePlateValueWithConversionEditor(
      conversion.value,
      options?.plugins
    ),
  };
};

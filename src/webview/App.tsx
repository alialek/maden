import * as React from 'react';

import { deserializeMd, serializeMd } from '@platejs/markdown';
import { normalizeNodeId, type Value } from 'platejs';
import { createPlateEditor, Plate, usePlateEditor } from 'platejs/react';
import { ReactEditor } from 'slate-react';

import { ENABLE_AI_FEATURES } from '../shared/feature-flags';
import { AiSettingsDialog } from '@/components/app/ai-settings-dialog';
import { EditorKit } from '@/components/editor/editor-kit';
import { AppearanceMenu, type ExportActions, type FontMode } from '@/components/app/appearance-menu';
import { Editor, EditorContainer } from '@/components/ui/editor';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAiSettings } from '@/hooks/use-ai-settings';
import { useWebviewDocumentState } from '@/hooks/use-webview-document-state';
import { useEditorDropHandlers } from '@/hooks/use-editor-drop-handlers';
import { useEditorPasteHandlers } from '@/hooks/use-editor-paste-handlers';
import {
  createDocxExport,
  createHtmlExport,
  createPdfExport,
  saveExportFile,
} from '@/lib/export';
import {
  materializeDetailsSections,
  serializeDetailsSections,
  splitMarkdownByDetails,
} from '@/lib/details-toggle';
import { normalizeOpenDocumentMarkdown } from '@/lib/markdown-open-normalize';
import { postToHost } from '@/vscode';

const EMPTY_VALUE: Value = [
  {
    children: [{ text: '' }],
    type: 'p',
  },
];

const TOPBAR_STORAGE_KEY = 'maden.ui.topbarVisible';
const FONT_MODE_STORAGE_KEY = 'maden.ui.fontMode';
const WIDE_MODE_STORAGE_KEY = 'maden.ui.wideMode';
const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, '\n');
const canonicalizeMarkdown = (value: string) => normalizeLineEndings(value).trimEnd();
const normalizeClipboardMarkdown = (value: string) =>
  normalizeLineEndings(value).replace(/\n{3,}/g, '\n\n').trimEnd();

const toTextLeaf = (value: unknown): { text: string } => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const candidate = value as { text?: unknown };
    if (typeof candidate.text === 'string') {
      return { text: candidate.text };
    }
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return { text: String(value) };
  }

  return { text: '' };
};

type SanitizeStats = {
  repairedExamples: string[];
  repairedNodes: number;
  repairedWithoutChildren: number;
  repairedNonObject: number;
  repairedMissingType: number;
  repairedTableStructure: number;
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
): { text: string } | { type: string; children: Array<{ text: string } | { type: string; children: unknown[] }> } => {
  if (node && typeof node === 'object' && !Array.isArray(node)) {
    const candidate = node as { text?: unknown; children?: unknown; type?: unknown };
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
      } as { type: string; children: Array<{ text: string } | { type: string; children: unknown[] }> };
    }

    if (typeof candidate.text === 'string') {
      if (!topLevel) {
        return { text: candidate.text };
      }

      return {
        type: 'p',
        children: [{ text: candidate.text }],
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
        type: candidateType,
        children: [{ text: '' }],
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
    type: 'p',
    children: [toTextLeaf(node)],
  };
};

type SlateLeaf = { text: string };
type SlateElement = { type: string; children: Array<SlateLeaf | SlateElement> } & Record<string, unknown>;
type SlateNode = SlateLeaf | SlateElement;

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

const normalizeTableStructureNode = (node: SlateNode, stats: SanitizeStats, path: string): SlateNode => {
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

const sanitizeEditorValue = (value: Value): { value: Value; stats: SanitizeStats } => {
  const stats = emptySanitizeStats();
  const sanitized = value.map((node, index) =>
    sanitizeSlateNode(node, true, stats, `root[${index}]`) as Value[number]
  );

  const tableSafe = sanitized.map((node, index) =>
    normalizeTableStructureNode(node as unknown as SlateNode, stats, `root[${index}]`)
  ) as Value;

  return { stats, value: tableSafe };
};

const getPlugins = (): typeof EditorKit => EditorKit;

const deserializeMarkdown = (markdown: string, plugins: typeof EditorKit) => {
  const parserEditor = createPlateEditor({
    plugins,
    value: EMPTY_VALUE,
  });

  try {
    const normalized = normalizeOpenDocumentMarkdown(markdown);
    const sections = splitMarkdownByDetails(normalized);
    const value = materializeDetailsSections(
      sections,
      (source) => deserializeMd(parserEditor, source) as Value
    );
    const sanitized = sanitizeEditorValue(value);

    return normalizeNodeId(sanitized.value);
  } catch (error) {
    postToHost({
      type: 'webviewError',
      message: 'Failed to deserialize normalized markdown; retrying with raw markdown',
      stack: error instanceof Error ? error.stack : String(error),
    });

    try {
      const sanitized = sanitizeEditorValue(deserializeMd(parserEditor, markdown) as Value);
      return normalizeNodeId(sanitized.value);
    } catch (rawError) {
      postToHost({
        type: 'webviewError',
        message: 'Failed to deserialize raw markdown during document load',
        stack: rawError instanceof Error ? rawError.stack : String(rawError),
      });
      return EMPTY_VALUE;
    }
  }
};

function MarkdownEditor({
  documentState,
  onExportActionsChange,
  wideMode,
}: {
  documentState: {
    aiEnabled: boolean;
    fileName: string;
    markdown: string;
    readOnly: boolean;
  };
  onExportActionsChange: (actions: ExportActions | null) => void;
  wideMode: boolean;
}) {
  const plugins = React.useMemo(() => getPlugins(), []);

  const editor = usePlateEditor(
    {
      plugins,
      readOnly: documentState.readOnly,
      value: EMPTY_VALUE,
    },
    [documentState.readOnly]
  );

  useEditorDropHandlers(editor);
  useEditorPasteHandlers(editor);

  const isApplyingRemoteChangeRef = React.useRef(false);
  const lastSyncedMarkdownRef = React.useRef('');

  React.useEffect(() => {
    const incomingMarkdown = normalizeLineEndings(documentState.markdown);
    const canonicalIncomingMarkdown = canonicalizeMarkdown(incomingMarkdown);
    const canonicalLastSyncedMarkdown = canonicalizeMarkdown(lastSyncedMarkdownRef.current);

    if (canonicalIncomingMarkdown === canonicalLastSyncedMarkdown) {
      return;
    }

    try {
      const currentMarkdown = normalizeLineEndings(
        serializeDetailsSections(editor.children as Value, (value) =>
          serializeMd(editor as never, {
            value,
          })
        )
      );

      if (canonicalizeMarkdown(currentMarkdown) === canonicalIncomingMarkdown) {
        lastSyncedMarkdownRef.current = incomingMarkdown;
        return;
      }
    } catch {
      // Best effort comparison only.
    }

    let isEditorFocused = false;
    try {
      const editorElement = editor.api.toDOMNode(editor) as HTMLElement;
      isEditorFocused = !!editorElement && editorElement.contains(document.activeElement);
    } catch {
      const fallbackEditor = document.querySelector('[data-slate-editor]') as HTMLElement | null;
      isEditorFocused = !!fallbackEditor && fallbackEditor.contains(document.activeElement);
    }

    // Ignore stale/echoed remote updates while the user is actively typing.
    if (isEditorFocused && lastSyncedMarkdownRef.current.length > 0) {
      return;
    }

    const nextValue = deserializeMarkdown(incomingMarkdown, plugins);

    isApplyingRemoteChangeRef.current = true;
    editor.tf.withoutSaving(() => {
      editor.tf.setValue(nextValue);
    });

    try {
      lastSyncedMarkdownRef.current = normalizeLineEndings(
        serializeDetailsSections(nextValue, (value) =>
          serializeMd(editor, {
            value,
          })
        )
      );
    } catch {
      lastSyncedMarkdownRef.current = '';
    }

    queueMicrotask(() => {
      isApplyingRemoteChangeRef.current = false;
    });
  }, [documentState.markdown, editor, plugins]);

  const onValueChange = React.useCallback(
    ({ editor, value }: { editor: { children: Value }; value: Value }) => {
      if (isApplyingRemoteChangeRef.current) {
        return;
      }

      let markdown = '';

      try {
        markdown = normalizeLineEndings(
          serializeDetailsSections(value, (currentValue) =>
            serializeMd(editor as never, {
              value: currentValue,
            })
          )
        );
      } catch {
        markdown = '';
      }

      if (markdown === lastSyncedMarkdownRef.current) {
        return;
      }

      lastSyncedMarkdownRef.current = markdown;
      postToHost({
        type: 'documentChanged',
        markdown,
      });
    },
    []
  );

  const onCopy = React.useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      const clipboard = event.clipboardData;
      if (!clipboard) return;
      if (editor.api.isCollapsed()) return;

      event.preventDefault();

      ReactEditor.setFragmentData(editor as any, clipboard, 'copy');

      const fragment = editor.api.fragment();
      if (!fragment || fragment.length === 0) {
        return;
      }

      const markdown = normalizeClipboardMarkdown(
        serializeMd(editor as never, { value: fragment as never })
      );

      if (!markdown) {
        return;
      }

      clipboard.setData('text/plain', markdown);
      clipboard.setData('text/markdown', markdown);
    },
    [editor]
  );

  const exportHtml = React.useCallback(async () => {
    await saveExportFile(await createHtmlExport(editor.children, documentState.fileName));
  }, [documentState.fileName, editor.children]);

  const exportPdf = React.useCallback(async () => {
    await saveExportFile(await createPdfExport(editor.children, documentState.fileName));
  }, [documentState.fileName, editor.children]);

  const exportDocx = React.useCallback(async () => {
    await saveExportFile(await createDocxExport(editor.children, documentState.fileName));
  }, [documentState.fileName, editor.children]);

  React.useEffect(() => {
    onExportActionsChange({ exportDocx, exportHtml, exportPdf });
    return () => onExportActionsChange(null);
  }, [exportDocx, exportHtml, exportPdf, onExportActionsChange]);

  return (
    <ErrorBoundary label="Editor">
      <Plate editor={editor} onValueChange={onValueChange} readOnly={documentState.readOnly}>
        <div className="h-full w-full bg-background text-foreground">
          <EditorContainer variant="default">
            <Editor
              autoFocus
              onCopy={onCopy}
              variant={wideMode ? 'fullWidth' : 'default'}
            />
          </EditorContainer>
        </div>
      </Plate>
    </ErrorBoundary>
  );
}

export function App() {
  const { documentState } = useWebviewDocumentState();
  const { save: saveAiSettings, settings: aiSettings } = useAiSettings();

  const [aiSettingsOpen, setAiSettingsOpen] = React.useState(false);
  const [topbarVisible, setTopbarVisible] = React.useState(true);
  const [fontMode, setFontMode] = React.useState<FontMode>('default');
  const [wideModeEnabled, setWideModeEnabled] = React.useState(false);
  const [exportActions, setExportActions] = React.useState<ExportActions | null>(null);

  React.useEffect(() => {
    const onError = (event: ErrorEvent) => {
      postToHost({
        type: 'webviewError',
        message: event.message || 'Unknown webview error',
        source: event.filename,
        stack: event.error instanceof Error ? event.error.stack : undefined,
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
      const stack = event.reason instanceof Error ? event.reason.stack : undefined;

      postToHost({
        type: 'webviewError',
        message: `Unhandled promise rejection: ${reason}`,
        stack,
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  React.useEffect(() => {
    const storedTopbar = window.localStorage.getItem(TOPBAR_STORAGE_KEY);
    const storedFont = window.localStorage.getItem(FONT_MODE_STORAGE_KEY);
    const storedWideMode = window.localStorage.getItem(WIDE_MODE_STORAGE_KEY);

    if (storedTopbar === 'hidden') {
      setTopbarVisible(false);
    }

    if (storedFont === 'serif' || storedFont === 'mono' || storedFont === 'default') {
      setFontMode(storedFont);
    }

    if (storedWideMode === 'enabled') {
      setWideModeEnabled(true);
    }
  }, []);

  if (!documentState) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading markdown editor...
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div
        className="relative h-full w-full"
        data-file-name={documentState.fileName}
        data-maden-topbar={topbarVisible ? 'visible' : 'hidden'}
        data-maden-font={fontMode}
      >
        <ErrorBoundary label="Appearance menu">
          <AppearanceMenu
            exportActions={exportActions}
            topbarVisible={topbarVisible}
            wideModeEnabled={wideModeEnabled}
            onOpenAiSettings={() => {
              if (!ENABLE_AI_FEATURES) {
                return;
              }
              setAiSettingsOpen(true);
            }}
            onTopbarToggle={(next) => {
              setTopbarVisible(next);
              window.localStorage.setItem(TOPBAR_STORAGE_KEY, next ? 'visible' : 'hidden');
            }}
            onWideModeToggle={(next) => {
              setWideModeEnabled(next);
              window.localStorage.setItem(WIDE_MODE_STORAGE_KEY, next ? 'enabled' : 'disabled');
            }}
            fontMode={fontMode}
            onFontModeChange={(next) => {
              setFontMode(next);
              window.localStorage.setItem(FONT_MODE_STORAGE_KEY, next);
            }}
          />
        </ErrorBoundary>

        <ErrorBoundary label="Markdown editor">
          <MarkdownEditor
            documentState={documentState}
            onExportActionsChange={setExportActions}
            wideMode={wideModeEnabled}
          />
        </ErrorBoundary>

        {ENABLE_AI_FEATURES && (
          <AiSettingsDialog
            open={aiSettingsOpen}
            settings={aiSettings}
            onOpenChange={setAiSettingsOpen}
            onSave={saveAiSettings}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

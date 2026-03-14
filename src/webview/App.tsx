import * as React from 'react';

import { deserializeMd, serializeMd } from '@platejs/markdown';
import { normalizeNodeId, type Value } from 'platejs';
import { createPlateEditor, Plate, usePlateEditor } from 'platejs/react';

import { ENABLE_AI_FEATURES } from '../shared/feature-flags';
import { EditorKit } from '@/components/editor/editor-kit';
import { AppearanceMenu, type ExportActions, type FontMode } from '@/components/app/appearance-menu';
import { Editor, EditorContainer } from '@/components/ui/editor';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { TooltipProvider } from '@/components/ui/tooltip';
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

const AI_PLUGIN_KEYS = new Set(['ai', 'aiChat', 'copilot']);
const TOPBAR_STORAGE_KEY = 'maden.ui.topbarVisible';
const FONT_MODE_STORAGE_KEY = 'maden.ui.fontMode';
const WIDE_MODE_STORAGE_KEY = 'maden.ui.wideMode';
const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, '\n');

const getPlugins = (aiEnabled: boolean): typeof EditorKit => {
  if (aiEnabled && ENABLE_AI_FEATURES) {
    return EditorKit;
  }

  return EditorKit.filter((plugin) => !AI_PLUGIN_KEYS.has(String((plugin as { key?: string }).key))) as typeof EditorKit;
};

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

    return normalizeNodeId(value);
  } catch (error) {
    postToHost({
      type: 'webviewError',
      message: 'Failed to deserialize normalized markdown; retrying with raw markdown',
      stack: error instanceof Error ? error.stack : String(error),
    });

    try {
      return normalizeNodeId(deserializeMd(parserEditor, markdown) as Value);
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
  const plugins = React.useMemo(() => getPlugins(documentState.aiEnabled), [documentState.aiEnabled]);

  const editor = usePlateEditor(
    {
      plugins,
      readOnly: documentState.readOnly,
      value: EMPTY_VALUE,
    },
    [documentState.aiEnabled, documentState.readOnly]
  );

  useEditorDropHandlers(editor);
  useEditorPasteHandlers(editor);

  const isApplyingRemoteChangeRef = React.useRef(false);
  const lastSyncedMarkdownRef = React.useRef('');

  React.useEffect(() => {
    const incomingMarkdown = normalizeLineEndings(documentState.markdown);

    if (incomingMarkdown === lastSyncedMarkdownRef.current) {
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
            <Editor autoFocus variant={wideMode ? 'fullWidth' : 'default'} />
          </EditorContainer>
        </div>
      </Plate>
    </ErrorBoundary>
  );
}

export function App() {
  const { documentState } = useWebviewDocumentState();

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
      </div>
    </TooltipProvider>
  );
}

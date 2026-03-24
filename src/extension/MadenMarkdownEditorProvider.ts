import * as vscode from 'vscode';
import os from 'node:os';
import path from 'node:path';

import { type HostToWebviewMessage, type WebviewToHostMessage } from '../shared/messages';
import {
  DEFAULT_DEBOUNCE_MS,
  enforceTitleHeading,
  getFileNameWithoutExtension,
} from './markdownUtils';
import { ENABLE_ADD_TO_CHAT } from '../shared/feature-flags';
import { addToCursorChat } from './services/command-bridge';
import { AiRuntimeService } from './services/ai-runtime';
import { createDocumentSession, createStateMessage } from './services/document-session';
import { getWebviewHtml } from './services/webview-html';

type MarkdownCustomDocument = vscode.CustomDocument & {
  uri: vscode.Uri;
};

export class MadenMarkdownEditorProvider
  implements vscode.CustomEditorProvider<MarkdownCustomDocument> {
  public static readonly viewType = 'maden.plateMarkdownEditor';
  private readonly outputChannel: vscode.OutputChannel;
  private readonly aiRuntime: AiRuntimeService;
  private readonly onDidChangeCustomDocumentEmitter =
    new vscode.EventEmitter<vscode.CustomDocumentContentChangeEvent<MarkdownCustomDocument>>();
  public readonly onDidChangeCustomDocument = this.onDidChangeCustomDocumentEmitter.event;

  private readonly documentText = new Map<string, string>();
  private readonly documentFilePath = new Map<string, string>();
  private readonly panelsByDocument = new Map<string, Set<vscode.WebviewPanel>>();
  private readonly runtimeByDocument = new Map<
    string,
    {
      applyingHostWrite: number;
      pendingMarkdownFromWebview?: string;
      writeTimer?: NodeJS.Timeout;
    }
  >();

  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new MadenMarkdownEditorProvider(context);

    return vscode.window.registerCustomEditorProvider(
      MadenMarkdownEditorProvider.viewType,
      provider,
      {
        supportsMultipleEditorsPerDocument: true,
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      }
    );
  }

  private constructor(private readonly context: vscode.ExtensionContext) {
    this.outputChannel = vscode.window.createOutputChannel('Maden');
    this.aiRuntime = new AiRuntimeService(context);
    context.subscriptions.push(this.outputChannel, this.aiRuntime, this.onDidChangeCustomDocumentEmitter);
  }

  private getRuntimeState(key: string) {
    const runtime = this.runtimeByDocument.get(key) ?? {
      applyingHostWrite: 0,
    };
    this.runtimeByDocument.set(key, runtime);
    return runtime;
  }

  private clearRuntimeTimer(key: string) {
    const runtime = this.runtimeByDocument.get(key);
    if (!runtime?.writeTimer) {
      return;
    }
    clearTimeout(runtime.writeTimer);
    runtime.writeTimer = undefined;
  }

  private summarizeAiRequest(body: string): string {
    try {
      const parsed = JSON.parse(body) as {
        messages?: unknown;
        model?: unknown;
        provider?: unknown;
        selectedContext?: unknown;
      };

      const messages = Array.isArray(parsed.messages) ? parsed.messages : [];
      const lastUserMessage = [...messages]
        .reverse()
        .find((message) => {
          if (!message || typeof message !== 'object') {
            return false;
          }
          const role = (message as { role?: unknown }).role;
          return role === 'user';
        }) as
        | {
          content?: unknown;
          parts?: unknown;
        }
        | undefined;

      const readText = (value: unknown): string => {
        if (typeof value === 'string') {
          return value;
        }
        if (!Array.isArray(value)) {
          return '';
        }
        return value
          .map((part) => {
            if (typeof part === 'string') {
              return part;
            }
            if (!part || typeof part !== 'object') {
              return '';
            }
            const text = (part as { text?: unknown; content?: unknown }).text;
            if (typeof text === 'string') {
              return text;
            }
            const content = (part as { text?: unknown; content?: unknown }).content;
            return typeof content === 'string' ? content : '';
          })
          .filter(Boolean)
          .join('\n');
      };

      const userPreview = readText(lastUserMessage?.content ?? lastUserMessage?.parts)
        .replace(/\s+/g, ' ')
        .slice(0, 180);

      const provider =
        typeof parsed.provider === 'string' ? parsed.provider : 'default';
      const model = typeof parsed.model === 'string' ? parsed.model : 'default';
      const selectedContextLength =
        typeof parsed.selectedContext === 'string' ? parsed.selectedContext.length : 0;

      return `provider=${provider} model=${model} messages=${messages.length} selectedContextLen=${selectedContextLength} userPreview="${userPreview}"`;
    } catch {
      return `invalid-json bodyLen=${body.length}`;
    }
  }

  private extractLatestUserContent(body: string): string {
    try {
      const parsed = JSON.parse(body) as {
        messages?: unknown;
      };
      const messages = Array.isArray(parsed.messages) ? parsed.messages : [];
      const lastUserMessage = [...messages]
        .reverse()
        .find((message) => {
          if (!message || typeof message !== 'object') {
            return false;
          }
          const role = (message as { role?: unknown }).role;
          return role === 'user';
        }) as
        | {
          content?: unknown;
          parts?: unknown;
        }
        | undefined;

      const readText = (value: unknown): string => {
        if (typeof value === 'string') {
          return value;
        }
        if (!Array.isArray(value)) {
          return '';
        }
        return value
          .map((part) => {
            if (typeof part === 'string') {
              return part;
            }
            if (!part || typeof part !== 'object') {
              return '';
            }
            const text = (part as { text?: unknown; content?: unknown }).text;
            if (typeof text === 'string') {
              return text;
            }
            const content = (part as { text?: unknown; content?: unknown }).content;
            return typeof content === 'string' ? content : '';
          })
          .filter(Boolean)
          .join('\n');
      };

      return readText(lastUserMessage?.content ?? lastUserMessage?.parts).trim();
    } catch {
      return '';
    }
  }

  private formatAiRequestBody(body: string): string {
    try {
      const parsed = JSON.parse(body);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return body;
    }
  }

  private extractTextDeltaFromSseChunk(chunk: string): string {
    const normalized = chunk.replace(/\r\n/g, '\n');
    const lines = normalized.split('\n');
    let text = '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) {
        continue;
      }

      const payload = line.slice('data: '.length).trim();
      if (!payload || payload === '[DONE]') {
        continue;
      }

      try {
        const parsed = JSON.parse(payload) as { type?: unknown; delta?: unknown };
        if (parsed.type === 'text-delta' && typeof parsed.delta === 'string') {
          text += parsed.delta;
        }
      } catch {
        // Ignore non-JSON lines.
      }
    }

    return text;
  }

  private async flushPendingMarkdownForDocument(
    documentUri: vscode.Uri,
    key: string,
    filePath: string
  ): Promise<void> {
    const runtime = this.getRuntimeState(key);
    const pending = runtime.pendingMarkdownFromWebview;
    runtime.pendingMarkdownFromWebview = undefined;
    this.clearRuntimeTimer(key);

    if (pending === undefined) {
      return;
    }

    const normalizedOutput = enforceTitleHeading(pending.replace(/\r\n/g, '\n'), filePath);
    this.documentText.set(key, normalizedOutput);
    runtime.applyingHostWrite += 1;
    try {
      await this.writeDocumentToDisk(documentUri, normalizedOutput);
    } finally {
      runtime.applyingHostWrite = Math.max(0, runtime.applyingHostWrite - 1);
    }
  }

  public async openCustomDocument(
    uri: vscode.Uri,
    openContext: vscode.CustomDocumentOpenContext,
    _token: vscode.CancellationToken
  ): Promise<MarkdownCustomDocument> {
    const source = openContext.backupId ? vscode.Uri.parse(openContext.backupId) : uri;
    const content = await this.readFileSafe(source);
    const normalized = enforceTitleHeading(content, uri.fsPath);
    const key = uri.toString();
    const session = createDocumentSession({
      filePath: uri.fsPath,
      key,
      markdown: normalized,
    });

    this.documentText.set(session.key, session.markdown);
    this.documentFilePath.set(session.key, session.filePath);

    return {
      uri,
      dispose: () => {
        const activePanels = this.panelsByDocument.get(key);
        if (activePanels && activePanels.size > 0) {
          return;
        }
        this.documentText.delete(key);
        this.documentFilePath.delete(key);
        this.clearRuntimeTimer(key);
        this.runtimeByDocument.delete(key);
      },
    };
  }

  public async resolveCustomEditor(
    document: MarkdownCustomDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    try {
      this.outputChannel.appendLine(
        `[${new Date().toISOString()}] resolveCustomEditor start: ${document.uri.toString()}`
      );

      const webviewDistPath = vscode.Uri.joinPath(this.context.extensionUri, 'dist', 'webview');
      const documentDirUri = vscode.Uri.file(path.dirname(document.uri.fsPath));
      const documentParentDirUri = vscode.Uri.file(path.dirname(documentDirUri.fsPath));
      const homeDirUri = vscode.Uri.file(os.homedir());
      const workspaceRoots =
        (vscode.workspace.workspaceFolders ?? []).map((folder) => folder.uri);
      webviewPanel.webview.options = {
        enableScripts: true,
        localResourceRoots: [
          webviewDistPath,
          documentDirUri,
          documentParentDirUri,
          homeDirUri,
          ...workspaceRoots,
        ],
      };
      webviewPanel.webview.html = getWebviewHtml({
        documentDirUri,
        webview: webviewPanel.webview,
        webviewDistPath,
      });

      const key = document.uri.toString();
      const runtime = this.getRuntimeState(key);
      const panels = this.panelsByDocument.get(key) ?? new Set<vscode.WebviewPanel>();
      panels.add(webviewPanel);
      this.panelsByDocument.set(key, panels);

      let isReady = false;
      let pendingMessage: HostToWebviewMessage | undefined;
      let pendingInitialExternalMarkdown: string | undefined;
      const aiRequestIds = new Set<string>();
      const aiResponseRawByRequestId = new Map<string, string>();
      const aiResponseTextByRequestId = new Map<string, string>();
      const startupDiffCheckTimers: NodeJS.Timeout[] = [];
      let currentAiEnabled = (await this.aiRuntime.loadSettingsPublic()).enabled;

      const clearTimer = () => {
        this.clearRuntimeTimer(key);
      };

      const getAiEnabled = (): boolean => currentAiEnabled;
      const getWorkspacePaths = (): string[] =>
        (vscode.workspace.workspaceFolders ?? []).map((folder) => folder.uri.fsPath);

      const getDebounceMs = (): number => {
        const value = vscode.workspace
          .getConfiguration('maden', document.uri)
          .get<number>('liveWriteDebounceMs', DEFAULT_DEBOUNCE_MS);

        if (!Number.isFinite(value)) {
          return DEFAULT_DEBOUNCE_MS;
        }

        return Math.max(50, Math.floor(value));
      };

      const isReadOnly = (): boolean => {
        const writable = vscode.workspace.fs.isWritableFileSystem(document.uri.scheme);
        return writable === false;
      };

      const currentFilePath = () => this.documentFilePath.get(key) ?? document.uri.fsPath;

      const buildStateMessage = (
        type: Extract<HostToWebviewMessage['type'], 'initDocument' | 'externalDocumentUpdated'>,
        filePathOverride?: string
      ): HostToWebviewMessage => {
        const filePath = filePathOverride ?? currentFilePath();
        const markdown =
          this.documentText.get(key) ?? enforceTitleHeading('', filePathOverride ?? document.uri.fsPath);

        return createStateMessage({
          type,
          markdown,
          fileName: getFileNameWithoutExtension(filePath),
          filePath,
          workspacePaths: getWorkspacePaths(),
          readOnly: isReadOnly(),
          aiEnabled: getAiEnabled(),
        });
      };

      const postOrQueue = (message: HostToWebviewMessage) => {
        if (!isReady) {
          pendingMessage = message;
          return;
        }

        void webviewPanel.webview.postMessage(message);
      };

      const broadcastToOtherPanels = (message: HostToWebviewMessage) => {
        const allPanels = this.panelsByDocument.get(key);
        if (!allPanels) {
          return;
        }

        for (const panel of allPanels) {
          if (panel === webviewPanel) {
            continue;
          }
          void panel.webview.postMessage(message);
        }
      };

      const flushPendingWrite = async () => {
        const next = runtime.pendingMarkdownFromWebview;
        runtime.pendingMarkdownFromWebview = undefined;

        if (next === undefined || isReadOnly()) {
          return;
        }

        const normalizedInput = next.replace(/\r\n/g, '\n');
        const normalizedOutput = enforceTitleHeading(normalizedInput, currentFilePath());
        this.documentText.set(key, normalizedOutput);
        runtime.applyingHostWrite += 1;
        try {
          await this.writeDocumentToDisk(document.uri, normalizedOutput);
        } finally {
          runtime.applyingHostWrite = Math.max(0, runtime.applyingHostWrite - 1);
        }

        if (normalizedInput !== normalizedOutput) {
          postOrQueue(buildStateMessage('externalDocumentUpdated'));
        }

        broadcastToOtherPanels(buildStateMessage('externalDocumentUpdated'));
      };

      const scheduleWrite = () => {
        clearTimer();
        runtime.writeTimer = setTimeout(() => {
          void flushPendingWrite();
        }, getDebounceMs());
      };

      const log = (message: string) => {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] ${message}`);
      };

      const fileWatcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(
          path.dirname(document.uri.fsPath),
          path.basename(document.uri.fsPath)
        )
      );

      const reloadFromDisk = async () => {
        const content = await this.readFileSafe(document.uri);
        const normalized = enforceTitleHeading(content, currentFilePath());
        if (normalized === this.documentText.get(key)) {
          return;
        }

        this.documentText.set(key, normalized);
        postOrQueue(buildStateMessage('externalDocumentUpdated'));
      };

      const subscriptions: vscode.Disposable[] = [];
      let linkedTextDocument: vscode.TextDocument | undefined;
      const syncFromLinkedText = (reason: string) => {
        if (!linkedTextDocument) {
          return;
        }

        const normalized = enforceTitleHeading(linkedTextDocument.getText(), currentFilePath());
        const previous = this.documentText.get(key);
        if (normalized === previous) {
          return;
        }

        this.documentText.set(key, normalized);
        log(`Detected external diff (${reason}). len=${normalized.length}`);
        postOrQueue(buildStateMessage('externalDocumentUpdated'));
        broadcastToOtherPanels(buildStateMessage('externalDocumentUpdated'));
      };

      try {
        linkedTextDocument = await vscode.workspace.openTextDocument(document.uri);
        const linkedNormalized = enforceTitleHeading(linkedTextDocument.getText(), currentFilePath());
        const current = this.documentText.get(key) ?? '';
        if (linkedNormalized !== current) {
          pendingInitialExternalMarkdown = linkedNormalized;
          log(
            `Detected pre-existing external diff at open. baselineLen=${current.length}; liveLen=${linkedNormalized.length}`
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log(`Failed to open linked text document for sync: ${message}`);
      }

      subscriptions.push(
        webviewPanel.webview.onDidReceiveMessage(async (message: WebviewToHostMessage) => {
          if (message.type === 'ready') {
            isReady = true;
            if (pendingMessage) {
              void webviewPanel.webview.postMessage(pendingMessage);
              pendingMessage = undefined;
            } else {
              postOrQueue(buildStateMessage('initDocument'));
            }

            if (pendingInitialExternalMarkdown !== undefined) {
              this.documentText.set(key, pendingInitialExternalMarkdown);
              postOrQueue(buildStateMessage('externalDocumentUpdated'));
              broadcastToOtherPanels(buildStateMessage('externalDocumentUpdated'));
              pendingInitialExternalMarkdown = undefined;
            }

            // Cursor can attach inline diff state asynchronously; poll linked text shortly after open.
            const delayedChecks = [120, 450, 1000];
            for (const delayMs of delayedChecks) {
              const timer = setTimeout(() => {
                syncFromLinkedText(`open+${delayMs}ms`);
              }, delayMs);
              startupDiffCheckTimers.push(timer);
            }
            return;
          }

          if (message.type === 'documentChanged') {
            const normalized = enforceTitleHeading(
              message.markdown.replace(/\r\n/g, '\n'),
              currentFilePath()
            );
            runtime.pendingMarkdownFromWebview = normalized;
            this.documentText.set(key, normalized);
            scheduleWrite();
            return;
          }

          if (message.type === 'addSelectedBlocksToChat') {
            if (!ENABLE_ADD_TO_CHAT) {
              return;
            }
            await addToCursorChat(
              { documentUri: document.uri, log },
              message.taskDescription
            );
            return;
          }

          if (message.type === 'saveExportFile') {
            const defaultUri = vscode.Uri.file(
              path.join(path.dirname(currentFilePath()), message.suggestedFileName)
            );

            const target = await vscode.window.showSaveDialog({
              defaultUri,
              saveLabel: 'Export',
            });

            if (!target) return;

            const bytes = Buffer.from(message.base64, 'base64');
            await vscode.workspace.fs.writeFile(target, bytes);
            void vscode.window.showInformationMessage(`Exported to ${target.fsPath}`);
            return;
          }

          if (message.type === 'aiSettingsLoad') {
            const settings = await this.aiRuntime.loadSettingsPublic();
            void webviewPanel.webview.postMessage({
              type: 'aiSettingsState',
              settings,
            });
            return;
          }

          if (message.type === 'aiSettingsSave') {
            const settings = await this.aiRuntime.saveSettings(message.settings);
            currentAiEnabled = settings.enabled;
            void webviewPanel.webview.postMessage({
              type: 'aiSettingsState',
              settings,
            });
            this.postAiEnabledToAllPanels(settings.enabled);
            return;
          }

          if (message.type === 'aiRequestCancel') {
            log(`AI request cancelled: id=${message.requestId}`);
            this.aiRuntime.cancelRequest(message.requestId);
            aiRequestIds.delete(message.requestId);
            return;
          }

          if (message.type === 'aiRequestStart') {
            log(
              `AI request start: id=${message.requestId} route=${message.route} ${this.summarizeAiRequest(message.body)}`
            );
            log(
              `AI request payload (full): id=${message.requestId}\n${this.formatAiRequestBody(
                message.body
              )}`
            );
            const latestUserContent = this.extractLatestUserContent(message.body);
            if (latestUserContent) {
              log(
                `AI request user content (normalized): id=${message.requestId}\n${latestUserContent}`
              );
            }
            aiResponseRawByRequestId.set(message.requestId, '');
            aiResponseTextByRequestId.set(message.requestId, '');
            aiRequestIds.add(message.requestId);
            void this.aiRuntime.streamRequest(message, {
              onChunk: (chunk) => {
                aiResponseRawByRequestId.set(
                  message.requestId,
                  `${aiResponseRawByRequestId.get(message.requestId) ?? ''}${chunk}`
                );
                aiResponseTextByRequestId.set(
                  message.requestId,
                  `${
                    aiResponseTextByRequestId.get(message.requestId) ?? ''
                  }${this.extractTextDeltaFromSseChunk(chunk)}`
                );
                void webviewPanel.webview.postMessage({
                  type: 'aiStreamChunk',
                  requestId: message.requestId,
                  chunk,
                });
              },
              onEnd: () => {
                aiRequestIds.delete(message.requestId);
                const fullText = aiResponseTextByRequestId.get(message.requestId) ?? '';
                const fullRaw = aiResponseRawByRequestId.get(message.requestId) ?? '';
                log(
                  `AI response (full): id=${message.requestId}\n${
                    fullText.trim().length > 0 ? fullText : fullRaw
                  }`
                );
                aiResponseRawByRequestId.delete(message.requestId);
                aiResponseTextByRequestId.delete(message.requestId);
                log(`AI request end: id=${message.requestId} status=ok`);
                void webviewPanel.webview.postMessage({
                  type: 'aiStreamEnd',
                  requestId: message.requestId,
                });
              },
              onError: (errorMessage) => {
                aiRequestIds.delete(message.requestId);
                const partialText = aiResponseTextByRequestId.get(message.requestId) ?? '';
                if (partialText.trim().length > 0) {
                  log(`AI response (partial): id=${message.requestId}\n${partialText}`);
                }
                aiResponseRawByRequestId.delete(message.requestId);
                aiResponseTextByRequestId.delete(message.requestId);
                log(
                  `AI request end: id=${message.requestId} status=error message=${errorMessage.replace(/\s+/g, ' ').slice(0, 300)}`
                );
                void webviewPanel.webview.postMessage({
                  type: 'aiStreamError',
                  requestId: message.requestId,
                  message: errorMessage,
                });
              },
            });
            return;
          }

          if (message.type === 'webviewError') {
            const details = [message.message, message.source, message.stack]
              .filter(Boolean)
              .join('\n');
            log(`Webview error reported:\n${details}`);
          }
        })
      );

      subscriptions.push(
        vscode.workspace.onDidRenameFiles((event) => {
          const rename = event.files.find(
            (item) =>
              item.oldUri.toString() === document.uri.toString() ||
              item.newUri.toString() === document.uri.toString()
          );

          if (!rename) {
            return;
          }

          this.documentFilePath.set(key, rename.newUri.fsPath);
          const current = this.documentText.get(key) ?? '';
          const retitled = enforceTitleHeading(current, rename.newUri.fsPath);
          this.documentText.set(key, retitled);
          postOrQueue(buildStateMessage('externalDocumentUpdated', rename.newUri.fsPath));
        })
      );

      subscriptions.push(
        vscode.workspace.onDidChangeTextDocument((event) => {
          if (!linkedTextDocument) {
            return;
          }

          if (event.document.uri.toString() !== linkedTextDocument.uri.toString()) {
            return;
          }

          if (runtime.applyingHostWrite > 0) {
            return;
          }

          const normalized = enforceTitleHeading(event.document.getText(), currentFilePath());
          const previous = this.documentText.get(key);
          if (previous === normalized) {
            return;
          }

          this.documentText.set(key, normalized);
          log(`External text document update detected. len=${normalized.length}`);
          postOrQueue(buildStateMessage('externalDocumentUpdated'));
          broadcastToOtherPanels(buildStateMessage('externalDocumentUpdated'));
        })
      );

      subscriptions.push(
        vscode.workspace.onDidChangeConfiguration((event) => {
          if (!event.affectsConfiguration('maden', document.uri)) {
            return;
          }

          postOrQueue(buildStateMessage('externalDocumentUpdated'));
        })
      );

      subscriptions.push(
        fileWatcher.onDidChange(() => {
          void reloadFromDisk();
        })
      );
      subscriptions.push(
        fileWatcher.onDidCreate(() => {
          void reloadFromDisk();
        })
      );
      subscriptions.push(fileWatcher);

      subscriptions.push(
        webviewPanel.onDidDispose(() => {
          clearTimer();
          for (const requestId of aiRequestIds) {
            this.aiRuntime.cancelRequest(requestId);
          }
          aiRequestIds.clear();
          startupDiffCheckTimers.forEach((timer) => clearTimeout(timer));
          subscriptions.forEach((disposable) => disposable.dispose());

          const docPanels = this.panelsByDocument.get(key);
          if (docPanels) {
            docPanels.delete(webviewPanel);
            if (docPanels.size === 0) {
              this.panelsByDocument.delete(key);
              this.runtimeByDocument.delete(key);
            }
          }
        })
      );

      postOrQueue(buildStateMessage('initDocument'));
    } catch (error) {
      const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
      this.outputChannel.appendLine(
        `[${new Date().toISOString()}] resolveCustomEditor failed for ${document.uri.toString()}: ${message}`
      );

      webviewPanel.webview.html = `<!DOCTYPE html>
<html lang="en">
  <body style="font-family: sans-serif; padding: 16px;">
    <h3>Failed to load Maden editor</h3>
    <p>Open <code>Output -> Maden</code> for details.</p>
  </body>
</html>`;
    }
  }

  public async saveCustomDocument(
    document: MarkdownCustomDocument,
    _cancellation: vscode.CancellationToken
  ): Promise<void> {
    const key = document.uri.toString();
    const filePath = this.documentFilePath.get(key) ?? document.uri.fsPath;
    await this.flushPendingMarkdownForDocument(document.uri, key, filePath);
    const runtime = this.getRuntimeState(key);
    const text = this.documentText.get(key) ?? enforceTitleHeading('', document.uri.fsPath);
    runtime.applyingHostWrite += 1;
    try {
      await this.writeDocumentToDisk(document.uri, text);
    } finally {
      runtime.applyingHostWrite = Math.max(0, runtime.applyingHostWrite - 1);
    }
  }

  public async saveCustomDocumentAs(
    document: MarkdownCustomDocument,
    destination: vscode.Uri,
    _cancellation: vscode.CancellationToken
  ): Promise<void> {
    const key = document.uri.toString();
    const sourceFilePath = this.documentFilePath.get(key) ?? document.uri.fsPath;
    await this.flushPendingMarkdownForDocument(document.uri, key, sourceFilePath);
    const text = this.documentText.get(key) ?? enforceTitleHeading('', destination.fsPath);
    await this.writeDocumentToDisk(destination, enforceTitleHeading(text, destination.fsPath));
  }

  public async revertCustomDocument(
    document: MarkdownCustomDocument,
    _cancellation: vscode.CancellationToken
  ): Promise<void> {
    const key = document.uri.toString();
    const content = await this.readFileSafe(document.uri);
    const normalized = enforceTitleHeading(content, this.documentFilePath.get(key) ?? document.uri.fsPath);
    this.documentText.set(key, normalized);
    this.postToDocumentPanels(key, {
      type: 'externalDocumentUpdated',
      markdown: normalized,
      fileName: getFileNameWithoutExtension(this.documentFilePath.get(key) ?? document.uri.fsPath),
      filePath: this.documentFilePath.get(key) ?? document.uri.fsPath,
      workspacePaths: (vscode.workspace.workspaceFolders ?? []).map((folder) => folder.uri.fsPath),
      readOnly: vscode.workspace.fs.isWritableFileSystem(document.uri.scheme) === false,
      aiEnabled: (await this.aiRuntime.loadSettingsPublic()).enabled,
    });
  }

  public async backupCustomDocument(
    document: MarkdownCustomDocument,
    context: vscode.CustomDocumentBackupContext,
    _cancellation: vscode.CancellationToken
  ): Promise<vscode.CustomDocumentBackup> {
    const key = document.uri.toString();
    const text = this.documentText.get(key) ?? enforceTitleHeading('', document.uri.fsPath);
    await vscode.workspace.fs.writeFile(context.destination, Buffer.from(text, 'utf8'));

    return {
      id: context.destination.toString(),
      delete: async () => {
        try {
          await vscode.workspace.fs.delete(context.destination, { useTrash: false });
        } catch {
          // Best effort cleanup.
        }
      },
    };
  }

  private postToDocumentPanels(key: string, message: HostToWebviewMessage) {
    const panels = this.panelsByDocument.get(key);
    if (!panels) {
      return;
    }

    for (const panel of panels) {
      void panel.webview.postMessage(message);
    }
  }

  private postAiEnabledToAllPanels(aiEnabled: boolean) {
    for (const panels of this.panelsByDocument.values()) {
      for (const panel of panels) {
        void panel.webview.postMessage({
          type: 'setAiEnabled',
          aiEnabled,
        });
      }
    }
  }

  private async readFileSafe(uri: vscode.Uri): Promise<string> {
    try {
      const bytes = await vscode.workspace.fs.readFile(uri);
      return Buffer.from(bytes).toString('utf8').replace(/\r\n/g, '\n');
    } catch {
      return '';
    }
  }

  private async writeDocumentToDisk(uri: vscode.Uri, text: string): Promise<void> {
    const current = await this.readFileSafe(uri);
    const normalizedCurrent = current.replace(/\r\n/g, '\n');
    const normalizedNext = text.replace(/\r\n/g, '\n');
    if (normalizedCurrent === normalizedNext) {
      return;
    }

    await vscode.workspace.fs.writeFile(uri, Buffer.from(text, 'utf8'));
  }

}

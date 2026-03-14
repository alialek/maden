import * as vscode from 'vscode';

import { MadenMarkdownEditorProvider } from './MadenMarkdownEditorProvider';

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(MadenMarkdownEditorProvider.register(context));
}

export function deactivate(): void {
  // no-op
}

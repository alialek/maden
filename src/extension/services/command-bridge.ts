import * as vscode from 'vscode';

export type CommandBridgeContext = {
  documentUri: vscode.Uri;
  log: (message: string) => void;
};

export const addToCursorChat = async (
  ctx: CommandBridgeContext,
  taskDescription: string
) => {
  const trimmed = taskDescription.trim();
  if (!trimmed) {
    ctx.log('AddToChat skipped: empty taskDescription');
    return;
  }

  const allCommands = await vscode.commands.getCommands(true);
  const symbolSelectionCommands = [
    'composer.addsymbolstonewcomposer',
    'composer.addsymbolstocomposer',
  ];
  const openChatCommandCandidates = [
    'aichat.newchataction',
    'workbench.action.chat.open',
    'aichat.show-ai-chat',
  ];
  const pasteCommand = 'editor.action.clipboardPasteAction';

  ctx.log(
    `AddToChat started. len=${trimmed.length}; symbolCommandsRegistered=${symbolSelectionCommands
      .filter((c) => allCommands.includes(c))
      .join(',') || 'none'}; openCommandsRegistered=${openChatCommandCandidates
      .filter((c) => allCommands.includes(c))
      .join(',') || 'none'}`
  );

  let originalClipboard = '';
  let usedClipboardFallback = false;

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  try {
    const lines = trimmed.split('\n');
    const endLineNumber = Math.max(1, lines.length);
    const endColumn = (lines[lines.length - 1]?.length ?? 0) + 1;
    const selectionRange = {
      selectionStartLineNumber: 1,
      selectionStartColumn: 1,
      positionLineNumber: endLineNumber,
      positionColumn: endColumn,
    };
    const codeSelectionPayload = {
      codeSelections: [
        {
          rawText: trimmed,
          text: `\`\`\`markdown\n${trimmed}\n\`\`\``,
          uri: ctx.documentUri,
          range: selectionRange,
        },
      ],
    };

    if (ctx.documentUri.scheme === 'file') {
      for (const symbolSelectionCommand of symbolSelectionCommands) {
        ctx.log(`Trying symbol selection command: ${symbolSelectionCommand}`);

        try {
          await vscode.commands.executeCommand(symbolSelectionCommand, codeSelectionPayload, 'chat');
          ctx.log(`Symbol selection command succeeded: ${symbolSelectionCommand}`);

          const focusCommands = ['composer.focusComposer', 'workbench.action.chat.open'];
          for (const focusCommand of focusCommands) {
            if (!allCommands.includes(focusCommand)) {
              continue;
            }

            try {
              await vscode.commands.executeCommand(focusCommand);
              ctx.log(`Composer focus command succeeded: ${focusCommand}`);
              break;
            } catch (focusError) {
              const focusMessage = focusError instanceof Error ? focusError.message : String(focusError);
              ctx.log(`Composer focus command failed: ${focusCommand}; error=${focusMessage}`);
            }
          }

          return;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          ctx.log(`Symbol selection command failed: ${symbolSelectionCommand}; error=${message}`);
        }
      }
    }

    const openChatCommand =
      openChatCommandCandidates.find((command) => allCommands.includes(command)) ??
      openChatCommandCandidates[0];
    usedClipboardFallback = true;
    ctx.log(`Falling back to clipboard flow with command: ${openChatCommand}`);

    originalClipboard = await vscode.env.clipboard.readText();
    await vscode.commands.executeCommand(openChatCommand);
    await delay(400);
    await vscode.env.clipboard.writeText(trimmed);
    await vscode.commands.executeCommand(pasteCommand);
    ctx.log('Clipboard fallback completed');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ctx.log(`AddToChat failed: ${message}`);
    void vscode.window.showErrorMessage(`Failed to add selection to AI chat: ${message}`);
  } finally {
    try {
      if (usedClipboardFallback) {
        await vscode.env.clipboard.writeText(originalClipboard);
        ctx.log('Clipboard restored');
      }
    } catch (restoreError) {
      const message = restoreError instanceof Error ? restoreError.message : String(restoreError);
      ctx.log(`Clipboard restore failed: ${message}`);
    }
  }
};

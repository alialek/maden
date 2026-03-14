import * as vscode from 'vscode';

export const generateNonce = (): string => {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let value = '';

  for (let i = 0; i < 32; i += 1) {
    value += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return value;
};

const buildContentSecurityPolicy = (webview: vscode.Webview, nonce: string) => {
  const source = webview.cspSource;

  return [
    "default-src 'none'",
    `img-src ${source} https: http: data: blob: vscode-resource: vscode-webview-resource:`,
    `media-src ${source} https: http: data: blob: vscode-resource: vscode-webview-resource:`,
    `font-src ${source} https: http: data:`,
    `style-src ${source} 'unsafe-inline'`,
    `script-src 'nonce-${nonce}'`,
    `connect-src ${source} https: http: ws: wss: data: blob:`,
    'frame-src https: http: data: blob:',
    'worker-src blob: data:',
  ].join('; ');
};

export const getWebviewHtml = ({
  documentDirUri,
  webview,
  webviewDistPath,
}: {
  documentDirUri: vscode.Uri;
  webview: vscode.Webview;
  webviewDistPath: vscode.Uri;
}) => {
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(webviewDistPath, 'main.js'));
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(webviewDistPath, 'main.css'));
  const baseUri = `${webview.asWebviewUri(documentDirUri).toString().replace(/\/$/, '')}/`;
  const nonce = generateNonce();
  const csp = buildContentSecurityPolicy(webview, nonce);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="${csp}" />
    <base href="${baseUri}" />
    <link href="${styleUri}" rel="stylesheet" />
    <title>Maden Markdown Editor</title>
  </head>
  <body>
    <div id="root"></div>
    <script nonce="${nonce}">
      (() => {
        const shouldIntercept = (event) => {
          const types = event.dataTransfer?.types;
          if (!types) return false;
          return (
            types.includes('Files') ||
            types.includes('text/uri-list') ||
            types.includes('text/plain')
          );
        };

        const prevent = (event) => {
          if (!shouldIntercept(event)) return;
          event.preventDefault();
          if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'copy';
          }
        };

        window.addEventListener('dragenter', prevent, true);
        window.addEventListener('dragover', prevent, true);
        window.addEventListener('drop', prevent, true);
        document.addEventListener('dragenter', prevent, true);
        document.addEventListener('dragover', prevent, true);
        document.addEventListener('drop', prevent, true);
      })();
    </script>
    <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
  </body>
</html>`;
};

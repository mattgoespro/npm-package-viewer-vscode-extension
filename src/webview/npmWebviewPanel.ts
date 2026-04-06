import * as vscode from "vscode";

let currentPanel: vscode.WebviewPanel | undefined;

/**
 * Create or reveal a webview panel showing an npm package page.
 * If a panel already exists, its content is updated to the new URL.
 */
export function createOrShowNpmWebview(
  packageName: string,
  npmUrl: string,
): void {
  const column = vscode.ViewColumn.Beside;

  if (currentPanel) {
    currentPanel.title = `npm: ${packageName}`;
    currentPanel.webview.html = getWebviewContent(packageName, npmUrl);
    currentPanel.reveal(column);
    return;
  }

  currentPanel = vscode.window.createWebviewPanel(
    "npmPackageViewer",
    `npm: ${packageName}`,
    column,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    },
  );

  currentPanel.webview.html = getWebviewContent(packageName, npmUrl);

  currentPanel.onDidDispose(() => {
    currentPanel = undefined;
  });
}

function getWebviewContent(packageName: string, npmUrl: string): string {
  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>npm: ${escapeHtml(packageName)}</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: var(--vscode-editor-background, #1e1e1e);
    }
    .container {
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: var(--vscode-titleBar-activeBackground, #3c3c3c);
      color: var(--vscode-titleBar-activeForeground, #ccc);
      font-family: var(--vscode-font-family, sans-serif);
      font-size: 12px;
      flex-shrink: 0;
    }
    .toolbar a {
      color: var(--vscode-textLink-foreground, #3794ff);
      text-decoration: none;
    }
    .toolbar a:hover {
      text-decoration: underline;
    }
    iframe {
      flex: 1;
      border: none;
      width: 100%;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="toolbar">
      <span>📦 ${escapeHtml(packageName)}</span>
      <span>—</span>
      <a href="${escapeHtml(npmUrl)}" title="Open in browser">Open in external browser ↗</a>
    </div>
    <iframe
      src="${escapeHtml(npmUrl)}"
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
    ></iframe>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Dispose the current webview panel if it exists.
 */
export function disposeWebview(): void {
  currentPanel?.dispose();
}

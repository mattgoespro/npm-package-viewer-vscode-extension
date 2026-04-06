import * as vscode from "vscode";

let currentPanel: vscode.WebviewPanel | undefined;

/**
 * Create or reveal a webview panel showing the npm package page in an iframe.
 */
export async function createOrShowNpmWebview(
  packageName: string,
  npmUrl: string,
): Promise<void> {
  const column = vscode.ViewColumn.Beside;

  if (currentPanel) {
    currentPanel.title = `npm: ${packageName}`;
    currentPanel.webview.html = getIframeHtml(packageName, npmUrl);
    currentPanel.reveal(column);
  } else {
    currentPanel = vscode.window.createWebviewPanel(
      "npmPackageViewer",
      `npm: ${packageName}`,
      column,
      { enableScripts: true, retainContextWhenHidden: true },
    );
    currentPanel.webview.html = getIframeHtml(packageName, npmUrl);
    currentPanel.onDidDispose(() => { currentPanel = undefined; });
  }
}

function getIframeHtml(packageName: string, npmUrl: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  body { margin: 0; padding: 0; overflow: hidden; }
  iframe { width: 100%; height: 100vh; border: none; }
</style>
</head>
<body>
  <iframe src="${esc(npmUrl)}" sandbox="allow-scripts allow-same-origin allow-popups allow-forms"></iframe>
</body></html>`;
}

function esc(str: string): string {
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

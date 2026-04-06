import * as vscode from "vscode";
import * as https from "node:https";

let currentPanel: vscode.WebviewPanel | undefined;

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const get = (targetUrl: string, redirects = 0) => {
      if (redirects > 5) {
        reject(new Error("Too many redirects"));
        return;
      }
      https
        .get(targetUrl, { headers: { "User-Agent": "VSCode-NPM-Package-Viewer" } }, (res) => {
          if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
            get(res.headers.location, redirects + 1);
            return;
          }
          let data = "";
          res.on("data", (chunk: Buffer) => { data += chunk.toString(); });
          res.on("end", () => {
            if (res.statusCode !== 200) {
              reject(new Error(`HTTP ${res.statusCode}`));
              return;
            }
            resolve(data);
          });
        })
        .on("error", reject);
    };
    get(url);
  });
}

/**
 * Fetch the npm page HTML and prepare it for webview rendering.
 * Injects a <base> tag so relative URLs resolve correctly and
 * sets a permissive CSP so styles/scripts/images load from npm's CDN.
 */
async function fetchNpmPageHtml(npmUrl: string): Promise<string> {
  const html = await fetchUrl(npmUrl);

  const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'self' https:; script-src https: 'unsafe-inline' 'unsafe-eval'; style-src https: 'unsafe-inline'; img-src https: data:; font-src https: data:;">`;
  const base = `<base href="https://www.npmjs.com/">`;

  // Inject base + CSP right after <head>
  return html.replace(/<head([^>]*)>/i, `<head$1>${base}${csp}`);
}

/**
 * Create or reveal a webview panel showing the npm package page.
 */
export async function createOrShowNpmWebview(
  packageName: string,
  npmUrl: string,
): Promise<void> {
  const column = vscode.ViewColumn.Beside;

  if (currentPanel) {
    currentPanel.title = `npm: ${packageName}`;
    currentPanel.webview.html = getLoadingHtml(packageName);
    currentPanel.reveal(column);
  } else {
    currentPanel = vscode.window.createWebviewPanel(
      "npmPackageViewer",
      `npm: ${packageName}`,
      column,
      { enableScripts: true, retainContextWhenHidden: true },
    );
    currentPanel.webview.html = getLoadingHtml(packageName);
    currentPanel.onDidDispose(() => {
      currentPanel = undefined;
    });
  }

  try {
    const html = await fetchNpmPageHtml(npmUrl);
    if (currentPanel) {
      currentPanel.webview.html = html;
    }
  } catch {
    if (currentPanel) {
      currentPanel.webview.html = getErrorHtml(packageName, npmUrl);
    }
  }
}

function getLoadingHtml(packageName: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;
  font-family:var(--vscode-font-family,sans-serif);color:var(--vscode-foreground,#ccc);
  background:var(--vscode-editor-background,#1e1e1e);">
  <p>Loading <strong>${esc(packageName)}</strong>…</p>
</body></html>`;
}

function getErrorHtml(packageName: string, npmUrl: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;margin:0;
  font-family:var(--vscode-font-family,sans-serif);color:var(--vscode-foreground,#ccc);
  background:var(--vscode-editor-background,#1e1e1e);">
  <p>Could not load <strong>${esc(packageName)}</strong>.</p>
  <p><a href="${esc(npmUrl)}" style="color:var(--vscode-textLink-foreground,#3794ff);">Open on npmjs.com ↗</a></p>
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

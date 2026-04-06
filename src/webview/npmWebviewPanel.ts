import * as vscode from "vscode";
import * as https from "node:https";

let currentPanel: vscode.WebviewPanel | undefined;

interface RegistryData {
  name: string;
  version: string;
  description?: string;
  license?: string;
  homepage?: string;
  repository?: { url?: string };
  readme?: string;
  keywords?: string[];
}

function fetchJson(url: string): Promise<RegistryData> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { Accept: "application/json", "User-Agent": "VSCode-NPM-Package-Viewer" } }, (res) => {
        let data = "";
        res.on("data", (chunk: Buffer) => { data += chunk.toString(); });
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          try { resolve(JSON.parse(data)); }
          catch { reject(new Error("Invalid JSON")); }
        });
      })
      .on("error", reject);
  });
}

async function fetchPackageData(packageName: string): Promise<RegistryData> {
  const encoded = encodeURIComponent(packageName).replace("%40", "@");
  const url = `https://registry.npmjs.org/${encoded}/latest`;
  return fetchJson(url);
}

/**
 * Create or reveal a webview panel showing npm package info.
 * Uses the npm registry API (JSON) since npmjs.com blocks
 * embedding via X-Frame-Options and CORS on static assets.
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
      { enableScripts: false, retainContextWhenHidden: true },
    );
    currentPanel.webview.html = getLoadingHtml(packageName);
    currentPanel.onDidDispose(() => { currentPanel = undefined; });
  }

  try {
    const data = await fetchPackageData(packageName);
    if (currentPanel) {
      currentPanel.webview.html = renderPackageHtml(data, npmUrl);
    }
  } catch {
    if (currentPanel) {
      currentPanel.webview.html = getErrorHtml(packageName, npmUrl);
    }
  }
}

function renderPackageHtml(data: RegistryData, npmUrl: string): string {
  const repoUrl = data.repository?.url
    ?.replace(/^git\+/, "")
    .replace(/\.git$/, "")
    .replace(/^ssh:\/\/git@github\.com/, "https://github.com");

  const meta = [
    `<strong style="font-size:1.6em;">${esc(data.name)}</strong>`,
    `<span style="opacity:0.7;margin-left:8px;">v${esc(data.version)}</span>`,
  ].join("");

  const links = [
    `<a href="${esc(npmUrl)}">npm</a>`,
    data.homepage ? `<a href="${esc(data.homepage)}">homepage</a>` : "",
    repoUrl ? `<a href="${esc(repoUrl)}">repository</a>` : "",
  ].filter(Boolean).join(" · ");

  const badges = [
    data.license ? `<span class="badge">${esc(data.license)}</span>` : "",
    ...(data.keywords ?? []).slice(0, 8).map(k => `<span class="badge">${esc(k)}</span>`),
  ].filter(Boolean).join(" ");

  // The readme from the registry is already HTML (rendered from markdown
  // by npm's servers). Passing it through without escaping is intentional.
  const readme = data.readme ?? "";

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  body {
    font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif);
    color: var(--vscode-foreground, #ccc);
    background: var(--vscode-editor-background, #1e1e1e);
    line-height: 1.6; padding: 24px; max-width: 960px; margin: 0 auto;
  }
  a { color: var(--vscode-textLink-foreground, #3794ff); }
  .badge {
    display: inline-block; padding: 2px 8px; margin: 2px;
    border-radius: 4px; font-size: 0.8em;
    background: var(--vscode-badge-background, #333);
    color: var(--vscode-badge-foreground, #fff);
  }
  .header { border-bottom: 1px solid var(--vscode-widget-border, #444); padding-bottom: 16px; margin-bottom: 24px; }
  .desc { margin: 8px 0; opacity: 0.85; }
  .links { margin: 8px 0; }
  .badges { margin: 8px 0; }
  .readme img { max-width: 100%; }
  .readme pre {
    background: var(--vscode-textCodeBlock-background, #2d2d2d);
    padding: 12px; border-radius: 4px; overflow-x: auto;
  }
  .readme code {
    background: var(--vscode-textCodeBlock-background, #2d2d2d);
    padding: 2px 4px; border-radius: 3px; font-size: 0.9em;
  }
  .readme pre code { background: none; padding: 0; }
  .readme table { border-collapse: collapse; }
  .readme td, .readme th { border: 1px solid var(--vscode-widget-border, #444); padding: 6px 12px; }
  .readme blockquote { border-left: 3px solid var(--vscode-widget-border, #444); margin-left: 0; padding-left: 16px; opacity: 0.8; }
  .readme h1, .readme h2 { border-bottom: 1px solid var(--vscode-widget-border, #444); padding-bottom: 6px; }
</style>
</head>
<body>
  <div class="header">
    <div>${meta}</div>
    ${data.description ? `<p class="desc">${esc(data.description)}</p>` : ""}
    <div class="links">${links}</div>
    ${badges ? `<div class="badges">${badges}</div>` : ""}
  </div>
  <div class="readme">${readme}</div>
</body></html>`;
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

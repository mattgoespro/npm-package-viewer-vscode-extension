import * as vscode from "vscode";
import * as https from "node:https";

let currentPanel: vscode.WebviewPanel | undefined;

interface NpmPackageData {
  name: string;
  description?: string;
  "dist-tags"?: { latest?: string };
  license?: string;
  homepage?: string;
  repository?: { url?: string };
  readme?: string;
  time?: Record<string, string>;
  versions?: Record<string, { dependencies?: Record<string, string> }>;
}

function fetchPackageData(packageName: string): Promise<NpmPackageData> {
  const url = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { Accept: "application/json" } }, (res) => {
        let data = "";
        res.on("data", (chunk: Buffer) => {
          data += chunk.toString();
        });
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}`));
            return;
          }
          try {
            resolve(JSON.parse(data) as NpmPackageData);
          } catch {
            reject(new Error("Invalid JSON from registry"));
          }
        });
      })
      .on("error", reject);
  });
}

/**
 * Create or reveal a webview panel showing npm package info.
 */
export async function createOrShowNpmWebview(
  packageName: string,
  npmUrl: string,
): Promise<void> {
  const column = vscode.ViewColumn.Beside;

  if (currentPanel) {
    currentPanel.title = `npm: ${packageName}`;
    currentPanel.webview.html = getLoadingContent(packageName);
    currentPanel.reveal(column);
  } else {
    currentPanel = vscode.window.createWebviewPanel(
      "npmPackageViewer",
      `npm: ${packageName}`,
      column,
      { enableScripts: true, retainContextWhenHidden: true },
    );
    currentPanel.webview.html = getLoadingContent(packageName);
    currentPanel.onDidDispose(() => {
      currentPanel = undefined;
    });
  }

  try {
    const data = await fetchPackageData(packageName);
    if (currentPanel) {
      currentPanel.webview.html = getPackageContent(data, npmUrl);
    }
  } catch {
    if (currentPanel) {
      currentPanel.webview.html = getErrorContent(packageName, npmUrl);
    }
  }
}

function getLoadingContent(packageName: string): string {
  return baseHtml(
    packageName,
    `<div class="center"><p>Loading package info for <strong>${esc(packageName)}</strong>…</p></div>`,
  );
}

function getErrorContent(packageName: string, npmUrl: string): string {
  return baseHtml(
    packageName,
    `<div class="center">
      <p>Could not load package info for <strong>${esc(packageName)}</strong>.</p>
      <p><a href="${esc(npmUrl)}">Open on npmjs.com ↗</a></p>
    </div>`,
  );
}

function getPackageContent(data: NpmPackageData, npmUrl: string): string {
  const latest = data["dist-tags"]?.latest ?? "—";
  const license = data.license ?? "—";
  const description = data.description ?? "";
  const homepage = data.homepage;
  const repoUrl = data.repository?.url
    ?.replace(/^git\+/, "")
    .replace(/\.git$/, "");
  const modified = data.time?.[latest]
    ? new Date(data.time[latest]).toLocaleDateString()
    : null;

  // Get dependency count for latest version
  const latestDeps = data.versions?.[latest]?.dependencies;
  const depCount = latestDeps ? Object.keys(latestDeps).length : 0;

  // Render a simplified readme (just use <pre> for the raw text)
  const readme = data.readme ?? "";
  const readmeHtml = readme
    ? `<div class="readme">
        <h2>README</h2>
        <div class="readme-content">${renderReadme(readme)}</div>
      </div>`
    : "";

  const body = `
    <div class="header">
      <h1>📦 ${esc(data.name)}</h1>
      ${description ? `<p class="description">${esc(description)}</p>` : ""}
    </div>
    <div class="meta">
      <div class="meta-item"><span class="label">Version</span><span class="value">${esc(latest)}</span></div>
      <div class="meta-item"><span class="label">License</span><span class="value">${esc(license)}</span></div>
      ${modified ? `<div class="meta-item"><span class="label">Published</span><span class="value">${esc(modified)}</span></div>` : ""}
      <div class="meta-item"><span class="label">Dependencies</span><span class="value">${depCount}</span></div>
    </div>
    <div class="links">
      <a href="${esc(npmUrl)}">npmjs.com ↗</a>
      ${homepage ? `<a href="${esc(homepage)}">Homepage ↗</a>` : ""}
      ${repoUrl ? `<a href="${esc(repoUrl)}">Repository ↗</a>` : ""}
    </div>
    ${readmeHtml}
  `;

  return baseHtml(data.name, body);
}

/** Sanitize readme content for webview display.
 *  npm readmes are a mix of HTML and markdown — pass HTML through
 *  and apply minimal markdown conversion for plain-text sections. */
function renderReadme(md: string): string {
  let html = md;
  // Convert markdown headers (only lines that aren't already HTML)
  html = html.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>");
  html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");
  // Code blocks
  html = html.replace(/```[\w]*\n([\s\S]*?)```/g, "<pre><code>$1</code></pre>");
  // Inline code
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Italic (avoid matching inside HTML attributes or URLs)
  html = html.replace(/(?<![=/"'])\*([^*<>]+?)\*(?![/"'])/g, "<em>$1</em>");
  // Markdown links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2">$1</a>',
  );
  // Double newlines → paragraph breaks (only outside of HTML blocks)
  html = html.replace(/\n\n(?!<)/g, "<br><br>");
  return html;
}

function baseHtml(packageName: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>npm: ${esc(packageName)}</title>
  <style>
    body {
      margin: 0;
      padding: 16px 24px;
      font-family: var(--vscode-font-family, -apple-system, BlinkMacSystemFont, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      color: var(--vscode-foreground, #ccc);
      background: var(--vscode-editor-background, #1e1e1e);
      line-height: 1.6;
    }
    .center { text-align: center; padding: 48px 0; }
    h1 { margin: 0 0 4px; font-size: 1.6em; }
    h2 { margin: 24px 0 8px; font-size: 1.2em; border-bottom: 1px solid var(--vscode-panel-border, #444); padding-bottom: 4px; }
    .description { margin: 0 0 16px; opacity: 0.85; font-size: 1.05em; }
    .meta {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
      padding: 12px 16px;
      background: var(--vscode-textBlockQuote-background, #2a2a2a);
      border-radius: 6px;
      margin-bottom: 12px;
    }
    .meta-item { display: flex; flex-direction: column; }
    .label { font-size: 0.8em; text-transform: uppercase; opacity: 0.6; letter-spacing: 0.05em; }
    .value { font-size: 1.1em; font-weight: 600; }
    .links { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    a { color: var(--vscode-textLink-foreground, #3794ff); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .readme-content { max-width: 800px; }
    .readme-content pre {
      background: var(--vscode-textCodeBlock-background, #1a1a1a);
      padding: 12px;
      border-radius: 4px;
      overflow-x: auto;
    }
    .readme-content code {
      background: var(--vscode-textCodeBlock-background, #1a1a1a);
      padding: 1px 4px;
      border-radius: 3px;
      font-family: var(--vscode-editor-font-family, monospace);
      font-size: 0.95em;
    }
    .readme-content pre code { background: none; padding: 0; }
    .readme-content img { max-width: 100%; }
  </style>
</head>
<body>${body}</body>
</html>`;
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

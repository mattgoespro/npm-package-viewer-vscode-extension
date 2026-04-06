import * as vscode from "vscode";

/**
 * Open the npm package page inside VS Code using the built-in Simple Browser.
 * Simple Browser uses a privileged webview that bypasses X-Frame-Options
 * restrictions that block regular iframe embedding.
 */
export async function createOrShowNpmWebview(
  _packageName: string,
  npmUrl: string,
): Promise<void> {
  await vscode.commands.executeCommand(
    "simpleBrowser.api.open",
    vscode.Uri.parse(npmUrl),
    { viewColumn: vscode.ViewColumn.Beside },
  );
}

/**
 * Dispose the current webview panel if it exists.
 * No-op when using Simple Browser (it manages its own lifecycle).
 */
export function disposeWebview(): void {}

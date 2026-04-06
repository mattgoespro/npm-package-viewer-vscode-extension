import * as vscode from "vscode";
import { openInBrowser } from "./commands/openInBrowser.js";
import { openInWebview } from "./commands/openInWebview.js";
import { disposeWebview } from "./webview/npmWebviewPanel.js";

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "npmPackageViewer.openInBrowser",
      openInBrowser,
    ),
    vscode.commands.registerCommand(
      "npmPackageViewer.openInWebview",
      openInWebview,
    ),
  );
}

export function deactivate(): void {
  disposeWebview();
}

import * as vscode from "vscode";
import { extractPackageFromDocument } from "../parsers/moduleExtractor.js";
import { classifyModule } from "../classifiers/moduleClassifier.js";
import { getConfig } from "../utils/config.js";

let statusBarItem: vscode.StatusBarItem | undefined;

export function createStatusBarProvider(
  context: vscode.ExtensionContext
): void {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  context.subscriptions.push(statusBarItem);

  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection(onSelectionChange)
  );

  // Trigger initial update
  if (vscode.window.activeTextEditor) {
    onSelectionChange({
      textEditor: vscode.window.activeTextEditor,
      selections: vscode.window.activeTextEditor.selections,
      kind: undefined,
    });
  }
}

function onSelectionChange(event: vscode.TextEditorSelectionChangeEvent): void {
  if (!statusBarItem) {
    return;
  }

  if (!getConfig().showStatusBarItem) {
    statusBarItem.hide();
    return;
  }

  const editor = event.textEditor;
  const doc = editor.document;
  const lineNumber = editor.selection.active.line;
  const lines = Array.from(
    { length: doc.lineCount },
    (_, i) => doc.lineAt(i).text
  );
  const result = extractPackageFromDocument(lines, lineNumber);

  if (!result) {
    statusBarItem.hide();
    return;
  }

  const classification = classifyModule(
    result.rawSpecifier,
    result.packageName,
    editor.document.uri
  );

  if (classification.type === "npm") {
    const { defaultAction } = getConfig();
    const command =
      defaultAction === "webview"
        ? "npmPackageViewer.openInWebview"
        : "npmPackageViewer.openInBrowser";

    statusBarItem.text = `$(package) ${classification.packageName}`;
    statusBarItem.tooltip = `Open ${classification.packageName} (${defaultAction})`;
    statusBarItem.command = command;
    statusBarItem.show();
  } else if (classification.type === "node-builtin") {
    statusBarItem.text = `$(package) ${classification.packageName} (built-in)`;
    statusBarItem.tooltip = "Node.js built-in module";
    statusBarItem.command = undefined;
    statusBarItem.show();
  } else {
    statusBarItem.hide();
  }
}

export function disposeStatusBar(): void {
  statusBarItem?.dispose();
  statusBarItem = undefined;
}

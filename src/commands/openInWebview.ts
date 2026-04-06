import * as vscode from "vscode";
import { extractPackageFromDocument } from "../parsers/moduleExtractor.js";
import { classifyModule } from "../classifiers/moduleClassifier.js";
import { getNpmUrl } from "../utils/npmUrl.js";
import { createOrShowNpmWebview } from "../webview/npmWebviewPanel.js";

export async function openInWebview(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage("No active editor.");
    return;
  }

  const doc = editor.document;
  const lineNumber = editor.selection.active.line;
  const lines = Array.from(
    { length: doc.lineCount },
    (_, i) => doc.lineAt(i).text
  );
  const result = extractPackageFromDocument(lines, lineNumber);

  if (!result) {
    vscode.window.showInformationMessage(
      "No module import detected on this line."
    );
    return;
  }

  const classification = classifyModule(
    result.rawSpecifier,
    result.packageName,
    editor.document.uri
  );

  if (classification.type !== "npm") {
    vscode.window.showInformationMessage(classification.message!);
    return;
  }

  const url = getNpmUrl(classification.packageName);
  await createOrShowNpmWebview(classification.packageName, url);
}

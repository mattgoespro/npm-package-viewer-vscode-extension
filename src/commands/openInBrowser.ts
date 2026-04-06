import * as vscode from "vscode";
import { extractPackageFromLine } from "../parsers/moduleExtractor.js";
import { classifyModule } from "../classifiers/moduleClassifier.js";
import { getNpmUrl } from "../utils/npmUrl.js";

export function openInBrowser(): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage("No active editor.");
    return;
  }

  const line = editor.document.lineAt(editor.selection.active.line).text;
  const result = extractPackageFromLine(line);

  if (!result) {
    vscode.window.showInformationMessage(
      "No module import detected on this line.",
    );
    return;
  }

  const classification = classifyModule(
    result.rawSpecifier,
    result.packageName,
    editor.document.uri,
  );

  if (classification.type !== "npm") {
    vscode.window.showInformationMessage(classification.message!);
    return;
  }

  const url = getNpmUrl(classification.packageName);
  vscode.env.openExternal(vscode.Uri.parse(url));
}

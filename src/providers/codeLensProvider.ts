import * as vscode from "vscode";
import {
  extractPackageFromDocument,
  isImportStatementStart,
} from "../parsers/moduleExtractor.js";
import { classifyModule } from "../classifiers/moduleClassifier.js";
import { getConfig } from "../utils/config.js";

export class NpmCodeLensProvider implements vscode.CodeLensProvider {
  provideCodeLenses(
    document: vscode.TextDocument,
    _token: vscode.CancellationToken,
  ): vscode.CodeLens[] {
    if (!getConfig().showCodeLens) {
      return [];
    }

    const lenses: vscode.CodeLens[] = [];
    const lines = Array.from({ length: document.lineCount }, (_, i) => document.lineAt(i).text);

    for (let i = 0; i < document.lineCount; i++) {
      // Only place CodeLens on the first line of an import statement
      if (!isImportStatementStart(lines[i])) {
        continue;
      }

      const result = extractPackageFromDocument(lines, i);

      if (!result) {
        continue;
      }

      const classification = classifyModule(
        result.rawSpecifier,
        result.packageName,
        document.uri,
      );

      const range = document.lineAt(i).range;

      if (classification.type === "npm") {
        lenses.push(
          new vscode.CodeLens(range, {
            title: "Open on npm ↗",
            command: "npmPackageViewer.openInBrowser",
            tooltip: `Open ${classification.packageName} on npm`,
          }),
          new vscode.CodeLens(range, {
            title: "View in VS Code",
            command: "npmPackageViewer.openInWebview",
            tooltip: `View ${classification.packageName} in VS Code`,
          }),
        );
      } else if (classification.type === "node-builtin") {
        lenses.push(
          new vscode.CodeLens(range, {
            title: "Node.js built-in",
            command: "",
            tooltip: `${classification.packageName} is a Node.js built-in module`,
          }),
        );
      }
      // Relative imports and TS aliases: no CodeLens
    }

    return lenses;
  }
}

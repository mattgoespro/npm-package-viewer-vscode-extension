import * as vscode from "vscode";
import { extractPackageFromLine } from "../parsers/moduleExtractor.js";
import { classifyModule } from "../classifiers/moduleClassifier.js";
import { getNpmUrl } from "../utils/npmUrl.js";
import { getConfig } from "../utils/config.js";

export class NpmHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
  ): vscode.Hover | null {
    if (!getConfig().showHover) {
      return null;
    }

    const line = document.lineAt(position.line).text;
    const result = extractPackageFromLine(line);

    if (!result) {
      return null;
    }

    const classification = classifyModule(
      result.rawSpecifier,
      result.packageName,
      document.uri,
    );

    const md = new vscode.MarkdownString();
    md.isTrusted = true;

    if (classification.type === "npm") {
      const url = getNpmUrl(classification.packageName);
      md.appendMarkdown(`**📦 ${classification.packageName}**\n\n`);
      md.appendMarkdown(
        `[Open in Browser](${url}) · ` +
          `[Open in VS Code](command:npmPackageViewer.openInWebview "View in VS Code")`,
      );
    } else if (classification.type === "node-builtin") {
      md.appendMarkdown(`**Node.js built-in:** \`${classification.packageName}\``);
    } else if (classification.type === "relative") {
      md.appendMarkdown(`**Relative import:** \`${result.rawSpecifier}\``);
    } else if (classification.type === "ts-alias") {
      md.appendMarkdown(`**TypeScript path alias:** \`${result.rawSpecifier}\``);
    }

    return new vscode.Hover(md, document.lineAt(position.line).range);
  }
}

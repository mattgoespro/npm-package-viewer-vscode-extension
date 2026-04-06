import * as vscode from "vscode";
import * as path from "node:path";
import * as fs from "node:fs";
import { extractPackageFromDocument } from "../parsers/moduleExtractor.js";
import { classifyModule } from "../classifiers/moduleClassifier.js";

/**
 * Walk up directories from `startDir` to find the nearest package.json.
 */
function findPackageJson(startDir: string): string | null {
  let current = startDir;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = path.join(current, "package.json");
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}

const DEP_SECTIONS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
  "optionalDependencies",
] as const;

export async function goToPackageJson(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage("No active editor.");
    return;
  }

  const doc = editor.document;
  const lineNumber = editor.selection.active.line;
  const docLines = Array.from(
    { length: doc.lineCount },
    (_, i) => doc.lineAt(i).text,
  );
  const result = extractPackageFromDocument(docLines, lineNumber);

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
    vscode.window.showInformationMessage(
      classification.message ?? "This module is not an npm package.",
    );
    return;
  }

  const fileDir = path.dirname(editor.document.uri.fsPath);
  const packageJsonPath = findPackageJson(fileDir);

  if (!packageJsonPath) {
    vscode.window.showInformationMessage("No package.json found.");
    return;
  }

  const content = fs.readFileSync(packageJsonPath, "utf-8");
  const lines = content.split(/\r?\n/);
  const pkgName = classification.packageName;

  // Search for the package name in dependency sections
  let targetLine = -1;
  let inDepSection = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Detect start of a dependency section
    for (const section of DEP_SECTIONS) {
      if (trimmed.startsWith(`"${section}"`)) {
        inDepSection = true;
        break;
      }
    }

    // Detect end of a section (closing brace)
    if (inDepSection && (trimmed === "}," || trimmed === "}")) {
      inDepSection = false;
    }

    // Look for the package name as a JSON key
    if (inDepSection && trimmed.startsWith(`"${pkgName}"`)) {
      targetLine = i;
      break;
    }
  }

  if (targetLine === -1) {
    vscode.window.showInformationMessage(
      `'${pkgName}' was not found in ${path.basename(packageJsonPath)}.`,
    );
    return;
  }

  const document = await vscode.workspace.openTextDocument(packageJsonPath);
  const editorView = await vscode.window.showTextDocument(document);
  const position = new vscode.Position(targetLine, 0);
  editorView.selection = new vscode.Selection(position, position);
  editorView.revealRange(
    new vscode.Range(position, position),
    vscode.TextEditorRevealType.InCenter,
  );
}

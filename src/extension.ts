import * as vscode from "vscode";
import { openInBrowser } from "./commands/openInBrowser.js";
import { openInWebview } from "./commands/openInWebview.js";
import { goToPackageJson } from "./commands/goToPackageJson.js";
import { disposeWebview } from "./webview/npmWebviewPanel.js";
import { NpmHoverProvider } from "./providers/hoverProvider.js";
import { NpmCodeLensProvider } from "./providers/codeLensProvider.js";
import {
  createStatusBarProvider,
  disposeStatusBar,
} from "./providers/statusBarProvider.js";
import { getConfig } from "./utils/config.js";

const LANGUAGE_SELECTOR: vscode.DocumentSelector = [
  { language: "javascript" },
  { language: "typescript" },
  { language: "javascriptreact" },
  { language: "typescriptreact" },
];

let hoverDisposable: vscode.Disposable | undefined;
let codeLensDisposable: vscode.Disposable | undefined;
const codeLensProvider = new NpmCodeLensProvider();
const codeLensEmitter = new vscode.EventEmitter<void>();

function registerHoverProvider(): void {
  hoverDisposable?.dispose();
  if (getConfig().showHover) {
    hoverDisposable = vscode.languages.registerHoverProvider(
      LANGUAGE_SELECTOR,
      new NpmHoverProvider(),
    );
  }
}

function registerCodeLensProvider(): void {
  codeLensDisposable?.dispose();
  if (getConfig().showCodeLens) {
    codeLensDisposable = vscode.languages.registerCodeLensProvider(
      LANGUAGE_SELECTOR,
      codeLensProvider,
    );
  }
}

export function activate(context: vscode.ExtensionContext): void {
  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "npmPackageViewer.openInBrowser",
      openInBrowser,
    ),
    vscode.commands.registerCommand(
      "npmPackageViewer.openInWebview",
      openInWebview,
    ),
    vscode.commands.registerCommand(
      "npmPackageViewer.goToPackageJson",
      goToPackageJson,
    ),
  );

  // Providers
  registerHoverProvider();
  registerCodeLensProvider();
  createStatusBarProvider(context);

  // React to configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("npmPackageViewer")) {
        registerHoverProvider();
        registerCodeLensProvider();
        codeLensEmitter.fire();
      }
    }),
  );
}

export function deactivate(): void {
  disposeWebview();
  disposeStatusBar();
  hoverDisposable?.dispose();
  codeLensDisposable?.dispose();
  codeLensEmitter.dispose();
}

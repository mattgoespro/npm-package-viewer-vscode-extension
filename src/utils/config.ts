import * as vscode from "vscode";

export interface ExtensionConfig {
  defaultAction: string;
  registryUrl: string;
  showCodeLens: boolean;
  showHover: boolean;
  showStatusBarItem: boolean;
}

export function getConfig(): ExtensionConfig {
  const config = vscode.workspace.getConfiguration("npmPackageViewer");
  return {
    defaultAction: config.get<string>("defaultAction", "browser"),
    registryUrl: config.get<string>("registryUrl", "https://www.npmjs.com"),
    showCodeLens: config.get<boolean>("showCodeLens", true),
    showHover: config.get<boolean>("showHover", true),
    showStatusBarItem: config.get<boolean>("showStatusBarItem", true),
  };
}

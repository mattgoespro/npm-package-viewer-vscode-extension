import * as vscode from "vscode";
import { nodeBuiltins } from "./nodeBuiltins.js";
import { isPathAlias } from "./tsAliasResolver.js";

export type ModuleType = "npm" | "node-builtin" | "relative" | "ts-alias";

export interface ModuleClassification {
  type: ModuleType;
  packageName: string;
  message?: string;
}

/**
 * Classify a module specifier into its type.
 */
export function classifyModule(
  rawSpecifier: string,
  packageName: string,
  documentUri: vscode.Uri
): ModuleClassification {
  // 1. Relative imports
  if (rawSpecifier.startsWith(".") || rawSpecifier.startsWith("/")) {
    return {
      type: "relative",
      packageName,
      message: `'${rawSpecifier}' is a relative import and has no npm page.`,
    };
  }

  // 2. Node.js built-in modules
  if (rawSpecifier.startsWith("node:")) {
    const bareName = rawSpecifier.slice(5);
    return {
      type: "node-builtin",
      packageName: bareName,
      message: `'${rawSpecifier}' is a native Node.js module and has no npm page.`,
    };
  }
  if (nodeBuiltins.has(packageName)) {
    return {
      type: "node-builtin",
      packageName,
      message: `'${packageName}' is a native Node.js module and has no npm page.`,
    };
  }

  // 3. TypeScript path aliases
  if (isPathAlias(rawSpecifier, documentUri)) {
    return {
      type: "ts-alias",
      packageName,
      message: `'${rawSpecifier}' is a TypeScript path alias and has no npm page.`,
    };
  }

  // 4. npm package
  return {
    type: "npm",
    packageName,
  };
}

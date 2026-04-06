import * as vscode from "vscode";
import * as path from "node:path";
import * as fs from "node:fs";

interface TsConfigPaths {
  [alias: string]: string[];
}

interface TsConfigCache {
  aliasPrefixes: string[];
  mtimeMs: number;
}

const cache = new Map<string, TsConfigCache>();

/**
 * Walk up from `dir` to find the nearest tsconfig.json.
 */
function findTsConfig(dir: string): string | null {
  let current = dir;

  while (true) {
    const candidate = path.join(current, "tsconfig.json");
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

/**
 * Minimal JSON parser that strips single-line and block comments
 * so that tsconfig.json files with comments can be parsed.
 */
function parseJsonWithComments(text: string): unknown {
  // Remove single-line comments
  let stripped = text.replace(/\/\/.*$/gm, "");
  // Remove block comments
  stripped = stripped.replace(/\/\*[\s\S]*?\*\//g, "");
  // Remove trailing commas before } or ]
  stripped = stripped.replace(/,\s*([}\]])/g, "$1");
  return JSON.parse(stripped);
}

/**
 * Read the `compilerOptions.paths` from a tsconfig, following `extends` chains.
 */
function readPathsFromTsConfig(tsConfigPath: string): TsConfigPaths {
  let paths: TsConfigPaths = {};

  try {
    const content = fs.readFileSync(tsConfigPath, "utf-8");
    const config = parseJsonWithComments(content) as {
      extends?: string;
      compilerOptions?: { paths?: TsConfigPaths };
    };

    // Follow extends chain first (base paths get overridden by current)
    if (config.extends) {
      const basePath = path.resolve(path.dirname(tsConfigPath), config.extends);
      // Try with and without .json extension
      const resolvedBase = fs.existsSync(basePath)
        ? basePath
        : fs.existsSync(basePath + ".json")
          ? basePath + ".json"
          : null;
      if (resolvedBase) {
        paths = { ...readPathsFromTsConfig(resolvedBase) };
      }
    }

    if (config.compilerOptions?.paths) {
      paths = { ...paths, ...config.compilerOptions.paths };
    }
  } catch {
    // If we can't read/parse the file, return whatever we have
  }

  return paths;
}

/**
 * Extract alias prefixes from tsconfig paths.
 * e.g., `@app/*` → `@app/`, `@utils` → `@utils`
 */
function extractAliasPrefixes(paths: TsConfigPaths): string[] {
  return Object.keys(paths).map((key) => key.replace(/\/?\*$/, ""));
}

/**
 * Get the alias prefixes for a given document, with caching.
 */
function getAliasPrefixes(documentUri: vscode.Uri): string[] {
  const dir = path.dirname(documentUri.fsPath);
  const tsConfigPath = findTsConfig(dir);

  if (!tsConfigPath) {
    return [];
  }

  // Check cache freshness
  const cached = cache.get(tsConfigPath);
  try {
    const stat = fs.statSync(tsConfigPath);
    if (cached && cached.mtimeMs === stat.mtimeMs) {
      return cached.aliasPrefixes;
    }
  } catch {
    return cached?.aliasPrefixes ?? [];
  }

  // Parse and cache
  const paths = readPathsFromTsConfig(tsConfigPath);
  const prefixes = extractAliasPrefixes(paths);
  try {
    const stat = fs.statSync(tsConfigPath);
    cache.set(tsConfigPath, { aliasPrefixes: prefixes, mtimeMs: stat.mtimeMs });
  } catch {
    cache.set(tsConfigPath, { aliasPrefixes: prefixes, mtimeMs: 0 });
  }

  return prefixes;
}

/**
 * Check if a module specifier matches a TypeScript path alias
 * configured in the nearest tsconfig.json.
 */
export function isPathAlias(
  moduleSpecifier: string,
  documentUri: vscode.Uri
): boolean {
  const prefixes = getAliasPrefixes(documentUri);
  return prefixes.some(
    (prefix) =>
      moduleSpecifier === prefix || moduleSpecifier.startsWith(prefix + "/")
  );
}

/**
 * Clear the tsconfig cache (useful for testing).
 */
export function clearTsConfigCache(): void {
  cache.clear();
}

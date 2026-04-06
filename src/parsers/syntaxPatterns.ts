/**
 * Regex patterns for matching various module import/export syntaxes.
 * Each pattern captures the module specifier in group named "module".
 */

// ESM static: import ... from "module" / import "module" (side-effect)
const esmStaticImport =
  /import\s+(?:type\s+)?(?:(?:[\w*{}\s,]+)\s+from\s+)?['"](?<module>[^'"]+)['"]/;

// ESM dynamic: import("module")
const esmDynamicImport = /import\s*\(\s*['"](?<module>[^'"]+)['"]\s*\)/;

// CommonJS: require("module")
const commonjsRequire = /require\s*\(\s*['"](?<module>[^'"]+)['"]\s*\)/;

// Re-exports: export ... from "module" / export * from "module"
const esmReExport =
  /export\s+(?:[\w*{}\s,]+\s+)?from\s+['"](?<module>[^'"]+)['"]/;

export const syntaxPatterns: ReadonlyArray<RegExp> = [
  esmStaticImport,
  esmDynamicImport,
  commonjsRequire,
  esmReExport,
];

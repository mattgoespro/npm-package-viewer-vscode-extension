import { syntaxPatterns } from "./syntaxPatterns.js";

export interface PackageInfo {
  rawSpecifier: string;
  packageName: string;
}

/**
 * Extract the top-level npm package name from a module specifier.
 * - Scoped: `@scope/package/deep` → `@scope/package`
 * - Unscoped: `lodash/fp` → `lodash`
 */
function extractPackageName(specifier: string): string {
  if (specifier.startsWith("@")) {
    const parts = specifier.split("/");
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : specifier;
  }
  return specifier.split("/")[0];
}

/**
 * Given a line of text, attempt to extract the module specifier.
 * Returns the raw specifier string or `null` if no import/require is found.
 */
export function extractModuleSpecifier(line: string): string | null {
  const trimmed = line.trimStart();

  // Skip single-line comment lines
  if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) {
    return null;
  }

  for (const pattern of syntaxPatterns) {
    const match = pattern.exec(line);
    if (match?.groups?.["module"]) {
      return match.groups["module"];
    }
  }
  return null;
}

/**
 * Given a single line of text, extract the package info.
 * Returns `null` if no import/require is found on this line alone.
 */
export function extractPackageFromLine(line: string): PackageInfo | null {
  const specifier = extractModuleSpecifier(line);
  if (!specifier) {
    return null;
  }
  return {
    rawSpecifier: specifier,
    packageName: extractPackageName(specifier),
  };
}

// ── Multi-line import support ────────────────────────────────────

const IMPORT_START_RE =
  /^\s*(?:import\b|export\b|(?:const|let|var)\s+)/;

/**
 * Check if a line begins an import/require/export statement.
 */
function isImportStart(line: string): boolean {
  return IMPORT_START_RE.test(line);
}

/**
 * Given document lines and a line number, extract the package info.
 * Handles both single-line and multi-line import/require/export statements.
 */
export function extractPackageFromDocument(
  lines: readonly string[],
  lineNumber: number,
): PackageInfo | null {
  // Fast path: single-line extraction
  const singleLine = extractPackageFromLine(lines[lineNumber]);
  if (singleLine) {
    return singleLine;
  }

  // Multi-line: search backward for the start of the statement
  const resolved = resolveMultiLineImport(lines, lineNumber);
  if (resolved) {
    return extractPackageFromLine(resolved);
  }

  return null;
}

/**
 * Search backward from `lineNumber` to find the start of a multi-line
 * import/require/export, then join lines forward until the module
 * specifier is found. Returns the joined text or null.
 */
function resolveMultiLineImport(
  lines: readonly string[],
  lineNumber: number,
): string | null {
  // Search backward (max 30 lines) for the import/export/require start
  let startLine = -1;
  for (let i = lineNumber; i >= 0 && i >= lineNumber - 30; i--) {
    if (isImportStart(lines[i])) {
      startLine = i;
      break;
    }
    // Stop if we hit an empty line or something clearly unrelated
    const trimmed = lines[i].trim();
    if (trimmed === "" || isStatementBoundary(trimmed)) {
      return null;
    }
  }

  if (startLine === -1) {
    return null;
  }

  // Search forward from the start, joining lines until the specifier is found
  for (
    let endLine = startLine;
    endLine < lines.length && endLine <= startLine + 30;
    endLine++
  ) {
    const joined = lines.slice(startLine, endLine + 1).join(" ");
    if (extractModuleSpecifier(joined) !== null) {
      // Verify the cursor line falls within this statement range
      return lineNumber >= startLine && lineNumber <= endLine ? joined : null;
    }
  }

  return null;
}

/**
 * Heuristic: line looks like a statement boundary
 * (end of a previous statement, not continuation of an import).
 */
function isStatementBoundary(trimmedLine: string): boolean {
  // Lines ending with `;` that aren't from/require are likely other statements
  if (
    trimmedLine.endsWith(";") &&
    !trimmedLine.includes("from ") &&
    !trimmedLine.includes("require(")
  ) {
    return true;
  }
  // Function/class/if/for/etc. start
  if (/^(?:function|class|if|for|while|switch|return|throw)\b/.test(trimmedLine)) {
    return true;
  }
  return false;
}

/**
 * Check if a line is the first line of a (possibly multi-line) import statement.
 * Used by CodeLens to place lenses only on the opening line.
 */
export function isImportStatementStart(line: string): boolean {
  return IMPORT_START_RE.test(line);
}

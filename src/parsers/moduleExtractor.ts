import { syntaxPatterns } from "./syntaxPatterns.js";

/**
 * Extract the top-level npm package name from a module specifier.
 * - Scoped: `@scope/package/deep` → `@scope/package`
 * - Unscoped: `lodash/fp` → `lodash`
 */
function extractPackageName(specifier: string): string {
  if (specifier.startsWith("@")) {
    // Scoped package: take @scope/name
    const parts = specifier.split("/");
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : specifier;
  }
  // Unscoped: take the first segment
  return specifier.split("/")[0];
}

/**
 * Given a line of text, attempt to extract the module specifier.
 * Returns the raw specifier string (e.g., `@angular/core`, `lodash`, `./utils`)
 * or `null` if no import/require is found on this line.
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
 * Given a line of text, extract the top-level package name suitable for npm lookup.
 * Returns `null` if no import/require is found.
 */
export function extractPackageFromLine(line: string): {
  rawSpecifier: string;
  packageName: string;
} | null {
  const specifier = extractModuleSpecifier(line);
  if (!specifier) {
    return null;
  }
  return {
    rawSpecifier: specifier,
    packageName: extractPackageName(specifier),
  };
}

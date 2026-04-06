/**
 * Build the npmjs.com URL for a given package name.
 */
export function getNpmUrl(packageName: string): string {
  return `https://www.npmjs.com/package/${packageName}`;
}

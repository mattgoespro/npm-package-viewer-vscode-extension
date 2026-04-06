import { getConfig } from "./config.js";

/**
 * Build the npm registry URL for a given package name.
 * Uses the configured registry URL (defaults to https://www.npmjs.com).
 */
export function getNpmUrl(packageName: string): string {
  const { registryUrl } = getConfig();
  const base = registryUrl.replace(/\/+$/, "");
  return `${base}/package/${packageName}`;
}

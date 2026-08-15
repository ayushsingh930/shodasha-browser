/**
 * Central version metadata for SHODASHA Browser.
 *
 * Keeping the version in a single module means every layer (core, desktop,
 * future mobile) reports the same release information without drift.
 */

export interface VersionInfo {
  /** Semantic version of the application. */
  readonly version: string;
  /** Human-readable product name. */
  readonly name: string;
  /** Short marketing tagline. */
  readonly tagline: string;
}

export const VERSION: VersionInfo = {
  version: '0.1.0',
  name: 'SHODASHA Browser',
  tagline: 'Private. Fast. Yours.',
} as const;

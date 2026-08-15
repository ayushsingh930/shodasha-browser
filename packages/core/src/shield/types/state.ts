/**
 * Per-site shield state.
 *
 * Per-site settings are always explicit and user-controlled. The shield is
 * never silently disabled for a site.
 */

import type { ShieldMode } from './mode.js';

/** Explicit shield settings for a single site. */
export interface SiteShieldSetting {
  /** Whether the shield is on while the user is on this site. */
  readonly enabled: boolean;
  /** Per-site protection mode; falls back to the global mode when unset. */
  readonly mode: ShieldMode;
}

/**
 * Blocking rules for the Shield.
 *
 * Values are validated before they are used; malformed rules are rejected so
 * they cannot create unexpected bypasses. A rule matches one hostname exactly
 * (`hostname`) or a domain and all of its subdomains (`domain`).
 */

import type { ShieldCategory } from './category.js';

/** How a block rule matches. */
export type BlockRuleKind = 'domain' | 'hostname';

/** A single blocking rule. */
export interface BlockRule {
  /** Stable identifier for the rule. */
  readonly id: string;
  /** How this rule matches: a whole domain (+ subdomains) or one hostname. */
  readonly kind: BlockRuleKind;
  /** The category used for stats and mode-based activation. */
  readonly category: ShieldCategory;
  /** The normalized domain/hostname value (lowercase, no scheme/port/path). */
  readonly value: string;
  /** Human-readable source of the rule (list id, user, etc.). */
  readonly source: string;
}

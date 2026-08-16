/**
 * Typed filtering decisions.
 *
 * Decisions are deliberately honest: `unknown` is used when a request cannot
 * be classified, and no decision implies a security claim beyond the user's
 * configured rules.
 */

import type { FilterRule } from './rule.js';

/** The outcome of evaluating a request. */
export type ShieldDecisionKind =
  | 'allow'
  | 'allow-rule'
  | 'block'
  | 'allowlisted'
  | 'unknown';

/** A typed filtering decision for a single request. */
export interface ShieldDecision {
  /** The decision kind. */
  readonly kind: ShieldDecisionKind;
  /**
   * The rules that produced this decision. For a `block` these are the
   * matching block rules; for `allow-rule` the matching allow rules; empty
   * otherwise.
   */
  readonly matchedRules: readonly FilterRule[];
}

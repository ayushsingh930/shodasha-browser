/**
 * Typed filtering decisions.
 *
 * Decisions are deliberately honest: `unknown` is used when a request cannot
 * be classified, and no decision implies a security claim beyond the user's
 * configured rules.
 */

import type { BlockRule } from './rule.js';

/** The outcome of evaluating a request. */
export type ShieldDecisionKind = 'allow' | 'block' | 'allowlisted' | 'unknown';

/** A typed filtering decision for a single request. */
export interface ShieldDecision {
  /** The decision kind. */
  readonly kind: ShieldDecisionKind;
  /** The rules that caused a block, if any. */
  readonly matchedRules: readonly BlockRule[];
}

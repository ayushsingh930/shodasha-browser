/**
 * Filter rules for the Shield.
 *
 * Values are validated before they are used; malformed rules are rejected so
 * they cannot create unexpected bypasses. A rule matches one hostname exactly
 * (`hostname`) or a domain and all of its subdomains (`domain`). Rules may be
 * scoped to a resource type, a first/third-party context, or both, and each
 * rule carries an explicit action (`block` or `allow`) and an enabled state.
 *
 * A rule with `action: 'allow'` takes priority over matching block rules for
 * the same hostname (see the Shield's deterministic decision flow).
 */

import type { PartyContext, ResourceType } from './request.js';
import type { ShieldCategory } from './category.js';

/** How a filter rule matches. */
export type FilterRuleKind = 'domain' | 'hostname';

/** The action a rule applies to matching requests. */
export type FilterRuleAction = 'block' | 'allow';

/** The resource-type constraint of a rule (`undefined` = any type). */
export type FilterRuleResourceConstraint = ResourceType;

/** The party constraint of a rule (`undefined` = any party). */
export type FilterRulePartyConstraint = PartyContext;

/** A single filter rule. */
export interface FilterRule {
  /** Stable identifier for the rule. */
  readonly id: string;
  /** How this rule matches: a whole domain (+ subdomains) or one hostname. */
  readonly kind: FilterRuleKind;
  /** The category used for stats and mode-based activation. */
  readonly category: ShieldCategory;
  /** The normalized domain/hostname value (lowercase, no scheme/port/path). */
  readonly value: string;
  /** Human-readable source of the rule (list id, user, etc.). */
  readonly source: string;
  /** The action applied when this rule matches. Defaults to `block`. */
  readonly action?: FilterRuleAction;
  /**
   * Resource types this rule applies to. When present and non-empty, the rule
   * only matches requests of one of these types. `undefined` = any type.
   */
  readonly resourceTypes?: readonly FilterRuleResourceConstraint[];
  /**
   * Party context this rule applies to. When present, the rule only matches
   * requests classified with that context. `undefined` = any context.
   */
  readonly party?: FilterRulePartyConstraint;
  /** Whether the rule is active. Defaults to `true`. */
  readonly enabled?: boolean;
}

/**
 * Backward-compatible alias for the historical name. New code should use
 * {@link FilterRule}.
 */
export type BlockRule = FilterRule;
export type BlockRuleKind = FilterRuleKind;
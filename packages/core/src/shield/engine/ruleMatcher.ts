/**
 * The Shield's rule engine.
 *
 * Deterministic and testable: `hostname` rules match exactly, `domain` rules
 * match the domain and every parent domain. Matching is lookup-based (no
 * regex, no expensive string scans), which keeps allocations low and fast for
 * browser-scale traffic. The engine is pure and synchronous, so hosts can run
 * it off the UI thread.
 *
 * Rules can be scoped by resource type and party context; rules whose scope
 * cannot be established for a request are simply not considered. Disabled
 * rules stay compiled (so they can be re-enabled without recompilation) but
 * never match.
 */

import type { ShieldCategory } from '../types/category.js';
import type { FilterRule } from '../types/rule.js';
import type { ResourceType } from '../types/request.js';
import { isValidHostname, normalizeHostname, parentDomains } from './hostname.js';

/** Compiled lookup tables for each rule kind. */
interface CompiledRules {
  readonly domain: Map<string, readonly FilterRule[]>;
  readonly hostname: Map<string, readonly FilterRule[]>;
}

/** The evaluable context of a single request. */
export interface RuleEvaluationContext {
  /** The request's resource type. `undefined` = any type matches. */
  readonly resourceType: ResourceType | undefined;
  /** The request's party context. `undefined` = any party matches. */
  readonly party: string | undefined;
}

const VALID_RESOURCE_TYPES: ReadonlySet<string> = new Set([
  'document',
  'script',
  'stylesheet',
  'image',
  'font',
  'media',
  'websocket',
  'xhr',
  'other',
]);

const VALID_PARTIES: ReadonlySet<string> = new Set([
  'first-party',
  'third-party',
]);

/**
 * A compiled, in-memory rule matcher for the Shield.
 */
export class RuleEngine {
  private readonly tables: CompiledRules = {
    domain: new Map(),
    hostname: new Map(),
  };
  private count = 0;

  public constructor(rules: readonly FilterRule[] = []) {
    this.add(rules);
  }

  /**
   * Adds rules, dropping any with an invalid hostname value or an invalid
   * scope value. Returns the number of rules accepted.
   */
  public add(rules: readonly FilterRule[]): number {
    let accepted = 0;
    for (const rule of rules) {
      if (!isValidFilterRule(rule)) {
        continue;
      }
      const table = rule.kind === 'hostname' ? this.tables.hostname : this.tables.domain;
      const existing = table.get(rule.value);
      table.set(rule.value, existing === undefined ? [rule] : [...existing, rule]);
      this.count += 1;
      accepted += 1;
    }
    return accepted;
  }

  /**
   * Returns the rules that match `hostname`, whose category is active, and
   * whose scope (resource type / party) applies to the request context.
   * Order is deterministic: exact hostname rules first, then domain rules from
   * the longest suffix to the shortest, in insertion order within each key.
   */
  public evaluate(
    hostname: string,
    activeCategories: ReadonlySet<ShieldCategory>,
    context: RuleEvaluationContext = { resourceType: undefined, party: undefined },
  ): readonly FilterRule[] {
    const normalized = normalizeHostname(hostname);
    const matched: FilterRule[] = [];
    const seen = new Set<string>();

    const consider = (list: readonly FilterRule[] | undefined): void => {
      if (list === undefined) {
        return;
      }
      for (const rule of list) {
        if (!seen.has(rule.id) && ruleApplies(rule, activeCategories, context)) {
          seen.add(rule.id);
          matched.push(rule);
        }
      }
    };

    consider(this.tables.hostname.get(normalized));

    for (const domain of parentDomains(normalized)) {
      consider(this.tables.domain.get(domain));
    }

    return matched;
  }

  /** The number of compiled rules currently active. */
  public get ruleCount(): number {
    return this.count;
  }
}

/** Whether a compiled rule is valid enough to be registered. */
function isValidFilterRule(rule: FilterRule): boolean {
  if (!isValidHostname(rule.value)) {
    return false;
  }
  if (rule.resourceTypes !== undefined) {
    for (const type of rule.resourceTypes) {
      if (!VALID_RESOURCE_TYPES.has(type)) {
        return false;
      }
    }
  }
  if (rule.party !== undefined && !VALID_PARTIES.has(rule.party)) {
    return false;
  }
  return true;
}

/** Whether a compiled rule applies to the given request context. */
function ruleApplies(
  rule: FilterRule,
  activeCategories: ReadonlySet<ShieldCategory>,
  context: RuleEvaluationContext,
): boolean {
  if (rule.enabled === false) {
    return false;
  }
  if (!activeCategories.has(rule.category)) {
    return false;
  }
  if (rule.resourceTypes !== undefined && rule.resourceTypes.length > 0) {
    if (
      context.resourceType === undefined ||
      !rule.resourceTypes.includes(context.resourceType)
    ) {
      return false;
    }
  }
  if (rule.party !== undefined && rule.party !== context.party) {
    return false;
  }
  return true;
}
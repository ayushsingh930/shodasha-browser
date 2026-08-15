/**
 * The Shield's rule engine.
 *
 * Deterministic and testable: `hostname` rules match exactly, `domain` rules
 * match the domain and every parent domain. Matching is lookup-based (no
 * regex, no expensive string scans), which keeps allocations low and fast for
 * browser-scale traffic. The engine is pure and synchronous, so hosts can run
 * it off the UI thread.
 */

import type { ShieldCategory } from '../types/category.js';
import type { BlockRule } from '../types/rule.js';
import { isValidHostname, normalizeHostname, parentDomains } from './hostname.js';

/** Compiled lookup tables for each rule kind. */
interface CompiledRules {
  readonly domain: Map<string, readonly BlockRule[]>;
  readonly hostname: Map<string, readonly BlockRule[]>;
}

/**
 * A compiled, in-memory rule matcher for the Shield.
 */
export class RuleEngine {
  private readonly tables: CompiledRules = {
    domain: new Map(),
    hostname: new Map(),
  };
  private count = 0;

  public constructor(rules: readonly BlockRule[] = []) {
    this.add(rules);
  }

  /**
   * Adds rules, dropping any with an invalid hostname value. Returns the
   * number of rules accepted.
   */
  public add(rules: readonly BlockRule[]): number {
    let accepted = 0;
    for (const rule of rules) {
      if (!isValidHostname(rule.value)) {
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
   * Returns the rules that match `hostname` and whose category is active.
   * Order is deterministic: exact hostname rules first, then domain rules from
   * the longest suffix to the shortest, in insertion order within each key.
   */
  public evaluate(
    hostname: string,
    activeCategories: ReadonlySet<ShieldCategory>,
  ): readonly BlockRule[] {
    const normalized = normalizeHostname(hostname);
    const matched: BlockRule[] = [];
    const seen = new Set<string>();

    const consider = (list: readonly BlockRule[] | undefined): void => {
      if (list === undefined) {
        return;
      }
      for (const rule of list) {
        if (activeCategories.has(rule.category) && !seen.has(rule.id)) {
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

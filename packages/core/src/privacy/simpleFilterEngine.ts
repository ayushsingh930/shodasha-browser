/**
 * A simple, pure, in-memory filter engine.
 *
 * This is a deliberately minimal implementation used to validate the
 * {@link ContentFilterEngine} contract and to serve as the seed for a
 * future, higher-performance engine. It performs a case-insensitive
 * substring match on request URLs against known patterns.
 */

import type {
  ContentFilterEngine,
  FilterDecision,
  FilterList,
  FilterRule,
} from './contentFilter.js';

/** A rule that has been normalized for fast matching. */
interface CompiledRule {
  readonly rule: FilterRule;
  readonly normalizedPattern: string;
}

export interface SimpleFilterEngineOptions {
  /**
   * Lists to load at construction. Unknown rules are simply not loaded; no
   * exception is thrown for malformed entries (defensive by default).
   */
  readonly lists?: readonly FilterList[];
}

/**
 * A simple substring-based filter engine.
 */
export class SimpleFilterEngine implements ContentFilterEngine {
  private readonly compiled: readonly CompiledRule[];

  public constructor(options: SimpleFilterEngineOptions = {}) {
    this.compiled = (options.lists ?? []).flatMap((list) =>
      list.rules.map((rule) => ({
        rule,
        normalizedPattern: rule.pattern.toLowerCase(),
      })),
    );
  }

  public shouldBlockRequest(subject: string): FilterDecision {
    const normalized = subject.toLowerCase();
    const matchedBy: FilterRule[] = [];

    for (const entry of this.compiled) {
      if (normalized.includes(entry.normalizedPattern)) {
        matchedBy.push(entry.rule);
      }
    }

    return {
      blocked: matchedBy.length > 0,
      matchedBy: Object.freeze(matchedBy),
    };
  }

  /** Number of compiled rules currently active. */
  public get ruleCount(): number {
    return this.compiled.length;
  }
}

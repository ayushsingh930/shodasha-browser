/**
 * Shield statistics.
 *
 * Only aggregate counters needed by the UI are tracked — never individual
 * URLs, sites, or any browsing history. Counters are session-scoped; hosts can
 * reset them when a new session begins.
 */

import type { BlockRule } from '../types/rule.js';

/** Aggregate, UI-facing statistics. */
export interface ShieldStats {
  /** Total requests evaluated since the last reset. */
  readonly requestsEvaluated: number;
  /** Requests blocked by a rule. */
  readonly requestsBlocked: number;
  /** Requests allowed (including allowlisted and unclassifiable ones). */
  readonly requestsAllowed: number;
  /** Blocked requests whose matched rule was a tracker or social tracker. */
  readonly trackersBlocked: number;
  /** Blocked requests whose matched rule was an ad. */
  readonly adsFiltered: number;
}

/** Returns a zeroed stats snapshot. */
export function emptyShieldStats(): ShieldStats {
  return {
    requestsEvaluated: 0,
    requestsBlocked: 0,
    requestsAllowed: 0,
    trackersBlocked: 0,
    adsFiltered: 0,
  };
}

/** Internal mutable state backing the counter. */
interface MutableShieldStats {
  requestsEvaluated: number;
  requestsBlocked: number;
  requestsAllowed: number;
  trackersBlocked: number;
  adsFiltered: number;
}

/**
 * A minimal, allocation-light counter for shield statistics.
 */
export class ShieldStatsCounter {
  private readonly stats: MutableShieldStats = emptyMutableStats();

  /** A copy of the current statistics (immutable snapshot). */
  public get snapshot(): ShieldStats {
    return { ...this.stats };
  }

  /** Records that a request was evaluated. */
  public recordEvaluated(): void {
    this.stats.requestsEvaluated += 1;
  }

  /** Records an allowed request. */
  public recordAllowed(): void {
    this.stats.requestsAllowed += 1;
  }

  /** Records a blocked request and its category counters. */
  public recordBlock(matchedRules: readonly BlockRule[]): void {
    this.stats.requestsBlocked += 1;
    const categories = new Set(matchedRules.map((rule) => rule.category));
    if (categories.has('trackers') || categories.has('social-tracking')) {
      this.stats.trackersBlocked += 1;
    }
    if (categories.has('ads')) {
      this.stats.adsFiltered += 1;
    }
  }

  /** Resets all counters to zero. */
  public reset(): void {
    this.stats.requestsEvaluated = 0;
    this.stats.requestsBlocked = 0;
    this.stats.requestsAllowed = 0;
    this.stats.trackersBlocked = 0;
    this.stats.adsFiltered = 0;
  }
}

function emptyMutableStats(): MutableShieldStats {
  return {
    requestsEvaluated: 0,
    requestsBlocked: 0,
    requestsAllowed: 0,
    trackersBlocked: 0,
    adsFiltered: 0,
  };
}

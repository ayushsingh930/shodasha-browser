/**
 * Shield statistics.
 *
 * Only aggregate counters needed by the UI are tracked — never individual
 * URLs, sites, or any browsing history. Counters are session-scoped; hosts can
 * reset them when a new session begins. Per-site counters are kept for the
 * site currently being viewed (session-scoped, in-memory only) so the panel
 * can show "this site" without any persistent browsing analytics.
 */

import type { FilterRule } from '../types/rule.js';

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

/** Aggregate counters for a single site (session-scoped, in-memory only). */
export interface SiteStats {
  /** Requests evaluated while this site was the current site. */
  readonly requestsEvaluated: number;
  /** Requests blocked while this site was the current site. */
  readonly requestsBlocked: number;
  /** Requests allowed while this site was the current site. */
  readonly requestsAllowed: number;
  /** Blocked requests on this site whose matched rule was a tracker/social tracker. */
  readonly trackersBlocked: number;
  /** Blocked requests on this site whose matched rule was an ad. */
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

/** The maximum number of per-site entries kept in memory at once. */
const MAX_SITE_STATS = 64;

/**
 * A minimal, allocation-light counter for shield statistics.
 */
export class ShieldStatsCounter {
  private readonly stats: MutableShieldStats = emptyMutableStats();
  private readonly siteStats = new Map<string, MutableSiteStats>();

  /** A copy of the current statistics (immutable snapshot). */
  public get snapshot(): ShieldStats {
    return { ...this.stats };
  }

  /** A copy of the counters for `site`, or zeroed values when absent. */
  public snapshotForSite(site: string): SiteStats {
    const entry = this.siteStats.get(site);
    if (entry === undefined) {
      return emptySiteStats();
    }
    return { ...entry };
  }

  /** Records that a request was evaluated. */
  public recordEvaluated(site?: string | null): void {
    this.stats.requestsEvaluated += 1;
    if (site !== undefined && site !== null && site.length > 0) {
      this.touchSite(site).requestsEvaluated += 1;
    }
  }

  /** Records an allowed request. */
  public recordAllowed(site?: string | null): void {
    this.stats.requestsAllowed += 1;
    if (site !== undefined && site !== null && site.length > 0) {
      this.touchSite(site).requestsAllowed += 1;
    }
  }

  /** Records a blocked request and its category counters. */
  public recordBlock(matchedRules: readonly FilterRule[], site?: string | null): void {
    this.stats.requestsBlocked += 1;
    const categories = new Set(matchedRules.map((rule) => rule.category));
    const isTracker =
      categories.has('trackers') || categories.has('social-tracking');
    const isAd = categories.has('ads');
    if (isTracker) {
      this.stats.trackersBlocked += 1;
    }
    if (isAd) {
      this.stats.adsFiltered += 1;
    }
    if (site !== undefined && site !== null && site.length > 0) {
      const siteEntry = this.touchSite(site);
      siteEntry.requestsBlocked += 1;
      if (isTracker) {
        siteEntry.trackersBlocked += 1;
      }
      if (isAd) {
        siteEntry.adsFiltered += 1;
      }
    }
  }

  /** Resets all counters to zero. */
  public reset(): void {
    this.stats.requestsEvaluated = 0;
    this.stats.requestsBlocked = 0;
    this.stats.requestsAllowed = 0;
    this.stats.trackersBlocked = 0;
    this.stats.adsFiltered = 0;
    this.siteStats.clear();
  }

  /** Returns (creating if needed) the mutable per-site counters. */
  private touchSite(site: string): MutableSiteStats {
    let entry = this.siteStats.get(site);
    if (entry === undefined) {
      if (this.siteStats.size >= MAX_SITE_STATS) {
        // Drop the oldest entry to keep the session buffer bounded.
        const oldest = this.siteStats.keys().next().value;
        if (oldest !== undefined) {
          this.siteStats.delete(oldest);
        }
      }
      entry = emptyMutableSiteStats();
      this.siteStats.set(site, entry);
    }
    return entry;
  }
}

interface MutableSiteStats {
  requestsEvaluated: number;
  requestsBlocked: number;
  requestsAllowed: number;
  trackersBlocked: number;
  adsFiltered: number;
}

function emptySiteStats(): SiteStats {
  return {
    requestsEvaluated: 0,
    requestsBlocked: 0,
    requestsAllowed: 0,
    trackersBlocked: 0,
    adsFiltered: 0,
  };
}

function emptyMutableSiteStats(): MutableSiteStats {
  return {
    requestsEvaluated: 0,
    requestsBlocked: 0,
    requestsAllowed: 0,
    trackersBlocked: 0,
    adsFiltered: 0,
  };
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
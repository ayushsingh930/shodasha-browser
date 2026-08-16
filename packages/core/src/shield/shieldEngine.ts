/**
 * SHODASHA Shield — the composition root.
 *
 * The Shield is a user-controlled privacy and content-filtering system. It
 * makes decisions only about requests the browser itself can legitimately
 * inspect and control, operates entirely on-device, and never attempts to
 * defeat website security mechanisms.
 *
 * Deterministic decision flow (host wires the decision into the request
 * pipeline):
 *
 *   Request
 *     ├─ unclassifiable             → UNKNOWN (never blocked)
 *     ├─ shield off (global/site)   → ALLOW
 *     ├─ allowlist match            → ALLOWLISTED (higher priority than rules)
 *     ├─ allow rule match           → ALLOW (explicit allow wins over blocks)
 *     ├─ block rule match           → BLOCK
 *     └─ otherwise                  → ALLOW
 *
 * Requests whose party context cannot be determined are never guessed;
 * party-scoped rules simply do not apply to them. Decisions are cached with a
 * bounded, context-versioned key so rule/state changes can never serve stale
 * results. Rule-driven decisions are mirrored into a small, session-scoped
 * event buffer for the UI (privacy-safe metadata only).
 *
 * No mode claims perfect privacy.
 */

import {
  isValidHostname,
  normalizeHostname,
  parentDomains,
} from './engine/hostname.js';
import { classifyParty } from './engine/party.js';
import { RuleEngine } from './engine/ruleMatcher.js';
import type { FilterListSource } from './lists/filterListSource.js';
import {
  RecentEventsBuffer,
  type ShieldFilterEvent,
} from './stats/shieldEvents.js';
import {
  ShieldStatsCounter,
  type ShieldStats,
  type SiteStats,
} from './stats/shieldStats.js';
import type { ShieldCategory } from './types/category.js';
import type { ShieldDecision } from './types/decision.js';
import type { ShieldMode } from './types/mode.js';
import type { ShieldContext, ShieldRequest } from './types/request.js';
import type { FilterRule } from './types/rule.js';
import type { SiteShieldSetting } from './types/state.js';

const CORE_CATEGORIES: readonly ShieldCategory[] = [
  'ads',
  'trackers',
  'social-tracking',
  'malicious-domains',
];

/** The maximum number of cached decisions held at once. */
const MAX_CACHE_ENTRIES = 4096;

/**
 * Returns the set of active categories for a mode. In `custom` mode the
 * user-defined set is returned.
 */
export function categoriesForMode(
  mode: ShieldMode,
  custom: ReadonlySet<ShieldCategory>,
): ReadonlySet<ShieldCategory> {
  switch (mode) {
    case 'standard':
      return new Set(CORE_CATEGORIES);
    case 'strict':
      return new Set([...CORE_CATEGORIES, 'other']);
    case 'custom':
      return custom;
  }
}

/**
 * The Shield engine: owns global/per-site state, allowlist, rules, statistics,
 * recent events, and a bounded decision cache, and evaluates requests
 * deterministically.
 */
export class ShieldEngine {
  private readonly ruleEngine = new RuleEngine();
  private readonly counters = new ShieldStatsCounter();
  private readonly events = new RecentEventsBuffer();
  private readonly siteSettings = new Map<string, SiteShieldSetting>();
  private readonly allowlistSet = new Set<string>();
  private readonly decisionCache = new Map<string, ShieldDecision>();
  private enabledState = true;
  private modeState: ShieldMode = 'standard';
  private readonly customCategorySet = new Set<ShieldCategory>(CORE_CATEGORIES);
  /** Bumped whenever any state that affects decisions changes. */
  private contextVersion = 0;

  // ------------------------------------------------------------ control

  /** Whether the shield is globally enabled. */
  public get enabled(): boolean {
    return this.enabledState;
  }

  public setEnabled(enabled: boolean): void {
    this.enabledState = enabled;
    this.invalidateDecisions();
  }

  /** The global protection mode. */
  public get mode(): ShieldMode {
    return this.modeState;
  }

  public setMode(mode: ShieldMode): void {
    this.modeState = mode;
    this.invalidateDecisions();
  }

  /** The categories active in `custom` mode. */
  public get customCategories(): ReadonlySet<ShieldCategory> {
    return this.customCategorySet;
  }

  /** Enables or disables a category for `custom` mode. */
  public setCategoryEnabled(category: ShieldCategory, enabled: boolean): void {
    if (enabled) {
      this.customCategorySet.add(category);
    } else {
      this.customCategorySet.delete(category);
    }
    this.invalidateDecisions();
  }

  // --------------------------------------------------------- per-site

  /**
   * Sets an explicit per-site shield setting. Sites with no explicit setting
   * follow the global state. Only the provided fields are updated.
   */
  public setSiteSetting(
    site: string,
    setting: Partial<SiteShieldSetting>,
  ): void {
    const key = normalizeHostname(site);
    if (key.length === 0) {
      return;
    }
    const current = this.siteSettings.get(key);
    const base = current ?? { enabled: true, mode: this.modeState };
    this.siteSettings.set(key, {
      enabled: setting.enabled ?? base.enabled,
      mode: setting.mode ?? base.mode,
    });
    this.invalidateDecisions();
  }

  /** Returns the resolved setting for a site (falls back to global state). */
  public getSiteSetting(site: string): SiteShieldSetting {
    const key = normalizeHostname(site);
    const setting = this.siteSettings.get(key);
    return setting ?? { enabled: true, mode: this.modeState };
  }

  /** Whether the shield is on while the user is on `site`. */
  public isSiteEnabled(site: string): boolean {
    const key = normalizeHostname(site);
    return this.siteSettings.get(key)?.enabled ?? true;
  }

  /** Removes any explicit per-site setting. */
  public removeSiteSetting(site: string): void {
    if (this.siteSettings.delete(normalizeHostname(site))) {
      this.invalidateDecisions();
    }
  }

  // ------------------------------------------------------- allowlist

  /** Adds a domain to the allowlist. Returns `false` when invalid. */
  public addAllowlist(domain: string): boolean {
    const key = normalizeHostname(domain);
    if (!isValidHostname(key)) {
      return false;
    }
    this.allowlistSet.add(key);
    this.invalidateDecisions();
    return true;
  }

  /** Removes a domain from the allowlist. Returns `false` when absent. */
  public removeAllowlist(domain: string): boolean {
    const removed = this.allowlistSet.delete(normalizeHostname(domain));
    if (removed) {
      this.invalidateDecisions();
    }
    return removed;
  }

  /** Toggles allowlist membership for a domain. Returns the new state. */
  public toggleAllowlist(domain: string): boolean {
    if (this.isAllowlisted(domain)) {
      this.removeAllowlist(domain);
      return false;
    }
    return this.addAllowlist(domain);
  }

  /**
   * Whether a hostname is allowlisted. Matches the hostname and any parent
   * domain (an allowlisted `example.com` covers `www.example.com`). Scoping
   * is strict: `trusted-site.com.evil.com` is never treated as
   * `trusted-site.com`, because matching walks real parent domains only.
   */
  public isAllowlisted(hostname: string): boolean {
    const key = normalizeHostname(hostname);
    if (key.length === 0) {
      return false;
    }
    for (const parent of parentDomains(key)) {
      if (this.allowlistSet.has(parent)) {
        return true;
      }
    }
    return false;
  }

  /** The currently allowlisted domains. */
  public get allowlist(): readonly string[] {
    return [...this.allowlistSet];
  }

  // ------------------------------------------------------------ rules

  /** Adds filter rules, dropping invalid values. Returns the count accepted. */
  public addRules(rules: readonly FilterRule[]): number {
    const accepted = this.ruleEngine.add(rules);
    if (accepted > 0) {
      this.invalidateDecisions();
    }
    return accepted;
  }

  /** Loads all rules from a filter-list source. Returns the count accepted. */
  public addList(source: FilterListSource): number {
    return this.addRules(source.loadRules());
  }

  /** The number of compiled rules. */
  public get ruleCount(): number {
    return this.ruleEngine.ruleCount;
  }

  // ------------------------------------------------------- statistics

  /** A snapshot of the current session statistics. */
  public get stats(): ShieldStats {
    return this.counters.snapshot;
  }

  /** A snapshot of the counters for `site` (zeros when unvisited). */
  public siteStatsFor(site: string): SiteStats {
    return this.counters.snapshotForSite(normalizeHostname(site));
  }

  /** Resets all statistics to zero. */
  public resetStats(): void {
    this.counters.reset();
  }

  // -------------------------------------------------- recent events

  /** The recent rule-driven filter events, most recent first. */
  public get recentEvents(): readonly ShieldFilterEvent[] {
    return this.events.snapshot;
  }

  /** Clears the recent-event buffer. */
  public clearEvents(): void {
    this.events.clear();
  }

  // ------------------------------------------------------ evaluation

  /**
   * Evaluates a single request against the configured state and rules.
   * Deterministic; safe to call off the UI thread.
   *
   * Fail-open: any request that cannot be classified or has no matching rule
   * is allowed. A rule error never blocks a request (see
   * {@link evaluateUncached}).
   */
  public evaluate(
    request: ShieldRequest,
    context: ShieldContext = { currentSite: null },
  ): ShieldDecision {
    const currentSite =
      context.currentSite === null || context.currentSite.length === 0
        ? ''
        : normalizeHostname(context.currentSite);
    this.counters.recordEvaluated(currentSite);

    if (request.hostname.length === 0) {
      this.counters.recordAllowed(currentSite);
      return { kind: 'unknown', matchedRules: [] };
    }

    let enabled = this.enabledState;
    let mode = this.modeState;
    if (currentSite.length > 0) {
      const setting = this.siteSettings.get(currentSite);
      if (setting !== undefined) {
        enabled = enabled && setting.enabled;
        mode = setting.mode;
      }
    }

    if (!enabled) {
      this.counters.recordAllowed(currentSite);
      return { kind: 'allow', matchedRules: [] };
    }

    if (this.isAllowlisted(request.hostname)) {
      this.counters.recordAllowed(currentSite);
      return { kind: 'allowlisted', matchedRules: [] };
    }

    const party = classifyParty({
      hostname: request.hostname,
      firstPartyOrigin: request.firstPartyOrigin,
    });

    const cacheKey = decisionCacheKey(
      request.hostname,
      party,
      request.resourceType,
      currentSite,
      this.contextVersion,
    );
    const cached = this.decisionCache.get(cacheKey);
    if (cached !== undefined) {
      this.recordCachedDecision(cached, currentSite);
      return cached;
    }

    const decision = this.evaluateUncached(request, party, mode, currentSite);
    if (this.decisionCache.size >= MAX_CACHE_ENTRIES) {
      this.decisionCache.clear();
    }
    this.decisionCache.set(cacheKey, decision);
    return decision;
  }

  /**
   * Evaluates without the cache and records statistics and events. Fail-open:
   * any error while matching yields an allow decision, never a block and
   * never a crash.
   */
  private evaluateUncached(
    request: ShieldRequest,
    party: 'first-party' | 'third-party' | 'unknown-party',
    mode: ShieldMode,
    currentSite: string,
  ): ShieldDecision {
    const activeCategories = categoriesForMode(mode, this.customCategories);
    let matched: readonly FilterRule[] = [];
    try {
      matched = this.ruleEngine.evaluate(request.hostname, activeCategories, {
        resourceType: request.resourceType,
        party: party === 'unknown-party' ? undefined : party,
      });
    } catch {
      matched = [];
    }

    const allowRules = matched.filter((rule) => rule.action === 'allow');
    const allowRule = allowRules[0];
    if (allowRule !== undefined) {
      this.counters.recordAllowed(currentSite);
      this.events.record(
        {
          action: 'allow',
          resourceType: request.resourceType,
          hostname: request.hostname,
        },
        allowRule,
      );
      return { kind: 'allow-rule', matchedRules: allowRules };
    }

    const blockRules = matched.filter((rule) => rule.action !== 'allow');
    const blockRule = blockRules[0];
    if (blockRule !== undefined) {
      this.counters.recordBlock(blockRules, currentSite);
      this.events.record(
        {
          action: 'block',
          resourceType: request.resourceType,
          hostname: request.hostname,
        },
        blockRule,
      );
      return { kind: 'block', matchedRules: blockRules };
    }

    this.counters.recordAllowed(currentSite);
    return { kind: 'allow', matchedRules: [] };
  }

  /** Records statistics for a decision served from the cache. */
  private recordCachedDecision(decision: ShieldDecision, currentSite: string): void {
    if (decision.kind === 'block') {
      this.counters.recordBlock(decision.matchedRules, currentSite);
      return;
    }
    this.counters.recordAllowed(currentSite);
  }

  /** Invalidates cached decisions after any state change. */
  private invalidateDecisions(): void {
    this.contextVersion += 1;
    this.decisionCache.clear();
  }
}

/**
 * Builds a deterministic cache key from every input that affects the outcome.
 * The context version guarantees that rule/state changes invalidate results.
 */
function decisionCacheKey(
  hostname: string,
  party: 'first-party' | 'third-party' | 'unknown-party',
  resourceType: string,
  currentSite: string,
  contextVersion: number,
): string {
  return [
    contextVersion,
    hostname,
    party,
    resourceType,
    currentSite,
  ].join('\u0000');
}
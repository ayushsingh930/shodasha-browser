/**
 * SHODASHA Shield — the composition root.
 *
 * The Shield is a user-controlled privacy and content-filtering system. It
 * makes decisions only about requests the browser itself can legitimately
 * inspect and control, operates entirely on-device, and never attempts to
 * defeat website security mechanisms.
 *
 * Decision flow (host wires the decision into the request pipeline):
 *
 *   Request
 *     ├─ unclassifiable            → UNKNOWN (never blocked)
 *     ├─ shield off (global/site)  → ALLOW
 *     ├─ allowlist match           → ALLOWLISTED (higher priority than rules)
 *     ├─ blocking rule (active)    → BLOCK
 *     └─ otherwise                 → ALLOW
 *
 * No mode claims perfect privacy.
 */

import {
  isValidHostname,
  normalizeHostname,
  parentDomains,
} from './engine/hostname.js';
import { RuleEngine } from './engine/ruleMatcher.js';
import type { FilterListSource } from './lists/filterListSource.js';
import {
  ShieldStatsCounter,
  type ShieldStats,
} from './stats/shieldStats.js';
import type { ShieldCategory } from './types/category.js';
import type { ShieldDecision } from './types/decision.js';
import type { ShieldMode } from './types/mode.js';
import type { ShieldContext, ShieldRequest } from './types/request.js';
import type { BlockRule } from './types/rule.js';
import type { SiteShieldSetting } from './types/state.js';

const CORE_CATEGORIES: readonly ShieldCategory[] = [
  'ads',
  'trackers',
  'social-tracking',
  'malicious-domains',
];

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
 * The Shield engine: owns global/per-site state, allowlist, blocklist, and
 * statistics, and evaluates requests deterministically.
 */
export class ShieldEngine {
  private readonly ruleEngine = new RuleEngine();
  private readonly counters = new ShieldStatsCounter();
  private readonly siteSettings = new Map<string, SiteShieldSetting>();
  private readonly allowlistSet = new Set<string>();
  private enabledState = true;
  private modeState: ShieldMode = 'standard';
  private readonly customCategorySet = new Set<ShieldCategory>(CORE_CATEGORIES);

  // ------------------------------------------------------------ control

  /** Whether the shield is globally enabled. */
  public get enabled(): boolean {
    return this.enabledState;
  }

  public setEnabled(enabled: boolean): void {
    this.enabledState = enabled;
  }

  /** The global protection mode. */
  public get mode(): ShieldMode {
    return this.modeState;
  }

  public setMode(mode: ShieldMode): void {
    this.modeState = mode;
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
    this.siteSettings.delete(normalizeHostname(site));
  }

  // ------------------------------------------------------- allowlist

  /** Adds a domain to the allowlist. Returns `false` when invalid. */
  public addAllowlist(domain: string): boolean {
    const key = normalizeHostname(domain);
    if (!isValidHostname(key)) {
      return false;
    }
    this.allowlistSet.add(key);
    return true;
  }

  /** Removes a domain from the allowlist. Returns `false` when absent. */
  public removeAllowlist(domain: string): boolean {
    return this.allowlistSet.delete(normalizeHostname(domain));
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
   * domain (an allowlisted `example.com` covers `www.example.com`).
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

  // ------------------------------------------------------ blocklist

  /** Adds block rules, dropping invalid values. Returns the count accepted. */
  public addRules(rules: readonly BlockRule[]): number {
    return this.ruleEngine.add(rules);
  }

  /** Loads all rules from a filter-list source. Returns the count accepted. */
  public addList(source: FilterListSource): number {
    return this.addRules(source.loadRules());
  }

  /** The number of compiled block rules. */
  public get ruleCount(): number {
    return this.ruleEngine.ruleCount;
  }

  // ------------------------------------------------------- statistics

  /** A snapshot of the current session statistics. */
  public get stats(): ShieldStats {
    return this.counters.snapshot;
  }

  /** Resets all statistics to zero. */
  public resetStats(): void {
    this.counters.reset();
  }

  // ------------------------------------------------------ evaluation

  /**
   * Evaluates a single request against the configured state and rules.
   * Deterministic; safe to call off the UI thread.
   */
  public evaluate(
    request: ShieldRequest,
    context: ShieldContext = { currentSite: null },
  ): ShieldDecision {
    this.counters.recordEvaluated();

    if (request.hostname.length === 0) {
      this.counters.recordAllowed();
      return { kind: 'unknown', matchedRules: [] };
    }

    let enabled = this.enabledState;
    let mode = this.modeState;
    const currentSite = context.currentSite ?? null;
    if (currentSite !== null && currentSite.length > 0) {
      const setting = this.siteSettings.get(normalizeHostname(currentSite));
      if (setting !== undefined) {
        enabled = enabled && setting.enabled;
        mode = setting.mode;
      }
    }

    if (!enabled) {
      this.counters.recordAllowed();
      return { kind: 'allow', matchedRules: [] };
    }

    if (this.isAllowlisted(request.hostname)) {
      this.counters.recordAllowed();
      return { kind: 'allowlisted', matchedRules: [] };
    }

    const activeCategories = categoriesForMode(mode, this.customCategories);
    const matched = this.ruleEngine.evaluate(
      request.hostname,
      activeCategories,
    );
    if (matched.length > 0) {
      this.counters.recordBlock(matched);
      return { kind: 'block', matchedRules: matched };
    }

    this.counters.recordAllowed();
    return { kind: 'allow', matchedRules: [] };
  }
}

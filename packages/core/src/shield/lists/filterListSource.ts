/**
 * Filter-list sources.
 *
 * The Shield never hardcodes a huge third-party list into source code. Hosts
 * provide filter rules through this interface so lists can be loaded later
 * from legally usable sources (correctly licensed / self-generated). This
 * module only defines the contract plus a trivial in-memory implementation.
 *
 * A list must declare its license and provenance so nothing is bundled
 * silently: the Shield will only ever load lists whose license permits the
 * intended use.
 */

import type { FilterRule } from '../types/rule.js';

/** A source of filter rules. */
export interface FilterListSource {
  /** Stable identifier for the list. */
  readonly id: string;
  /** Display name of the list. */
  readonly name: string;
  /** Version of the list contents. */
  readonly version: string;
  /** License that permits using this list in the Shield. */
  readonly license: string;
  /** ISO date (YYYY-MM-DD) the list contents were last updated. */
  readonly updatedAt: string;
  /** Human-readable provenance (where the rules come from). */
  readonly provenance: string;
  /** Returns the rules this source provides. */
  loadRules(): readonly FilterRule[];
}

/** An in-memory list, useful for tests and small user-defined lists. */
export class InMemoryFilterListSource implements FilterListSource {
  public readonly id: string;
  public readonly name: string;
  public readonly version: string;
  public readonly license: string;
  public readonly updatedAt: string;
  public readonly provenance: string;
  private readonly rules: readonly FilterRule[];

  public constructor(options: {
    readonly id: string;
    readonly name: string;
    readonly version: string;
    readonly license: string;
    readonly updatedAt: string;
    readonly provenance: string;
    readonly rules: readonly FilterRule[];
  }) {
    this.id = options.id;
    this.name = options.name;
    this.version = options.version;
    this.license = options.license;
    this.updatedAt = options.updatedAt;
    this.provenance = options.provenance;
    this.rules = options.rules;
  }

  public loadRules(): readonly FilterRule[] {
    return this.rules;
  }
}

/**
 * The status of a filter list loaded into the Shield, as shown to the user.
 *
 * `updatesEnabled` is always `false` in this step: lists are local and are
 * never downloaded automatically. A future list-update feature will extend
 * this contract (checking for and applying licensed updates) without changing
 * how the Shield evaluates rules.
 */
export interface FilterListStatus {
  /** Stable identifier of the list. */
  readonly id: string;
  /** Display name of the list. */
  readonly name: string;
  /** Whether the list's rules are currently active. */
  readonly active: boolean;
  /** The number of rules accepted from this list. */
  readonly rulesLoaded: number;
  /** Version of the list contents. */
  readonly version: string;
  /** License that permits using this list in the Shield. */
  readonly license: string;
  /** ISO date (YYYY-MM-DD) the list contents were last updated. */
  readonly updatedAt: string;
  /** Human-readable provenance (where the rules come from). */
  readonly provenance: string;
  /** Whether this list can be updated automatically (false for local lists). */
  readonly updatesEnabled: false;
}
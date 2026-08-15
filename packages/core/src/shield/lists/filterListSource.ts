/**
 * Filter-list sources.
 *
 * The Shield never hardcodes a huge third-party list into source code. Hosts
 * provide block rules through this interface so lists can be loaded later from
 * legally usable sources (correctly licensed / self-generated). This module
 * only defines the contract plus a trivial in-memory implementation.
 */

import type { BlockRule } from '../types/rule.js';

/** A source of block rules. */
export interface FilterListSource {
  /** Stable identifier for the list. */
  readonly id: string;
  /** Display name of the list. */
  readonly name: string;
  /** Version of the list contents. */
  readonly version: string;
  /** Returns the rules this source provides. */
  loadRules(): readonly BlockRule[];
}

/** An in-memory list, useful for tests and small user-defined lists. */
export class InMemoryFilterListSource implements FilterListSource {
  public readonly id: string;
  public readonly name: string;
  public readonly version: string;
  private readonly rules: readonly BlockRule[];

  public constructor(options: {
    readonly id: string;
    readonly name: string;
    readonly version: string;
    readonly rules: readonly BlockRule[];
  }) {
    this.id = options.id;
    this.name = options.name;
    this.version = options.version;
    this.rules = options.rules;
  }

  public loadRules(): readonly BlockRule[] {
    return this.rules;
  }
}

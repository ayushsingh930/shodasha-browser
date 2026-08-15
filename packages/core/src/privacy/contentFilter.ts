/**
 * Content filtering primitives.
 *
 * SHODASHA's content filtering operates through legitimate browser/network
 * mechanisms (declarative network rules, request interception, and document
 * filtering). This module defines the *contracts* and pure matching logic;
 * it intentionally does not implement blocking yet, per the project roadmap.
 */

/** The category of a filter rule. */
export type FilterCategory =
  'advertising' | 'tracking' | 'social' | 'annoyance';

/** Direction a filter rule applies to. */
export type FilterDirection = 'request' | 'document';

/** A single parsed content-filter rule. */
export interface FilterRule {
  /** The category this rule belongs to. */
  readonly category: FilterCategory;
  /** Direction the rule applies to. */
  readonly direction: FilterDirection;
  /**
   * The raw matcher pattern. Kept opaque on purpose: the engine decides how
   * to interpret patterns (currently a plain substring match).
   */
  readonly pattern: string;
  /** Human-readable source of the rule (e.g. list name + list ID). */
  readonly source: string;
}

/** A named, versioned collection of filter rules. */
export interface FilterList {
  /** Stable identifier for the list. */
  readonly id: string;
  /** Display name of the list. */
  readonly name: string;
  /** Version string of the list contents. */
  readonly version: string;
  /** The rules in this list. */
  readonly rules: readonly FilterRule[];
}

/**
 * Outcome of evaluating a subject against a set of rules.
 */
export interface FilterDecision {
  /** Whether any rule matched. */
  readonly blocked: boolean;
  /** The rule(s) that caused the match, if any. */
  readonly matchedBy: readonly FilterRule[];
}

/**
 * The filter engine contract. Hosts (Electron, future Android WebView)
 * implement this interface by wiring the decisions into their request
 * pipeline.
 */
export interface ContentFilterEngine {
  /**
   * Determine whether a request (e.g. a network request URL) should be
   * blocked.
   */
  shouldBlockRequest(subject: string): FilterDecision;
}

/**
 * Plain-text blocklist parsing.
 *
 * A deliberately minimal format: one domain per line, `#` comments and blank
 * lines ignored. Lines become `domain` rules (matching the domain and its
 * subdomains). Malformed entries are skipped — never thrown — so a bad line
 * cannot create a bypass or break loading.
 */

import { isValidHostname, normalizeHostname } from '../engine/hostname.js';
import type { ShieldCategory } from '../types/category.js';
import type { BlockRule } from '../types/rule.js';

export interface ParseBlocklistOptions {
  /** Category assigned to every parsed rule. Defaults to `'other'`. */
  readonly category?: ShieldCategory;
  /** Source label for the rules. Defaults to `'custom'`. */
  readonly source?: string;
}

/**
 * Parses a plain-text blocklist into {@link BlockRule}s.
 */
export function parseRuleLines(
  text: string,
  options: ParseBlocklistOptions = {},
): BlockRule[] {
  const category = options.category ?? 'other';
  const source = options.source ?? 'custom';
  const rules: BlockRule[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith('#')) {
      continue;
    }
    const value = normalizeHostname(line);
    if (!isValidHostname(value)) {
      continue;
    }
    rules.push({
      id: `${source}:${value}`,
      kind: 'domain',
      category,
      value,
      source,
    });
  }

  return rules;
}

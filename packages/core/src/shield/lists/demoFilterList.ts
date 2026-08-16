/**
 * SHODASHA demo filter list.
 *
 * A small, deterministic, locally-authored list of TEST-only domains used to
 * prove the request → rule match → BLOCK → statistic pipeline end to end.
 *
 * These domains are reserved test names (`.test` TLD, RFC 6761) and do NOT
 * represent real-world advertising or tracking networks. The Shield ships no
 * third-party filter list: real lists must be imported through
 * {@link FilterListSource} with their license, version, provenance, and
 * update date documented (see ARCHITECTURE.md).
 *
 * License: MIT — authored by the SHODASHA project for this repository.
 * Version: 1.0.0 — updated 2026-08-16.
 */

import type { FilterListSource } from './filterListSource.js';
import type { FilterRule } from '../types/rule.js';

/** The demo rules (exported for tests and tooling). */
export const DEMO_FILTER_RULES: readonly FilterRule[] = [
  {
    id: 'demo:ads.test',
    kind: 'domain',
    category: 'ads',
    value: 'ads.test',
    source: 'shodasha-demo-test-list',
    action: 'block',
  },
  {
    id: 'demo:tracker.test',
    kind: 'domain',
    category: 'trackers',
    value: 'tracker.test',
    source: 'shodasha-demo-test-list',
    action: 'block',
  },
  {
    id: 'demo:analytics.test',
    kind: 'domain',
    category: 'trackers',
    value: 'analytics.test',
    source: 'shodasha-demo-test-list',
    action: 'block',
  },
  {
    id: 'demo:social.test',
    kind: 'domain',
    category: 'social-tracking',
    value: 'social.test',
    source: 'shodasha-demo-test-list',
    action: 'block',
  },
];

/** The demo list as a proper {@link FilterListSource}. */
export const demoFilterList: FilterListSource = {
  id: 'shodasha-demo-test-list',
  name: 'SHODASHA Demo Test List',
  version: '1.0.0',
  license: 'MIT (authored by the SHODASHA project; test domains only)',
  updatedAt: '2026-08-16',
  provenance:
    'Reserved .test domains authored in-repository; not a real-world blocking list.',
  loadRules: () => DEMO_FILTER_RULES,
};
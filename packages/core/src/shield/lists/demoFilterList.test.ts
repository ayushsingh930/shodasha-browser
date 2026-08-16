import { describe, expect, it } from 'vitest';
import { demoFilterList, DEMO_FILTER_RULES } from './demoFilterList.js';
import type { FilterRule } from '../types/rule.js';

describe('demoFilterList', () => {
  it('declares its license, version, provenance, and update date', () => {
    expect(demoFilterList.license.length).toBeGreaterThan(0);
    expect(demoFilterList.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(demoFilterList.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(demoFilterList.provenance.length).toBeGreaterThan(0);
    expect(demoFilterList.id).toBe('shodasha-demo-test-list');
  });

  it('provides rules for the documented test domains only', () => {
    const values = new Set(DEMO_FILTER_RULES.map((rule) => rule.value));
    expect(values).toEqual(new Set(['ads.test', 'tracker.test', 'analytics.test', 'social.test']));
  });

  it('produces only block rules with a category and source', () => {
    for (const rule of DEMO_FILTER_RULES) {
      expect(rule.action).toBe('block');
      expect(rule.category).toBeDefined();
      expect(rule.source).toBe('shodasha-demo-test-list');
    }
  });

  it('loads through the FilterListSource contract', () => {
    const loaded = demoFilterList.loadRules();
    expect(loaded).toEqual(DEMO_FILTER_RULES);
    expect(loaded.every((rule: FilterRule) => rule.id.startsWith('demo:'))).toBe(true);
  });
});
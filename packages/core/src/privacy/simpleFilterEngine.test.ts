import { describe, expect, it } from 'vitest';
import { SimpleFilterEngine } from './simpleFilterEngine.js';
import type { FilterList } from './contentFilter.js';

const AD_LIST: FilterList = {
  id: 'test-ads',
  name: 'Test Ads',
  version: '1.0.0',
  rules: [
    {
      category: 'advertising',
      direction: 'request',
      pattern: 'doubleclick.net',
      source: 'test-ads',
    },
    {
      category: 'advertising',
      direction: 'request',
      pattern: 'ads.example.com',
      source: 'test-ads',
    },
  ],
};

describe('SimpleFilterEngine', () => {
  it('blocks a request that matches a rule', () => {
    const engine = new SimpleFilterEngine({ lists: [AD_LIST] });
    const decision = engine.shouldBlockRequest('https://doubleclick.net/foo');
    expect(decision.blocked).toBe(true);
    expect(decision.matchedBy).toHaveLength(1);
  });

  it('matches case-insensitively', () => {
    const engine = new SimpleFilterEngine({ lists: [AD_LIST] });
    expect(engine.shouldBlockRequest('https://ADS.example.com/x').blocked).toBe(
      true,
    );
  });

  it('allows requests that match no rule', () => {
    const engine = new SimpleFilterEngine({ lists: [AD_LIST] });
    const decision = engine.shouldBlockRequest('https://example.org/clean');
    expect(decision.blocked).toBe(false);
    expect(decision.matchedBy).toHaveLength(0);
  });

  it('counts compiled rules', () => {
    const engine = new SimpleFilterEngine({ lists: [AD_LIST] });
    expect(engine.ruleCount).toBe(2);
  });

  it('works with no lists', () => {
    const engine = new SimpleFilterEngine();
    expect(engine.ruleCount).toBe(0);
    expect(engine.shouldBlockRequest('https://anything.example').blocked).toBe(
      false,
    );
  });
});

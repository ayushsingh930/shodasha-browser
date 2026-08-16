import { describe, expect, it } from 'vitest';
import type { BlockRule } from '../types/rule.js';
import { emptyShieldStats, ShieldStatsCounter } from './shieldStats.js';

function rule(category: BlockRule['category']): BlockRule {
  return {
    id: `r-${category}`,
    kind: 'domain',
    category,
    value: `example-${category}.com`,
    source: 'test',
  };
}

describe('ShieldStatsCounter', () => {
  it('starts at zero', () => {
    expect(emptyShieldStats()).toEqual({
      requestsEvaluated: 0,
      requestsBlocked: 0,
      requestsAllowed: 0,
      trackersBlocked: 0,
      adsFiltered: 0,
    });
  });

  it('records evaluated and allowed counts', () => {
    const counter = new ShieldStatsCounter();
    counter.recordEvaluated();
    counter.recordAllowed();
    expect(counter.snapshot.requestsEvaluated).toBe(1);
    expect(counter.snapshot.requestsAllowed).toBe(1);
    expect(counter.snapshot.requestsBlocked).toBe(0);
  });

  it('records blocked and ads counts', () => {
    const counter = new ShieldStatsCounter();
    counter.recordEvaluated();
    counter.recordBlock([rule('ads')]);
    expect(counter.snapshot.requestsBlocked).toBe(1);
    expect(counter.snapshot.adsFiltered).toBe(1);
    expect(counter.snapshot.trackersBlocked).toBe(0);
  });

  it('records tracker and social-tracking counts', () => {
    const counter = new ShieldStatsCounter();
    counter.recordBlock([rule('trackers')]);
    counter.recordBlock([rule('social-tracking')]);
    expect(counter.snapshot.trackersBlocked).toBe(2);
  });

  it('counts a mixed-category block once per counter', () => {
    const counter = new ShieldStatsCounter();
    counter.recordBlock([rule('ads'), rule('trackers')]);
    expect(counter.snapshot.requestsBlocked).toBe(1);
    expect(counter.snapshot.adsFiltered).toBe(1);
    expect(counter.snapshot.trackersBlocked).toBe(1);
  });

  it('reset zeroes all counters', () => {
    const counter = new ShieldStatsCounter();
    counter.recordEvaluated();
    counter.recordBlock([rule('ads')]);
    counter.reset();
    expect(counter.snapshot).toEqual(emptyShieldStats());
  });

  it('returns a snapshot that cannot mutate internal state', () => {
    const counter = new ShieldStatsCounter();
    counter.recordEvaluated();
    const snapshot = counter.snapshot;
    expect(counter.snapshot.requestsEvaluated).toBe(1);
    expect(snapshot).toEqual(counter.snapshot);
  });

  it('tracks per-site counters for the current site only', () => {
    const counter = new ShieldStatsCounter();
    counter.recordEvaluated('example.com');
    counter.recordBlock([rule('ads')], 'example.com');
    counter.recordAllowed('example.com');
    counter.recordEvaluated('other-site.org');
    expect(counter.snapshotForSite('example.com')).toEqual({
      requestsEvaluated: 1,
      requestsBlocked: 1,
      requestsAllowed: 1,
    });
    expect(counter.snapshotForSite('other-site.org').requestsEvaluated).toBe(1);
    expect(counter.snapshotForSite('unvisited.net')).toEqual({
      requestsEvaluated: 0,
      requestsBlocked: 0,
      requestsAllowed: 0,
    });
  });

  it('ignores site counters when no site is provided', () => {
    const counter = new ShieldStatsCounter();
    counter.recordEvaluated();
    counter.recordAllowed();
    expect(counter.snapshot.requestsEvaluated).toBe(1);
    expect(counter.snapshotForSite('example.com').requestsEvaluated).toBe(0);
  });

  it('reset clears per-site counters too', () => {
    const counter = new ShieldStatsCounter();
    counter.recordEvaluated('example.com');
    counter.reset();
    expect(counter.snapshotForSite('example.com').requestsEvaluated).toBe(0);
  });
});

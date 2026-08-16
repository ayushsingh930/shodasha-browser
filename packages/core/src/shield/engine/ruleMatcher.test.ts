import { describe, expect, it } from 'vitest';
import type { BlockRule, FilterRule } from '../types/rule.js';
import { RuleEngine } from './ruleMatcher.js';

function domainRule(id: string, value: string, category: string = 'ads'): BlockRule {
  return {
    id,
    kind: 'domain',
    category: category as BlockRule['category'],
    value,
    source: 'test',
  };
}

function scopedRule(
  id: string,
  value: string,
  scope: Partial<FilterRule>,
): FilterRule {
  return { id, kind: 'domain', category: 'ads', value, source: 'test', ...scope };
}

function hostnameRule(id: string, value: string, category: string = 'ads'): BlockRule {
  return {
    id,
    kind: 'hostname',
    category: category as BlockRule['category'],
    value,
    source: 'test',
  };
}

const ALL: ReadonlySet<BlockRule['category']> = new Set([
  'ads',
  'trackers',
  'social-tracking',
  'malicious-domains',
  'other',
]);

describe('RuleEngine', () => {
  it('matches a domain rule against the exact hostname', () => {
    const engine = new RuleEngine([domainRule('r1', 'example.com')]);
    expect(engine.evaluate('example.com', ALL)).toHaveLength(1);
  });

  it('matches a domain rule against a subdomain', () => {
    const engine = new RuleEngine([domainRule('r1', 'example.com')]);
    expect(engine.evaluate('ads.example.com', ALL)).toHaveLength(1);
    expect(engine.evaluate('a.b.example.com', ALL)).toHaveLength(1);
  });

  it('does not match a domain rule against a suffix impostor', () => {
    const engine = new RuleEngine([domainRule('r1', 'example.com')]);
    expect(engine.evaluate('notexample.com', ALL)).toHaveLength(0);
    expect(engine.evaluate('example.com.evil.com', ALL)).toHaveLength(0);
  });

  it('matches a hostname rule exactly', () => {
    const engine = new RuleEngine([hostnameRule('r1', 'ads.example.com')]);
    expect(engine.evaluate('ads.example.com', ALL)).toHaveLength(1);
    expect(engine.evaluate('sub.ads.example.com', ALL)).toHaveLength(0);
    expect(engine.evaluate('example.com', ALL)).toHaveLength(0);
  });

  it('matches case-insensitively', () => {
    const engine = new RuleEngine([domainRule('r1', 'example.com')]);
    expect(engine.evaluate('EXAMPLE.COM', ALL)).toHaveLength(1);
  });

  it('respects the active categories', () => {
    const engine = new RuleEngine([
      domainRule('r1', 'ads.example.com', 'ads'),
      domainRule('r2', 'track.example.com', 'trackers'),
    ]);
    const onlyTrackers: ReadonlySet<BlockRule['category']> = new Set(['trackers']);
    const matched = engine.evaluate('track.example.com', onlyTrackers);
    expect(matched.map((r) => r.id)).toEqual(['r2']);
  });

  it('does not match when the category is inactive', () => {
    const engine = new RuleEngine([domainRule('r1', 'ads.example.com', 'ads')]);
    expect(engine.evaluate('ads.example.com', new Set())).toHaveLength(0);
  });

  it('returns a deterministic order (longest suffix first)', () => {
    const engine = new RuleEngine([
      domainRule('parent', 'example.com'),
      domainRule('sub', 'ads.example.com'),
    ]);
    expect(engine.evaluate('sub.ads.example.com', ALL).map((r) => r.id)).toEqual([
      'sub',
      'parent',
    ]);
  });

  it('deduplicates a rule matched by multiple paths', () => {
    const engine = new RuleEngine([domainRule('r1', 'example.com')]);
    expect(engine.evaluate('example.com', ALL)).toHaveLength(1);
  });

  it('drops invalid rule values at add time', () => {
    const engine = new RuleEngine([
      domainRule('good', 'example.com'),
      domainRule('bad', 'https://example.com'),
      hostnameRule('bad2', 'foo/bar'),
    ]);
    expect(engine.ruleCount).toBe(1);
    expect(engine.evaluate('example.com', ALL)).toHaveLength(1);
  });

  it('reports the accepted count from add()', () => {
    const engine = new RuleEngine();
    expect(
      engine.add([
        domainRule('good', 'example.com'),
        domainRule('bad', '*.example.com'),
      ]),
    ).toBe(1);
  });

  it('matches IP address rules', () => {
    const engine = new RuleEngine([domainRule('r1', '192.168.0.1')]);
    expect(engine.evaluate('192.168.0.1', ALL)).toHaveLength(1);
  });

  it('matches localhost rules', () => {
    const engine = new RuleEngine([domainRule('r1', 'localhost')]);
    expect(engine.evaluate('localhost', ALL)).toHaveLength(1);
  });

  it('matches a resource-type-scoped rule only for that type', () => {
    const engine = new RuleEngine([
      scopedRule('r1', 'ads.example.com', { resourceTypes: ['script'] }),
    ]);
    expect(
      engine.evaluate('ads.example.com', ALL, { resourceType: 'script', party: undefined }),
    ).toHaveLength(1);
    expect(
      engine.evaluate('ads.example.com', ALL, { resourceType: 'image', party: undefined }),
    ).toHaveLength(0);
    expect(
      engine.evaluate('ads.example.com', ALL, { resourceType: undefined, party: undefined }),
    ).toHaveLength(0);
  });

  it('matches a party-scoped rule only for that party', () => {
    const engine = new RuleEngine([
      scopedRule('r1', 'ads.example.com', { party: 'third-party' }),
    ]);
    expect(
      engine.evaluate('ads.example.com', ALL, {
        resourceType: 'image',
        party: 'third-party',
      }),
    ).toHaveLength(1);
    expect(
      engine.evaluate('ads.example.com', ALL, {
        resourceType: 'image',
        party: 'first-party',
      }),
    ).toHaveLength(0);
  });

  it('never matches a party-scoped rule when the party is unknown', () => {
    const engine = new RuleEngine([
      scopedRule('r1', 'ads.example.com', { party: 'third-party' }),
      scopedRule('r2', 'cdn.example.com', { party: 'first-party' }),
    ]);
    expect(
      engine.evaluate('ads.example.com', ALL, { resourceType: 'image', party: undefined }),
    ).toHaveLength(0);
    expect(
      engine.evaluate('cdn.example.com', ALL, { resourceType: 'image', party: undefined }),
    ).toHaveLength(0);
  });

  it('skips disabled rules', () => {
    const engine = new RuleEngine([
      scopedRule('r1', 'ads.example.com', { enabled: false }),
      domainRule('r2', 'track.example.com'),
    ]);
    expect(engine.evaluate('ads.example.com', ALL)).toHaveLength(0);
    expect(engine.evaluate('track.example.com', ALL)).toHaveLength(1);
  });

  it('keeps allow and block rules distinct in results', () => {
    const engine = new RuleEngine([
      scopedRule('allow-r1', 'ads.example.com', { action: 'allow' }),
      domainRule('block-r1', 'ads.example.com'),
    ]);
    const matched = engine.evaluate('ads.example.com', ALL);
    expect(matched.map((r) => r.id)).toEqual(['allow-r1', 'block-r1']);
  });

  it('drops rules with an invalid resource-type scope', () => {
    const engine = new RuleEngine([
      scopedRule('bad', 'ads.example.com', { resourceTypes: ['bogus' as 'script'] }),
      domainRule('good', 'track.example.com'),
    ]);
    expect(engine.ruleCount).toBe(1);
  });

  it('drops rules with an invalid party scope', () => {
    const engine = new RuleEngine([
      scopedRule('bad', 'ads.example.com', { party: 'sideways' as 'third-party' }),
    ]);
    expect(engine.ruleCount).toBe(0);
  });
});

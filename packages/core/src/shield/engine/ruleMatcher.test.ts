import { describe, expect, it } from 'vitest';
import type { BlockRule } from '../types/rule.js';
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
});

import { describe, expect, it } from 'vitest';
import { InMemoryFilterListSource } from './lists/filterListSource.js';
import { categoriesForMode, ShieldEngine } from './shieldEngine.js';
import type { BlockRule } from './types/rule.js';
import type { ShieldRequest } from './types/request.js';

function rule(
  id: string,
  value: string,
  category: BlockRule['category'] = 'ads',
  kind: BlockRule['kind'] = 'domain',
): BlockRule {
  return { id, kind, category, value, source: 'test' };
}

function request(url: string, extra: Partial<ShieldRequest> = {}): ShieldRequest {
  const hostname = new URL(url).hostname.toLowerCase();
  return {
    id: `req-${hostname}`,
    url,
    hostname,
    origin: `${new URL(url).protocol}//${hostname}`,
    firstPartyOrigin: null,
    resourceType: 'xhr',
    method: 'GET',
    timestamp: 0,
    tabId: null,
    ...extra,
  };
}

const ADS = [rule('ad-doubleclick', 'doubleclick.net')];
const TRACKERS = [rule('trk-analytics', 'analytics.example.com', 'trackers')];
const OTHER = [rule('other-custom', 'custom.example.org', 'other')];

describe('categoriesForMode', () => {
  it('standard mode blocks core categories but not other', () => {
    const active = categoriesForMode('standard', new Set());
    expect(active.has('ads')).toBe(true);
    expect(active.has('trackers')).toBe(true);
    expect(active.has('social-tracking')).toBe(true);
    expect(active.has('malicious-domains')).toBe(true);
    expect(active.has('other')).toBe(false);
  });

  it('strict mode includes the other category', () => {
    const active = categoriesForMode('strict', new Set());
    expect(active.has('other')).toBe(true);
  });

  it('custom mode returns the user set', () => {
    const custom = new Set<BlockRule['category']>(['ads']);
    expect(categoriesForMode('custom', custom)).toBe(custom);
  });
});

describe('ShieldEngine decisions', () => {
  it('ALLOWs a request that matches no rule', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    expect(engine.evaluate(request('https://example.com/clean')).kind).toBe('allow');
  });

  it('BLOCKs a request that matches an active rule', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    const decision = engine.evaluate(request('https://doubleclick.net/x'));
    expect(decision.kind).toBe('block');
    expect(decision.matchedRules.map((r) => r.id)).toEqual(['ad-doubleclick']);
  });

  it('BLOCKs a request for a subdomain of a blocked domain', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    expect(engine.evaluate(request('https://ads.doubleclick.net/x')).kind).toBe('block');
  });

  it('gives the allowlist priority over blocking rules', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    expect(engine.addAllowlist('doubleclick.net')).toBe(true);
    const decision = engine.evaluate(request('https://doubleclick.net/x'));
    expect(decision.kind).toBe('allowlisted');
    expect(decision.matchedRules).toHaveLength(0);
  });

  it('allowlist covers subdomains', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    engine.addAllowlist('doubleclick.net');
    expect(engine.evaluate(request('https://cdn.doubleclick.net/x')).kind).toBe(
      'allowlisted',
    );
  });

  it('rejects an invalid allowlist entry', () => {
    const engine = new ShieldEngine();
    expect(engine.addAllowlist('https://example.com')).toBe(false);
    expect(engine.allowlist).toHaveLength(0);
  });

  it('returns UNKNOWN for an unclassifiable request', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    const decision = engine.evaluate({ ...request('https://example.com'), hostname: '' });
    expect(decision.kind).toBe('unknown');
    expect(decision.matchedRules).toHaveLength(0);
  });
});

describe('ShieldEngine enable/disable', () => {
  it('is enabled by default', () => {
    expect(new ShieldEngine().enabled).toBe(true);
  });

  it('does not block when disabled', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    engine.setEnabled(false);
    const decision = engine.evaluate(request('https://doubleclick.net/x'));
    expect(decision.kind).toBe('allow');
  });

  it('enables again after being disabled', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    engine.setEnabled(false);
    engine.setEnabled(true);
    expect(engine.evaluate(request('https://doubleclick.net/x')).kind).toBe('block');
  });
});

describe('ShieldEngine per-site state', () => {
  it('does not block when the current site has the shield off', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    engine.setSiteSetting('example.com', { enabled: false });
    const decision = engine.evaluate(request('https://doubleclick.net/x'), {
      currentSite: 'example.com',
    });
    expect(decision.kind).toBe('allow');
  });

  it('blocks when the current site has the shield on', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    engine.setSiteSetting('example.com', { enabled: true });
    expect(
      engine.evaluate(request('https://doubleclick.net/x'), {
        currentSite: 'example.com',
      }).kind,
    ).toBe('block');
  });

  it('applies the per-site mode override', () => {
    const engine = new ShieldEngine();
    engine.addRules(OTHER);
    engine.setSiteSetting('example.com', { mode: 'strict' });
    expect(
      engine.evaluate(request('https://custom.example.org/x'), {
        currentSite: 'example.com',
      }).kind,
    ).toBe('block');
    expect(
      engine.evaluate(request('https://custom.example.org/x'), {
        currentSite: 'other-site.com',
      }).kind,
    ).toBe('allow');
  });

  it('defaults site settings to enabled + global mode', () => {
    const engine = new ShieldEngine();
    expect(engine.isSiteEnabled('example.com')).toBe(true);
    expect(engine.getSiteSetting('example.com')).toEqual({
      enabled: true,
      mode: 'standard',
    });
  });

  it('removes an explicit site setting', () => {
    const engine = new ShieldEngine();
    engine.setSiteSetting('example.com', { enabled: false });
    expect(engine.isSiteEnabled('example.com')).toBe(false);
    engine.removeSiteSetting('example.com');
    expect(engine.isSiteEnabled('example.com')).toBe(true);
  });

  it('a global disable overrides a per-site enable', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    engine.setEnabled(false);
    engine.setSiteSetting('example.com', { enabled: true });
    expect(
      engine.evaluate(request('https://doubleclick.net/x'), {
        currentSite: 'example.com',
      }).kind,
    ).toBe('allow');
  });
});

describe('ShieldEngine modes', () => {
  it('standard mode does not block other-category rules', () => {
    const engine = new ShieldEngine();
    engine.addRules(OTHER);
    engine.setMode('standard');
    expect(engine.evaluate(request('https://custom.example.org/x')).kind).toBe('allow');
  });

  it('strict mode blocks other-category rules', () => {
    const engine = new ShieldEngine();
    engine.addRules(OTHER);
    engine.setMode('strict');
    expect(engine.evaluate(request('https://custom.example.org/x')).kind).toBe('block');
  });

  it('custom mode blocks only the enabled categories', () => {
    const engine = new ShieldEngine();
    engine.addRules(TRACKERS);
    engine.addRules(ADS);
    engine.setMode('custom');
    engine.setCategoryEnabled('ads', false);
    engine.setCategoryEnabled('trackers', true);
    expect(engine.evaluate(request('https://analytics.example.com/x')).kind).toBe(
      'block',
    );
    expect(engine.evaluate(request('https://doubleclick.net/x')).kind).toBe('allow');
  });
});

describe('ShieldEngine matching edge cases', () => {
  it('matches uppercase hostnames', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    expect(engine.evaluate(request('https://DOUBLECLICK.NET/x')).kind).toBe('block');
  });

  it('ignores ports, query strings, and fragments when matching', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    expect(engine.evaluate(request('https://doubleclick.net:8443/x?q=1#frag')).kind).toBe(
      'block',
    );
  });

  it('matches IP address block rules', () => {
    const engine = new ShieldEngine();
    engine.addRules([rule('ip', '192.168.0.1')]);
    expect(engine.evaluate(request('https://192.168.0.1/path')).kind).toBe('block');
  });

  it('matches localhost block rules', () => {
    const engine = new ShieldEngine();
    engine.addRules([rule('lh', 'localhost')]);
    expect(engine.evaluate(request('http://localhost/x')).kind).toBe('block');
  });

  it('handles a malformed request URL hostname gracefully', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    expect(() => engine.evaluate(request('https://doubleclick.net/x'))).not.toThrow();
  });
});

describe('ShieldEngine blocklists', () => {
  it('loads rules from a filter-list source', () => {
    const engine = new ShieldEngine();
    const accepted = engine.addList(
      new InMemoryFilterListSource({
        id: 'test-ads',
        name: 'Test Ads',
        version: '1.0.0',
        rules: ADS,
      }),
    );
    expect(accepted).toBe(1);
    expect(engine.ruleCount).toBe(1);
    expect(engine.evaluate(request('https://doubleclick.net/x')).kind).toBe('block');
  });

  it('drops invalid rules from a list', () => {
    const engine = new ShieldEngine();
    const accepted = engine.addRules([rule('bad', 'https://example.com')]);
    expect(accepted).toBe(0);
    expect(engine.ruleCount).toBe(0);
  });
});

describe('ShieldEngine statistics', () => {
  it('records evaluated, blocked, allowed, trackers, and ads', () => {
    const engine = new ShieldEngine();
    engine.addRules([...ADS, ...TRACKERS]);
    engine.evaluate(request('https://doubleclick.net/1'));
    engine.evaluate(request('https://analytics.example.com/1'));
    engine.evaluate(request('https://example.com/ok'));
    const stats = engine.stats;
    expect(stats.requestsEvaluated).toBe(3);
    expect(stats.requestsBlocked).toBe(2);
    expect(stats.requestsAllowed).toBe(1);
    expect(stats.adsFiltered).toBe(1);
    expect(stats.trackersBlocked).toBe(1);
  });

  it('counts allowlisted requests as evaluated + allowed', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    engine.addAllowlist('doubleclick.net');
    engine.evaluate(request('https://doubleclick.net/x'));
    const stats = engine.stats;
    expect(stats.requestsEvaluated).toBe(1);
    expect(stats.requestsAllowed).toBe(1);
    expect(stats.requestsBlocked).toBe(0);
  });

  it('counts unclassifiable requests as evaluated + allowed', () => {
    const engine = new ShieldEngine();
    engine.evaluate({ ...request('https://example.com'), hostname: '' });
    expect(engine.stats.requestsEvaluated).toBe(1);
    expect(engine.stats.requestsAllowed).toBe(1);
    expect(engine.stats.requestsBlocked).toBe(0);
  });

  it('counts disabled-shield requests as allowed, not blocked', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    engine.setEnabled(false);
    engine.evaluate(request('https://doubleclick.net/x'));
    expect(engine.stats.requestsBlocked).toBe(0);
    expect(engine.stats.requestsAllowed).toBe(1);
  });

  it('starts at zero and can be reset', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    expect(engine.stats.requestsEvaluated).toBe(0);
    engine.evaluate(request('https://doubleclick.net/x'));
    expect(engine.stats.requestsEvaluated).toBe(1);
    engine.resetStats();
    expect(engine.stats.requestsEvaluated).toBe(0);
  });
});

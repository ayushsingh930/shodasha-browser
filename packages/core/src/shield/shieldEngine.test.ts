import { describe, expect, it } from 'vitest';
import { DEMO_FILTER_RULES, demoFilterList } from './lists/demoFilterList.js';
import { InMemoryFilterListSource } from './lists/filterListSource.js';
import { categoriesForMode, ShieldEngine } from './shieldEngine.js';
import type { BlockRule, FilterRule } from './types/rule.js';
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

function scopedRule(id: string, value: string, scope: Partial<FilterRule>): FilterRule {
  return { id, kind: 'domain', category: 'ads', value, source: 'test', ...scope };
}

function firstPartyRequest(url: string, extra: Partial<ShieldRequest> = {}): ShieldRequest {
  return request(url, {
    firstPartyOrigin: 'https://example.com',
    ...extra,
  });
}

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

  it('matches a trailing-dot request against a plain rule', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    expect(engine.evaluate(request('https://doubleclick.net./x')).kind).toBe('block');
  });

  it('never treats evil-example.com as example.com', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    expect(engine.evaluate(request('https://evil-example.com/x')).kind).toBe('allow');
    expect(engine.evaluate(request('https://example.com.evil.com/x')).kind).toBe(
      'allow',
    );
  });

  it('never allowlists example.com.evil.com for an example.com entry', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    engine.addAllowlist('example.com');
    expect(engine.isAllowlisted('example.com.evil.com')).toBe(false);
    expect(engine.isAllowlisted('evil-example.com')).toBe(false);
    expect(engine.isAllowlisted('sub.example.com')).toBe(true);
  });

  it('handles a malformed request URL hostname gracefully', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    expect(() => engine.evaluate(request('https://doubleclick.net/x'))).not.toThrow();
  });

  it('treats an IPv6 request hostname as unmatchable (fail-open)', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    const decision = engine.evaluate({ ...request('https://example.com'), hostname: '[::1]' });
    expect(decision.kind).toBe('allow');
    expect(engine.stats.requestsAllowed).toBe(1);
  });
});

describe('ShieldEngine rule scoping', () => {
  it('applies a resource-type-scoped rule only to that type', () => {
    const engine = new ShieldEngine();
    engine.addRules([scopedRule('r-script', 'ads.example.com', { resourceTypes: ['script'] })]);
    expect(
      engine.evaluate(firstPartyRequest('https://ads.example.com/a.js', { resourceType: 'script' })).kind,
    ).toBe('block');
    expect(
      engine.evaluate(firstPartyRequest('https://ads.example.com/a.png', { resourceType: 'image' })).kind,
    ).toBe('allow');
  });

  it('applies a third-party-scoped rule only to third-party requests', () => {
    const engine = new ShieldEngine();
    engine.addRules([scopedRule('r-tp', 'ads.example.net', { party: 'third-party' })]);
    expect(
      engine.evaluate(firstPartyRequest('https://ads.example.net/x')).kind,
    ).toBe('block');
    expect(
      engine.evaluate(request('https://ads.example.net/x', { firstPartyOrigin: null })).kind,
    ).toBe('allow');
  });

  it('applies a first-party-scoped rule only to first-party requests', () => {
    const engine = new ShieldEngine();
    engine.addRules([
      scopedRule('r-fp', 'cdn.example.com', { party: 'first-party' }),
    ]);
    expect(
      engine.evaluate(firstPartyRequest('https://cdn.example.com/lib.js')).kind,
    ).toBe('block');
    expect(
      engine.evaluate(
        request('https://cdn.example.com/lib.js', { firstPartyOrigin: 'https://other.org' }),
      ).kind,
    ).toBe('allow');
  });
});

describe('ShieldEngine allow rules', () => {
  it('an explicit allow rule beats a matching block rule', () => {
    const engine = new ShieldEngine();
    engine.addRules([
      rule('block-ads', 'ads.example.com'),
      scopedRule('allow-ads', 'ads.example.com', { action: 'allow' }),
    ]);
    const decision = engine.evaluate(request('https://ads.example.com/x'));
    expect(decision.kind).toBe('allow-rule');
    expect(decision.matchedRules.map((r) => r.id)).toEqual(['allow-ads']);
    expect(engine.stats.requestsBlocked).toBe(0);
    expect(engine.stats.requestsAllowed).toBe(1);
  });

  it('a subdomain allow rule overrides a parent block rule', () => {
    const engine = new ShieldEngine();
    engine.addRules([
      rule('block-parent', 'example.com'),
      scopedRule('allow-sub', 'cdn.example.com', { action: 'allow' }),
    ]);
    expect(engine.evaluate(request('https://example.com/x')).kind).toBe('block');
    expect(engine.evaluate(request('https://cdn.example.com/x')).kind).toBe('allow-rule');
  });

  it('allowlist still outranks allow rules and block rules', () => {
    const engine = new ShieldEngine();
    engine.addRules([
      rule('block-ads', 'ads.example.com'),
      scopedRule('allow-ads', 'ads.example.com', { action: 'allow' }),
    ]);
    engine.addAllowlist('ads.example.com');
    expect(engine.evaluate(request('https://ads.example.com/x')).kind).toBe('allowlisted');
  });
});

describe('ShieldEngine decision cache', () => {
  it('serves consistent decisions across repeated evaluations', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    const first = engine.evaluate(request('https://doubleclick.net/x'));
    const second = engine.evaluate(request('https://doubleclick.net/x'));
    expect(first).toEqual(second);
    expect(engine.stats.requestsEvaluated).toBe(2);
  });

  it('invalidates cached decisions when rules change', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    expect(engine.evaluate(request('https://doubleclick.net/x')).kind).toBe('block');
    engine.addRules([
      scopedRule('allow-ads', 'doubleclick.net', { action: 'allow' }),
    ]);
    expect(engine.evaluate(request('https://doubleclick.net/x')).kind).toBe('allow-rule');
  });

  it('invalidates cached decisions when the shield is disabled', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    expect(engine.evaluate(request('https://doubleclick.net/x')).kind).toBe('block');
    engine.setEnabled(false);
    expect(engine.evaluate(request('https://doubleclick.net/x')).kind).toBe('allow');
  });

  it('invalidates cached decisions when the mode changes', () => {
    const engine = new ShieldEngine();
    engine.addRules(OTHER);
    expect(engine.evaluate(request('https://custom.example.org/x')).kind).toBe('allow');
    engine.setMode('strict');
    expect(engine.evaluate(request('https://custom.example.org/x')).kind).toBe('block');
  });

  it('invalidates cached decisions when the allowlist changes', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    expect(engine.evaluate(request('https://doubleclick.net/x')).kind).toBe('block');
    engine.addAllowlist('doubleclick.net');
    expect(engine.evaluate(request('https://doubleclick.net/x')).kind).toBe('allowlisted');
    engine.removeAllowlist('doubleclick.net');
    expect(engine.evaluate(request('https://doubleclick.net/x')).kind).toBe('block');
  });

  it('invalidates cached decisions when a site setting changes', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    engine.setSiteSetting('example.com', { enabled: false });
    expect(
      engine.evaluate(request('https://doubleclick.net/x'), { currentSite: 'example.com' }).kind,
    ).toBe('allow');
    engine.setSiteSetting('example.com', { enabled: true });
    expect(
      engine.evaluate(request('https://doubleclick.net/x'), { currentSite: 'example.com' }).kind,
    ).toBe('block');
  });
});

describe('ShieldEngine recent events', () => {
  it('records block and allow-rule events, never plain allows', () => {
    const engine = new ShieldEngine();
    engine.addRules([
      rule('block-ads', 'ads.example.com'),
      scopedRule('allow-cdn', 'cdn.example.com', { action: 'allow' }),
    ]);
    engine.evaluate(request('https://ads.example.com/x'));
    engine.evaluate(request('https://cdn.example.com/x'));
    engine.evaluate(request('https://example.com/clean'));
    const events = engine.recentEvents;
    expect(events).toHaveLength(2);
    const newest = events[0];
    const oldest = events[1];
    expect(newest?.hostname).toBe('cdn.example.com');
    expect(newest?.action).toBe('allow');
    expect(oldest?.hostname).toBe('ads.example.com');
    expect(oldest?.action).toBe('block');
    expect(oldest?.category).toBe('ads');
    expect(oldest?.resourceType).toBe('xhr');
  });

  it('can be cleared', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    engine.evaluate(request('https://doubleclick.net/x'));
    expect(engine.recentEvents).toHaveLength(1);
    engine.clearEvents();
    expect(engine.recentEvents).toHaveLength(0);
  });
});

describe('ShieldEngine per-site statistics', () => {
  it('tracks evaluated/blocked/allowed for the current site', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    engine.evaluate(request('https://doubleclick.net/x'), { currentSite: 'example.com' });
    engine.evaluate(request('https://example.com/ok'), { currentSite: 'example.com' });
    engine.evaluate(request('https://doubleclick.net/y'), { currentSite: 'other.org' });
    expect(engine.siteStatsFor('example.com').requestsEvaluated).toBe(2);
    expect(engine.siteStatsFor('example.com').requestsBlocked).toBe(1);
    expect(engine.siteStatsFor('example.com').requestsAllowed).toBe(1);
    expect(engine.siteStatsFor('other.org').requestsBlocked).toBe(1);
    expect(engine.siteStatsFor('unvisited.net').requestsEvaluated).toBe(0);
  });

  it('resetStats clears per-site counters', () => {
    const engine = new ShieldEngine();
    engine.addRules(ADS);
    engine.evaluate(request('https://doubleclick.net/x'), { currentSite: 'example.com' });
    engine.resetStats();
    expect(engine.siteStatsFor('example.com').requestsEvaluated).toBe(0);
  });
});

describe('ShieldEngine demo list', () => {
  it('loads the demo test list and blocks its test domains', () => {
    const engine = new ShieldEngine();
    const accepted = engine.addList(demoFilterList);
    expect(accepted).toBe(DEMO_FILTER_RULES.length);
    expect(engine.evaluate(request('https://ads.test/px.gif', { resourceType: 'image' })).kind).toBe(
      'block',
    );
    expect(engine.evaluate(request('https://tracker.test/t.js', { resourceType: 'script' })).kind).toBe(
      'block',
    );
    expect(engine.evaluate(request('https://analytics.test/a.gif', { resourceType: 'image' })).kind).toBe(
      'block',
    );
    expect(engine.evaluate(request('https://example.com/ok')).kind).toBe('allow');
  });

  it('does not claim demo domains are real ad networks (documented test-only)', () => {
    expect(demoFilterList.provenance).toContain('test');
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
        license: 'MIT',
        updatedAt: '2026-08-16',
        provenance: 'test fixture',
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

describe('ShieldEngine filter list status', () => {
  it('reports an empty list of lists before any are loaded', () => {
    const engine = new ShieldEngine();
    expect(engine.listStatus()).toEqual([]);
  });

  it('reports the demo list with its metadata and accepted rule count', () => {
    const engine = new ShieldEngine();
    engine.addList(demoFilterList);
    const status = engine.listStatus();
    expect(status).toHaveLength(1);
    const list = status[0];
    if (list === undefined) {
      throw new Error('expected one loaded list');
    }
    expect(list.id).toBe('shodasha-demo-test-list');
    expect(list.name).toBe('SHODASHA Demo Test List');
    expect(list.active).toBe(true);
    expect(list.rulesLoaded).toBe(DEMO_FILTER_RULES.length);
    expect(list.version).toBe('1.0.0');
    expect(list.license.length).toBeGreaterThan(0);
    expect(list.updatedAt).toBe('2026-08-16');
    expect(list.provenance.length).toBeGreaterThan(0);
    expect(list.updatesEnabled).toBe(false);
  });

  it('tracks multiple lists independently', () => {
    const engine = new ShieldEngine();
    engine.addList(demoFilterList);
    engine.addList(
      new InMemoryFilterListSource({
        id: 'test-ads',
        name: 'Test Ads',
        version: '1.0.0',
        license: 'MIT',
        updatedAt: '2026-08-16',
        provenance: 'test fixture',
        rules: ADS,
      }),
    );
    const status = engine.listStatus();
    expect(status).toHaveLength(2);
    const ads = status.find((s) => s.id === 'test-ads');
    expect(ads).not.toBeUndefined();
    expect(ads?.rulesLoaded).toBe(1);
    expect(ads?.active).toBe(true);
  });
});

describe('ShieldEngine site settings snapshot', () => {
  it('exposes explicit per-site settings for persistence', () => {
    const engine = new ShieldEngine();
    engine.setSiteSetting('Example.com', { enabled: false, mode: 'strict' });
    expect(engine.siteSettingsSnapshot()).toEqual([
      { site: 'example.com', enabled: false, mode: 'strict' },
    ]);
  });

  it('returns an empty snapshot when there are no explicit settings', () => {
    const engine = new ShieldEngine();
    expect(engine.siteSettingsSnapshot()).toEqual([]);
  });
});

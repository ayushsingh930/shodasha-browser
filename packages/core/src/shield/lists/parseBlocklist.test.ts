import { describe, expect, it } from 'vitest';
import { parseRuleLines } from './parseBlocklist.js';

describe('parseRuleLines', () => {
  it('parses one domain per line', () => {
    const rules = parseRuleLines('example.com\nads.example.net\n');
    expect(rules.map((r) => r.value)).toEqual(['example.com', 'ads.example.net']);
  });

  it('skips comments and blank lines', () => {
    const rules = parseRuleLines('# header\nexample.com\n\n# trailing\n');
    expect(rules).toHaveLength(1);
    expect(rules[0]?.value).toBe('example.com');
  });

  it('defaults category to other and source to custom', () => {
    const rules = parseRuleLines('example.com');
    expect(rules[0]?.category).toBe('other');
    expect(rules[0]?.source).toBe('custom');
    expect(rules[0]?.kind).toBe('domain');
  });

  it('applies the configured category and source', () => {
    const rules = parseRuleLines('example.com', {
      category: 'ads',
      source: 'my-ads',
    });
    expect(rules[0]?.category).toBe('ads');
    expect(rules[0]?.source).toBe('my-ads');
    expect(rules[0]?.id).toBe('my-ads:example.com');
  });

  it('normalizes uppercase and surrounding whitespace', () => {
    const rules = parseRuleLines('  Example.COM  ');
    expect(rules[0]?.value).toBe('example.com');
  });

  it('skips malformed entries without throwing', () => {
    const rules = parseRuleLines(
      'good.example.com\nhttps://bad.example.com\n*.wild.example.com\nbad port:8080',
    );
    expect(rules.map((r) => r.value)).toEqual(['good.example.com']);
  });

  it('returns an empty array for empty input', () => {
    expect(parseRuleLines('')).toEqual([]);
    expect(parseRuleLines('\n# only comment\n')).toEqual([]);
  });
});

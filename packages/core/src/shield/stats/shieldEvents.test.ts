import { describe, expect, it } from 'vitest';
import { RecentEventsBuffer } from './shieldEvents.js';
import type { FilterRule } from '../types/rule.js';

function rule(id: string): FilterRule {
  return { id, kind: 'domain', category: 'ads', value: 'ads.test', source: 'test' };
}

describe('RecentEventsBuffer', () => {
  it('starts empty', () => {
    expect(new RecentEventsBuffer().snapshot).toEqual([]);
  });

  it('records events with privacy-safe metadata only', () => {
    const buffer = new RecentEventsBuffer();
    buffer.record(
      { action: 'block', resourceType: 'image', hostname: 'ads.test' },
      rule('r1'),
    );
    const event = buffer.snapshot[0];
    expect(event).toBeDefined();
    if (event === undefined) {
      return;
    }
    expect(event.action).toBe('block');
    expect(event.category).toBe('ads');
    expect(event.resourceType).toBe('image');
    expect(event.hostname).toBe('ads.test');
    expect(event.id).toBe('shield-event-1');
    expect(typeof event.timestamp).toBe('number');
  });

  it('returns the most recent event first', () => {
    const buffer = new RecentEventsBuffer();
    buffer.record(
      { action: 'block', resourceType: 'image', hostname: 'ads.test' },
      rule('r1'),
    );
    buffer.record(
      { action: 'allow', resourceType: 'script', hostname: 'cdn.test' },
      rule('r2'),
    );
    expect(buffer.snapshot.map((event) => event.hostname)).toEqual([
      'cdn.test',
      'ads.test',
    ]);
  });

  it('caps the buffer at the configured maximum', () => {
    const buffer = new RecentEventsBuffer();
    for (let i = 0; i < 60; i += 1) {
      buffer.record(
        { action: 'block', resourceType: 'image', hostname: `h${i}.test` },
        rule(`r${i}`),
      );
    }
    expect(buffer.snapshot.length).toBe(50);
    const newest = buffer.snapshot[0];
    expect(newest?.hostname).toBe('h59.test');
  });

  it('clears all events', () => {
    const buffer = new RecentEventsBuffer();
    buffer.record(
      { action: 'block', resourceType: 'image', hostname: 'ads.test' },
      rule('r1'),
    );
    buffer.clear();
    expect(buffer.snapshot).toEqual([]);
  });
});
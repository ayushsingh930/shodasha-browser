import { describe, expect, it } from 'vitest';
import {
  cleanUrl,
  stripTrackingParameters,
  stripFragment,
} from './urlPrivacy.js';

describe('stripTrackingParameters', () => {
  it('removes known tracking parameters', () => {
    expect(
      stripTrackingParameters(
        'https://example.com/page?utm_source=newsletter&id=42&gclid=abc',
      ),
    ).toBe('https://example.com/page?id=42');
  });

  it('is case-insensitive for parameter names', () => {
    expect(
      stripTrackingParameters('https://example.com/?UTM_CAMPAIGN=launch'),
    ).toBe('https://example.com/');
  });

  it('leaves URLs without tracking parameters unchanged', () => {
    const url = 'https://example.com/path?q=hello&page=2';
    expect(stripTrackingParameters(url)).toBe(url);
  });

  it('returns null for unparsable input', () => {
    expect(stripTrackingParameters('not a url')).toBeNull();
  });
});

describe('stripFragment', () => {
  it('removes the fragment', () => {
    expect(stripFragment('https://example.com/#section')).toBe(
      'https://example.com/',
    );
  });

  it('returns null for unparsable input', () => {
    expect(stripFragment('nope')).toBeNull();
  });
});

describe('cleanUrl', () => {
  it('combines tracking and fragment removal', () => {
    expect(cleanUrl('https://example.com/?utm_source=x#frag')).toBe(
      'https://example.com/',
    );
  });

  it('returns null for unparsable input', () => {
    expect(cleanUrl('garbage')).toBeNull();
  });
});

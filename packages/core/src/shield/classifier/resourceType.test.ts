import { describe, expect, it } from 'vitest';
import { classifyResourceType } from './resourceType.js';

describe('classifyResourceType', () => {
  it('classifies by MIME type', () => {
    expect(classifyResourceType('https://x.example/a', 'text/css')).toBe('stylesheet');
    expect(classifyResourceType('https://x.example/a', 'application/javascript')).toBe('script');
    expect(classifyResourceType('https://x.example/a', 'image/png')).toBe('image');
    expect(classifyResourceType('https://x.example/a', 'video/mp4')).toBe('media');
    expect(classifyResourceType('https://x.example/a', 'audio/mpeg')).toBe('media');
    expect(classifyResourceType('https://x.example/a', 'font/woff2')).toBe('font');
  });

  it('classifies by file extension', () => {
    expect(classifyResourceType('https://x.example/app.js?cache=1')).toBe('script');
    expect(classifyResourceType('https://x.example/app.css')).toBe('stylesheet');
    expect(classifyResourceType('https://x.example/pic.webp')).toBe('image');
    expect(classifyResourceType('https://x.example/font.woff2')).toBe('font');
    expect(classifyResourceType('https://x.example/video.mp4')).toBe('media');
  });

  it('ignores the fragment when classifying', () => {
    expect(classifyResourceType('https://x.example/app.js#frag')).toBe('script');
  });

  it('defaults to other for unknown resources', () => {
    expect(classifyResourceType('https://x.example/api/things')).toBe('other');
    expect(classifyResourceType('https://x.example/')).toBe('other');
  });
});

/**
 * Resource-type classification.
 *
 * Classifies a URL/MIME pair into a {@link ResourceType}. Hosts may also pass
 * an explicit resource type directly (e.g. from Chromium's request metadata);
 * this pure classifier is used when only a URL and/or MIME type is available.
 */

import type { ResourceType } from '../types/request.js';

/**
 * Classifies the resource type from an optional MIME type and a URL.
 */
export function classifyResourceType(url: string, mimeType?: string): ResourceType {
  const mime = mimeType?.toLowerCase() ?? '';

  if (mime.length > 0) {
    if (mime.startsWith('text/css')) {
      return 'stylesheet';
    }
    if (mime.includes('javascript')) {
      return 'script';
    }
    if (mime.startsWith('image/')) {
      return 'image';
    }
    if (mime.startsWith('audio/') || mime.startsWith('video/')) {
      return 'media';
    }
    if (mime.startsWith('font/')) {
      return 'font';
    }
    if (
      mime.startsWith('application/x-www-form-urlencoded') ||
      mime.startsWith('multipart/')
    ) {
      return 'xhr';
    }
  }

  switch (fileExtension(url)) {
    case 'js':
    case 'mjs':
    case 'cjs':
      return 'script';
    case 'css':
      return 'stylesheet';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
    case 'svg':
    case 'ico':
    case 'avif':
    case 'bmp':
      return 'image';
    case 'woff':
    case 'woff2':
    case 'ttf':
    case 'otf':
    case 'eot':
      return 'font';
    case 'mp4':
    case 'webm':
    case 'ogv':
    case 'mp3':
    case 'ogg':
    case 'wav':
    case 'm4a':
    case 'm3u8':
      return 'media';
    default:
      return 'other';
  }
}

/** Lowercased file extension of a URL, without the dot; empty when absent. */
function fileExtension(url: string): string {
  const withoutQuery = url.split(/[?#]/)[0] ?? '';
  const slash = withoutQuery.lastIndexOf('/');
  const lastSegment = slash === -1 ? withoutQuery : withoutQuery.slice(slash + 1);
  const dot = lastSegment.lastIndexOf('.');
  if (dot === -1 || dot === lastSegment.length - 1) {
    return '';
  }
  return lastSegment.slice(dot + 1).toLowerCase();
}

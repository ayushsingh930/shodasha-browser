import { describe, expect, it } from 'vitest';
import {
  formatBytes,
  isExecutableFilename,
  isValidDownloadUrl,
  sanitizeFilename,
  searchDownloads,
  uniqueFilename,
  type DownloadItem,
} from './downloadModel.js';

function item(overrides: Partial<DownloadItem>): DownloadItem {
  return {
    id: 'dl_test',
    url: 'https://example.com/file.pdf',
    filename: 'file.pdf',
    savePath: '/tmp/file.pdf',
    state: 'completed',
    receivedBytes: 100,
    totalBytes: 100,
    startedAt: 1,
    completedAt: 2,
    error: null,
    mimeType: 'application/pdf',
    executable: false,
    ...overrides,
  };
}

describe('isValidDownloadUrl', () => {
  it('accepts http and https URLs', () => {
    expect(isValidDownloadUrl('https://example.com/file.zip')).toBe(true);
    expect(isValidDownloadUrl('http://example.com/a')).toBe(true);
  });

  it('rejects dangerous and invalid schemes', () => {
    for (const bad of [
      '',
      'file:///etc/passwd',
      'javascript:alert(1)',
      'data:text/plain,hi',
      'shodasha://downloads',
      'about:blank',
      'not a url',
      'https://',
    ]) {
      expect(isValidDownloadUrl(bad)).toBe(false);
    }
  });
});

describe('sanitizeFilename', () => {
  it('strips directory components and traversal', () => {
    expect(sanitizeFilename('../../etc/passwd')).toBe('passwd');
    expect(sanitizeFilename('..\\..\\Windows\\system.ini')).toBe('system.ini');
    expect(sanitizeFilename('a/b/c.pdf')).toBe('c.pdf');
    expect(sanitizeFilename('a\\b\\c.pdf')).toBe('c.pdf');
  });

  it('removes invalid Windows filename characters', () => {
    expect(sanitizeFilename('a<b>c:d"e?i*j')).toBe('abcdeij');
  });

  it('trims leading and trailing dots and spaces', () => {
    expect(sanitizeFilename('..hidden ')).toBe('hidden');
    expect(sanitizeFilename('name.')).toBe('name');
    expect(sanitizeFilename('  spaced  ')).toBe('spaced');
  });

  it('handles Windows reserved device names without crashing', () => {
    expect(sanitizeFilename('CON')).toBe('_CON');
    expect(sanitizeFilename('NUL.txt')).toBe('_NUL.txt');
    expect(sanitizeFilename('COM1')).toBe('_COM1');
  });

  it('falls back when nothing usable remains', () => {
    expect(sanitizeFilename('')).toBe('download');
    expect(sanitizeFilename('<>:"/\\|?*')).toBe('download');
  });

  it('truncates overlong names while preserving the extension', () => {
    const long = `${'x'.repeat(250)}.pdf`;
    const result = sanitizeFilename(long);
    expect(result.endsWith('.pdf')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(200);
  });

  it('never returns a path separator', () => {
    expect(sanitizeFilename('\\a\\b\\c')).toBe('c');
    expect(sanitizeFilename('/etc')).toBe('etc');
  });
});

describe('uniqueFilename', () => {
  it('keeps the name when free', () => {
    expect(uniqueFilename(new Set(), 'a.pdf')).toBe('a.pdf');
  });

  it('appends (1), (2) for taken names', () => {
    const taken = new Set(['a.pdf']);
    expect(uniqueFilename(taken, 'a.pdf')).toBe('a (1).pdf');
    const taken2 = new Set(['a.pdf', 'a (1).pdf']);
    expect(uniqueFilename(taken2, 'a.pdf')).toBe('a (2).pdf');
  });

  it('handles names without an extension', () => {
    expect(uniqueFilename(new Set(['notes']), 'notes')).toBe('notes (1)');
  });
});

describe('isExecutableFilename', () => {
  it('flags executable and script formats', () => {
    for (const name of [
      'setup.exe',
      'run.bat',
      'x.cmd',
      'y.ps1',
      'z.msi',
      's.scr',
      'v.vbs',
      's.js',
      'j.jar',
    ]) {
      expect(isExecutableFilename(name)).toBe(true);
    }
  });

  it('does not flag normal documents', () => {
    for (const name of ['file.pdf', 'photo.jpg', 'notes.txt', 'archive.zip', 'movie.mp4']) {
      expect(isExecutableFilename(name)).toBe(false);
    }
  });
});

describe('searchDownloads', () => {
  const items = [
    item({ filename: 'manual.pdf', url: 'https://example.com/manual.pdf' }),
    item({ filename: 'photo.jpg', url: 'https://photos.example.net/x.jpg' }),
  ];

  it('returns everything for an empty query', () => {
    expect(searchDownloads(items, '')).toHaveLength(2);
    expect(searchDownloads(items, '   ')).toHaveLength(2);
  });

  it('matches filenames case-insensitively', () => {
    expect(searchDownloads(items, 'MANUAL')).toHaveLength(1);
    expect(searchDownloads(items, 'manual')).toHaveLength(1);
  });

  it('matches source URLs', () => {
    expect(searchDownloads(items, 'photos.example')).toHaveLength(1);
  });
});

describe('formatBytes', () => {
  it('formats bytes compactly', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2048)).toBe('2 KB');
    expect(formatBytes(1_048_576)).toBe('1 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  it('handles invalid input defensively', () => {
    expect(formatBytes(Number.NaN)).toBe('0 B');
    expect(formatBytes(Number.NEGATIVE_INFINITY)).toBe('0 B');
    expect(formatBytes(-5)).toBe('0 B');
  });
});
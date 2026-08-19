import { afterEach, describe, expect, it, vi } from 'vitest';
import { DownloadManager, MAX_DOWNLOAD_RECORDS } from './downloadManager.js';
import type { DownloadItem } from './downloadModel.js';

afterEach(() => {
  vi.useRealTimers();
});

function add(
  manager: DownloadManager,
  overrides: { url?: string; filename?: string; totalBytes?: number } = {},
): DownloadItem | null {
  const result = manager.addDownload({
    url: overrides.url ?? 'https://example.com/file.bin',
    filename: overrides.filename ?? 'file.bin',
    savePath: `C:/downloads/${overrides.filename ?? 'file.bin'}`,
    ...(overrides.totalBytes !== undefined ? { totalBytes: overrides.totalBytes } : {}),
  });
  return result.ok ? result.item : null;
}

describe('DownloadManager.addDownload', () => {
  it('registers a valid download as pending, newest first', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-01T12:00:00Z'));
    const manager = new DownloadManager();
    const a = add(manager, { filename: 'a.bin' });
    vi.setSystemTime(new Date('2026-02-01T12:00:01Z'));
    const b = add(manager, { filename: 'b.bin' });
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(a?.state).toBe('pending');
    expect(manager.size).toBe(2);
    expect(manager.list[0]?.filename).toBe('b.bin');
    expect(a?.id).toMatch(/^dl_/);
    expect(a?.id).not.toBe(b?.id);
  });

  it('rejects non-web URLs', () => {
    const manager = new DownloadManager();
    const result = manager.addDownload({
      url: 'file:///etc/passwd',
      filename: 'x',
      savePath: 'x',
    });
    expect(result.ok).toBe(false);
    expect(manager.isEmpty).toBe(true);
  });

  it('sanitizes the filename and flags executables', () => {
    const manager = new DownloadManager();
    const item = add(manager, { filename: '../../../../etc/passwd.exe' });
    expect(item).not.toBeNull();
    expect(item?.filename).toBe('passwd.exe');
    expect(item?.executable).toBe(true);
  });
});

describe('DownloadManager state machine', () => {
  it('tracks progress and total bytes', () => {
    const manager = new DownloadManager();
    const item = add(manager, { filename: 'f.bin', totalBytes: 100 });
    expect(item).not.toBeNull();
    if (item === null) {
      return;
    }
    expect(manager.updateProgress(item.id, 40, 100)).toBe(true);
    expect(manager.entry(item.id)?.state).toBe('progressing');
    expect(manager.entry(item.id)?.receivedBytes).toBe(40);
    expect(manager.entry(item.id)?.totalBytes).toBe(100);
  });

  it('never decreases received bytes', () => {
    const manager = new DownloadManager();
    const item = add(manager, { filename: 'f.bin', totalBytes: 100 });
    if (item === null) {
      return;
    }
    manager.updateProgress(item.id, 80, 100);
    manager.updateProgress(item.id, 10, 100);
    expect(manager.entry(item.id)?.receivedBytes).toBe(80);
  });

  it('pauses and resumes only when valid', () => {
    const manager = new DownloadManager();
    const item = add(manager);
    if (item === null) {
      return;
    }
    manager.updateProgress(item.id, 5, 10);
    expect(manager.markPaused(item.id)).toBe(true);
    expect(manager.entry(item.id)?.state).toBe('paused');
    expect(manager.markResumed(item.id)).toBe(true);
    expect(manager.entry(item.id)?.state).toBe('progressing');
  });

  it('completes a download and sets completedAt', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-01T12:00:00Z'));
    const manager = new DownloadManager();
    const item = add(manager);
    if (item === null) {
      return;
    }
    expect(manager.markCompleted(item.id)).toBe(true);
    expect(manager.entry(item.id)?.state).toBe('completed');
    expect(manager.entry(item.id)?.completedAt).toBe(Date.now());
  });

  it('cannot leave a terminal state', () => {
    const manager = new DownloadManager();
    const item = add(manager);
    if (item === null) {
      return;
    }
    manager.markCancelled(item.id);
    expect(manager.entry(item.id)?.state).toBe('cancelled');
    expect(manager.updateProgress(item.id, 9, 10)).toBe(false);
    expect(manager.markResumed(item.id)).toBe(false);
    expect(manager.entry(item.id)?.state).toBe('cancelled');
  });

  it('marks a failed download with a friendly error', () => {
    const manager = new DownloadManager();
    const item = add(manager);
    if (item === null) {
      return;
    }
    expect(manager.markFailed(item.id, 'The download was interrupted.')).toBe(true);
    expect(manager.entry(item.id)?.state).toBe('failed');
    expect(manager.entry(item.id)?.error).toBe('The download was interrupted.');
  });

  it('ignores transitions for unknown ids', () => {
    const manager = new DownloadManager();
    expect(manager.markCompleted('nope')).toBe(false);
    expect(manager.markFailed('nope', 'x')).toBe(false);
    expect(manager.markCancelled('nope')).toBe(false);
  });
});

describe('DownloadManager clear and remove', () => {
  function settledManager(): DownloadManager {
    const manager = new DownloadManager();
    const done = add(manager, { filename: 'done.bin' });
    const failed = add(manager, { filename: 'fail.bin' });
    const active = add(manager, { filename: 'active.bin' });
    if (done !== null) {
      manager.markCompleted(done.id);
    }
    if (failed !== null) {
      manager.markFailed(failed.id, 'oops');
    }
    expect(active).not.toBeNull();
    return manager;
  }

  it('removes a single record (metadata only)', () => {
    const manager = settledManager();
    const target = manager.list.find((i) => i.filename === 'done.bin');
    expect(target).toBeDefined();
    expect(manager.remove(target?.id ?? '')).toBe(true);
    expect(manager.size).toBe(2);
  });

  it('clears only the requested terminal states', () => {
    const manager = settledManager();
    expect(manager.clearByState(['completed'])).toBe(1);
    expect(manager.list.some((i) => i.filename === 'done.bin')).toBe(false);
    expect(manager.list.some((i) => i.filename === 'active.bin')).toBe(true);
    expect(manager.clearByState(['failed'])).toBe(1);
    expect(manager.list.some((i) => i.filename === 'fail.bin')).toBe(false);
  });

  it('never clears active downloads', () => {
    const manager = settledManager();
    expect(manager.clearByState(['completed', 'cancelled', 'failed'])).toBe(2);
    expect(manager.list.some((i) => i.filename === 'active.bin')).toBe(true);
    expect(manager.clearByState(['pending'])).toBe(0);
  });

  it('clears everything', () => {
    const manager = settledManager();
    expect(manager.clearAll()).toBe(3);
    expect(manager.isEmpty).toBe(true);
  });
});

describe('DownloadManager restart handling', () => {
  it('marks persisted active downloads as failed on a fresh manager', () => {
    const manager = new DownloadManager();
    const item = add(manager);
    if (item === null) {
      return;
    }
    manager.updateProgress(item.id, 12, 50);
    const snapshot = manager.snapshot();
    const reloaded = new DownloadManager(snapshot);
    const stored = reloaded.entry(item.id);
    expect(stored).not.toBeNull();
    expect(
      stored?.state === 'pending' || stored?.state === 'progressing',
    ).toBe(true);
    const marked = reloaded.failInterrupted('browser closed');
    expect(marked).toBe(1);
    expect(reloaded.entry(item.id)?.state).toBe('failed');
    expect(reloaded.entry(item.id)?.error).toContain('browser closed');
  });

  it('leaves finished records untouched on restart', () => {
    const manager = new DownloadManager();
    const done = add(manager, { filename: 'done.bin' });
    if (done === null) {
      return;
    }
    manager.markCompleted(done.id);
    const reloaded = new DownloadManager(manager.snapshot());
    expect(reloaded.failInterrupted('x')).toBe(0);
    expect(reloaded.entry(done.id)?.state).toBe('completed');
  });
});

describe('DownloadManager limits', () => {
  it('retains at most MAX_DOWNLOAD_RECORDS records', () => {
    const manager = new DownloadManager();
    for (let i = 0; i < MAX_DOWNLOAD_RECORDS + 20; i += 1) {
      const item = add(manager, { filename: `f${i}.bin` });
      if (item !== null) {
        manager.markCompleted(item.id);
      }
    }
    expect(manager.size).toBeLessThanOrEqual(MAX_DOWNLOAD_RECORDS);
    expect(manager.size).toBe(MAX_DOWNLOAD_RECORDS);
  });
});

describe('DownloadManager.search and entry', () => {
  it('finds an entry by id', () => {
    const manager = new DownloadManager();
    const item = add(manager, { filename: 'x.pdf' });
    expect(manager.entry(item?.id ?? '')?.filename).toBe('x.pdf');
    expect(manager.entry('missing')).toBeNull();
  });

  it('searches filenames and urls case-insensitively', () => {
    const manager = new DownloadManager();
    add(manager, { url: 'https://example.com/manual.pdf', filename: 'manual.pdf' });
    add(manager, { url: 'https://photos.example.net/a.jpg', filename: 'a.jpg' });
    expect(manager.search('MANUAL')).toHaveLength(1);
    expect(manager.search('photos.example')).toHaveLength(1);
    expect(manager.search('zzz')).toHaveLength(0);
  });
});

describe('DownloadManager.activeCount', () => {
  it('counts only active (non-terminal) downloads', () => {
    const manager = new DownloadManager();
    const active = add(manager, { filename: 'active.bin' });
    const done = add(manager, { filename: 'done.bin' });
    if (active === null || done === null) {
      return;
    }
    manager.markCompleted(done.id);
    expect(manager.activeCount).toBe(1);
    manager.markCancelled(active.id);
    expect(manager.activeCount).toBe(0);
  });
});
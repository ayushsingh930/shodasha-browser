/**
 * Regression tests for the tab-view lifecycle helpers.
 *
 * These protect the fix for the "Object has been destroyed" crash that fired
 * when `destroyView()` ran against an already destroyed BrowserWindow or
 * WebContents. The helpers are pure (no Electron import), so the tests use
 * plain fakes that mirror Electron's destroyed-state behavior.
 */

import { describe, expect, it } from 'vitest';
import {
  destroyViewSafely,
  handleViewDestroyed,
  type LiveTabLifecycle,
} from './viewLifecycle.js';

interface FakeWebContents {
  destroyed: boolean;
  closeCalls: number;
  isDestroyed(): boolean;
  close(options: { waitForBeforeUnload: boolean }): void;
}

function fakeWebContents(destroyed = false): FakeWebContents {
  return {
    destroyed,
    closeCalls: 0,
    isDestroyed() {
      return this.destroyed;
    },
    close() {
      this.closeCalls += 1;
      this.destroyed = true;
    },
  };
}

interface FakeWindow {
  destroyed: boolean;
  removedViews: unknown[];
  isDestroyed(): boolean;
  contentView: {
    removeChildView(view: unknown): void;
  };
}

function fakeWindow(destroyed = false): FakeWindow {
  const win: FakeWindow = {
    destroyed,
    removedViews: [],
    isDestroyed() {
      return this.destroyed;
    },
    contentView: {
      removeChildView(view: unknown) {
        win.removedViews.push(view);
      },
    },
  };
  return win;
}

function fakeLive(
  wc: FakeWebContents,
  attached = true,
): LiveTabLifecycle & { view: unknown } {
  return { view: {}, wc, attached };
}

describe('destroyViewSafely', () => {
  it('detaches and closes a healthy view', () => {
    const wc = fakeWebContents();
    const win = fakeWindow();
    const live = fakeLive(wc);

    destroyViewSafely(live, win);

    expect(win.removedViews).toHaveLength(1);
    expect(wc.closeCalls).toBe(1);
    expect(live.attached).toBe(false);
  });

  it('is safe to call twice (no double cleanup, no throw)', () => {
    const wc = fakeWebContents();
    const win = fakeWindow();
    const live = fakeLive(wc);

    destroyViewSafely(live, win);
    destroyViewSafely(live, win);

    expect(win.removedViews).toHaveLength(1);
    expect(wc.closeCalls).toBe(1);
    expect(live.attached).toBe(false);
  });

  it('does nothing when the webContents is already destroyed', () => {
    const wc = fakeWebContents(true);
    const win = fakeWindow();
    const live = fakeLive(wc);

    expect(() => {
      destroyViewSafely(live, win);
    }).not.toThrow();
    expect(win.removedViews).toHaveLength(0);
    expect(wc.closeCalls).toBe(0);
  });

  it('never touches the window when the window is destroyed', () => {
    const wc = fakeWebContents();
    const win = fakeWindow(true);
    const live = fakeLive(wc);

    destroyViewSafely(live, win);

    expect(win.removedViews).toHaveLength(0);
    expect(wc.closeCalls).toBe(1);
    expect(live.attached).toBe(false);
  });

  it('does nothing when the view was already detached', () => {
    const wc = fakeWebContents();
    const win = fakeWindow();
    const live = fakeLive(wc, false);

    destroyViewSafely(live, win);

    expect(win.removedViews).toHaveLength(0);
    expect(wc.closeCalls).toBe(1);
  });

  it('survives a destroyed window plus destroyed webContents', () => {
    const wc = fakeWebContents(true);
    const win = fakeWindow(true);
    const live = fakeLive(wc, false);

    expect(() => {
      destroyViewSafely(live, win);
    }).not.toThrow();
    expect(win.removedViews).toHaveLength(0);
    expect(wc.closeCalls).toBe(0);
  });
});

describe('handleViewDestroyed', () => {
  it('removes the stale reference and marks the view detached', () => {
    const wc = fakeWebContents(true);
    const live = fakeLive(wc);
    const liveTabs = new Map<string, LiveTabLifecycle>([['t1', live]]);

    const removed = handleViewDestroyed('t1', liveTabs);

    expect(removed).toBe(live);
    expect(liveTabs.has('t1')).toBe(false);
    expect(live.attached).toBe(false);
  });

  it('returns null for an unknown tab id', () => {
    const liveTabs = new Map<string, LiveTabLifecycle>();
    expect(handleViewDestroyed('missing', liveTabs)).toBeNull();
  });

  it('returns null when the tab was already cleaned up (double cleanup)', () => {
    const wc = fakeWebContents(true);
    const live = fakeLive(wc);
    const liveTabs = new Map<string, LiveTabLifecycle>([['t1', live]]);

    expect(handleViewDestroyed('t1', liveTabs)).toBe(live);
    expect(handleViewDestroyed('t1', liveTabs)).toBeNull();
  });

  it('never destroys anything itself (no recursion)', () => {
    const wc = fakeWebContents(true);
    const live = fakeLive(wc);
    const liveTabs = new Map<string, LiveTabLifecycle>([['t1', live]]);

    handleViewDestroyed('t1', liveTabs);

    expect(wc.closeCalls).toBe(0);
  });
});
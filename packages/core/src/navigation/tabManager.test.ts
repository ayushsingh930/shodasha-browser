import { describe, expect, it } from 'vitest';
import { TabManager } from './tabManager.js';
import type { TabEvent } from './tabManager.js';

describe('TabManager', () => {
  it('creates a tab and activates it by default', () => {
    const manager = new TabManager();
    const id = manager.createTab({ url: 'https://example.com' });
    expect(manager.size).toBe(1);
    const tab = manager.getTab(id);
    expect(tab?.active).toBe(true);
    expect(manager.activeTab?.id).toBe(id);
    expect(tab?.url).toBe('https://example.com');
  });

  it('generates unique tab ids', () => {
    const manager = new TabManager();
    const a = manager.createTab();
    const b = manager.createTab();
    const c = manager.createTab();
    expect(new Set([a, b, c]).size).toBe(3);
  });

  it('tracks loading state', () => {
    const manager = new TabManager();
    const id = manager.createTab({ url: 'https://a.com' });
    expect(manager.getTab(id)?.loading).toBe(true);
    manager.endNavigation(id, 'success');
    expect(manager.getTab(id)?.loading).toBe(false);
    manager.beginNavigation(id, 'https://b.com');
    expect(manager.getTab(id)?.loading).toBe(true);
  });

  it('sets title and favicon', () => {
    const manager = new TabManager();
    const id = manager.createTab({ url: 'https://a.com' });
    manager.setTitle(id, 'Example');
    manager.setFavicon(id, 'https://a.com/favicon.ico');
    expect(manager.getTab(id)?.title).toBe('Example');
    expect(manager.getTab(id)?.favicon).toBe('https://a.com/favicon.ico');
  });

  it('switches the active tab', () => {
    const manager = new TabManager();
    const a = manager.createTab();
    const b = manager.createTab();
    expect(manager.activeTab?.id).toBe(b);
    manager.setActiveTab(a);
    expect(manager.activeTab?.id).toBe(a);
    expect(manager.getTab(a)?.active).toBe(true);
    expect(manager.getTab(b)?.active).toBe(false);
  });

  it('closes a tab', () => {
    const manager = new TabManager();
    const a = manager.createTab();
    manager.createTab();
    expect(manager.size).toBe(2);
    manager.closeTab(a);
    expect(manager.size).toBe(1);
    expect(manager.getTab(a)).toBeNull();
  });

  it('activates a neighbour when the active tab is closed', () => {
    const manager = new TabManager();
    const a = manager.createTab();
    const b = manager.createTab();
    // Close the active tab (b); a should become active.
    const nextActive = manager.closeTab(b);
    expect(nextActive).toBe(a);
    expect(manager.activeTab?.id).toBe(a);
  });

  it('returns null when the last tab is closed', () => {
    const manager = new TabManager();
    const a = manager.createTab();
    expect(manager.closeTab(a)).toBeNull();
    expect(manager.size).toBe(0);
    expect(manager.activeTab).toBeNull();
  });

  it('ignores closing a nonexistent tab', () => {
    const manager = new TabManager();
    manager.createTab();
    expect(manager.closeTab('nope')).not.toBeNull();
    expect(manager.size).toBe(1);
  });

  describe('navigation history', () => {
    it('records history and enables back/forward', () => {
      const manager = new TabManager();
      const id = manager.createTab({ url: 'https://a.com' });
      manager.beginNavigation(id, 'https://b.com');
      manager.beginNavigation(id, 'https://c.com');
      const tab = manager.getTab(id);
      expect(tab?.url).toBe('https://c.com');
      expect(manager.canGoBackFor(id)).toBe(true);
      expect(manager.canGoForwardFor(id)).toBe(false);
    });

    it('navigates back then forward', () => {
      const manager = new TabManager();
      const id = manager.createTab({ url: 'https://a.com' });
      manager.beginNavigation(id, 'https://b.com');
      manager.beginNavigation(id, 'https://c.com');

      const backUrl = manager.navigateHistory(id, 'back');
      expect(backUrl).toBe('https://b.com');
      expect(manager.getTab(id)?.url).toBe('https://b.com');

      const backUrl2 = manager.navigateHistory(id, 'back');
      expect(backUrl2).toBe('https://a.com');

      expect(manager.canGoBackFor(id)).toBe(false);

      const fwdUrl = manager.navigateHistory(id, 'forward');
      expect(fwdUrl).toBe('https://b.com');
    });

    it('returns null when there is no history in the direction', () => {
      const manager = new TabManager();
      const id = manager.createTab({ url: 'https://a.com' });
      expect(manager.navigateHistory(id, 'back')).toBeNull();
      expect(manager.navigateHistory(id, 'forward')).toBeNull();
    });

    it('truncates forward history on a new navigation', () => {
      const manager = new TabManager();
      const id = manager.createTab({ url: 'https://a.com' });
      manager.beginNavigation(id, 'https://b.com');
      manager.beginNavigation(id, 'https://c.com');
      manager.navigateHistory(id, 'back'); // to b
      manager.beginNavigation(id, 'https://d.com'); // truncates c
      expect(manager.getTab(id)?.url).toBe('https://d.com');
      expect(manager.canGoForwardFor(id)).toBe(false);
    });
  });

  describe('error handling', () => {
    it('records a friendly error and shows the error page', () => {
      const manager = new TabManager();
      const id = manager.createTab({ url: 'https://a.com' });
      manager.beginNavigation(id, 'https://broken.example');
      manager.endNavigation(id, 'error', 'Connection failed.');
      const tab = manager.getTab(id);
      expect(tab?.loading).toBe(false);
      expect(tab?.showErrorPage).toBe(true);
      expect(tab?.error).toBe('Connection failed.');
    });

    it('clears errors on a fresh navigation', () => {
      const manager = new TabManager();
      const id = manager.createTab({ url: 'https://a.com' });
      manager.beginNavigation(id, 'https://broken.example');
      manager.endNavigation(id, 'error', 'Connection failed.');
      manager.beginNavigation(id, 'https://good.example');
      expect(manager.getTab(id)?.showErrorPage).toBe(false);
      expect(manager.getTab(id)?.error).toBeNull();
    });
  });

  describe('events', () => {
    it('emits tab events on changes', () => {
      const manager = new TabManager();
      const events: TabEvent[] = [];
      manager.subscribe((e) => events.push(e));
      const id = manager.createTab();
      manager.setTitle(id, 'T');
      manager.endNavigation(id, 'success');
      expect(events.some((e) => e.type === 'tabs-changed')).toBe(true);
      expect(events.some((e) => e.type === 'tab-updated')).toBe(true);
      expect(events.some((e) => e.type === 'active-tab-changed')).toBe(true);
    });

    it('unsubscribes a listener', () => {
      const manager = new TabManager();
      let count = 0;
      const unsub = manager.subscribe(() => {
        count += 1;
      });
      unsub();
      manager.createTab();
      expect(count).toBe(0);
    });
  });

  describe('tab ordering', () => {
    it('appends new tabs at the end (right-to-left order)', () => {
      const manager = new TabManager();
      const a = manager.createTab();
      const b = manager.createTab();
      const c = manager.createTab();
      expect(manager.list.map((t) => t.id)).toEqual([a, b, c]);
    });
  });

  describe('duplicate tab', () => {
    it('copies url, title, favicon and becomes active', () => {
      const manager = new TabManager();
      const source = manager.createTab({ url: 'https://a.com' });
      manager.setTitle(source, 'A');
      manager.setFavicon(source, 'https://a.com/favicon.ico');
      const dup = manager.duplicateTab(source);
      expect(dup).not.toBeNull();
      const copy = manager.getTab(dup ?? '');
      expect(copy?.url).toBe('https://a.com');
      expect(copy?.title).toBe('A');
      expect(copy?.favicon).toBe('https://a.com/favicon.ico');
      expect(copy?.active).toBe(true);
    });

    it('inserts the copy directly after the source tab', () => {
      const manager = new TabManager();
      const a = manager.createTab({ url: 'https://a.com' });
      const b = manager.createTab({ url: 'https://b.com' });
      const dup = manager.duplicateTab(a);
      const ids = manager.list.map((t) => t.id);
      expect(ids.indexOf(dup ?? '')).toBe(ids.indexOf(a) + 1);
      expect(manager.size).toBe(3);
      expect(manager.getTab(b)).not.toBeNull();
    });

    it('returns null for a missing tab', () => {
      const manager = new TabManager();
      manager.createTab();
      expect(manager.duplicateTab('nope')).toBeNull();
    });
  });

  describe('reopen closed tab', () => {
    it('reopens the most recently closed tab with its state', () => {
      const manager = new TabManager();
      const a = manager.createTab({ url: 'https://a.com' });
      manager.setTitle(a, 'A');
      manager.setFavicon(a, 'https://a.com/favicon.ico');
      manager.beginNavigation(a, 'https://b.com');
      manager.closeTab(a);
      expect(manager.size).toBe(0);

      const id = manager.reopenClosedTab();
      expect(id).not.toBeNull();
      const tab = manager.getTab(id ?? '');
      expect(tab?.url).toBe('https://b.com');
      expect(tab?.title).toBe('A');
      expect(tab?.favicon).toBe('https://a.com/favicon.ico');
      expect(tab?.active).toBe(true);
      expect(manager.size).toBe(1);
    });

    it('restores navigation history of a reopened tab', () => {
      const manager = new TabManager();
      const a = manager.createTab({ url: 'https://a.com' });
      manager.beginNavigation(a, 'https://b.com');
      manager.beginNavigation(a, 'https://c.com');
      manager.navigateHistory(a, 'back'); // at b.com
      manager.closeTab(a);

      const id = manager.reopenClosedTab();
      const tab = manager.getTab(id ?? '');
      expect(tab?.url).toBe('https://b.com');
      expect(manager.canGoBackFor(id ?? '')).toBe(true);
      expect(manager.canGoForwardFor(id ?? '')).toBe(true);
    });

    it('does not track blank tabs for reopening', () => {
      const manager = new TabManager();
      manager.createTab(); // blank new tab
      manager.createTab(); // blank new tab
      expect(manager.canReopenClosedTab).toBe(false);
      expect(manager.reopenClosedTab()).toBeNull();
    });

    it('returns null when there is nothing to reopen', () => {
      const manager = new TabManager();
      expect(manager.reopenClosedTab()).toBeNull();
      expect(manager.canReopenClosedTab).toBe(false);
    });

    it('tracks closed tabs after a close', () => {
      const manager = new TabManager();
      const a = manager.createTab({ url: 'https://a.com' });
      expect(manager.canReopenClosedTab).toBe(false);
      manager.closeTab(a);
      expect(manager.canReopenClosedTab).toBe(true);
    });

    it('bounds the number of remembered closed tabs', () => {
      const manager = new TabManager();
      for (let i = 0; i < 25; i += 1) {
        const id = manager.createTab({ url: `https://site${i}.com` });
        manager.closeTab(id);
      }
      // Only the most recent MAX_CLOSED_TABS are retained.
      expect(manager.canReopenClosedTab).toBe(true);
      const first = manager.reopenClosedTab();
      const tab = manager.getTab(first ?? '');
      expect(tab?.url).toBe('https://site24.com');
    });
  });

  describe('close other tabs', () => {
    it('closes all tabs except the given one', () => {
      const manager = new TabManager();
      const a = manager.createTab({ url: 'https://a.com' });
      const b = manager.createTab({ url: 'https://b.com' });
      const c = manager.createTab({ url: 'https://c.com' });
      manager.closeOtherTabs(b);
      expect(manager.size).toBe(1);
      expect(manager.getTab(b)).not.toBeNull();
      expect(manager.getTab(a)).toBeNull();
      expect(manager.getTab(c)).toBeNull();
    });

    it('closes every other tab when the kept tab is the newest (rightmost)', () => {
      const manager = new TabManager();
      const a = manager.createTab({ url: 'https://a.com' });
      const b = manager.createTab({ url: 'https://b.com' });
      const c = manager.createTab({ url: 'https://c.com' }); // active
      manager.closeOtherTabs(c);
      expect(manager.size).toBe(1);
      expect(manager.getTab(c)).not.toBeNull();
      expect(manager.getTab(a)).toBeNull();
      expect(manager.getTab(b)).toBeNull();
    });

    it('makes the kept tab active', () => {
      const manager = new TabManager();
      const a = manager.createTab({ url: 'https://a.com' });
      const b = manager.createTab({ url: 'https://b.com' }); // active
      manager.closeOtherTabs(a);
      expect(manager.activeTab?.id).toBe(a);
    });

    it('ignores a missing tab', () => {
      const manager = new TabManager();
      manager.createTab({ url: 'https://a.com' });
      manager.closeOtherTabs('nope');
      expect(manager.size).toBe(1);
    });
  });

  describe('close tabs to the right', () => {
    it('closes tabs positioned to the right of the given tab', () => {
      const manager = new TabManager();
      const a = manager.createTab({ url: 'https://a.com' });
      const b = manager.createTab({ url: 'https://b.com' });
      const c = manager.createTab({ url: 'https://c.com' });
      manager.closeTabsToRight(a);
      expect(manager.size).toBe(1);
      expect(manager.getTab(a)).not.toBeNull();
      expect(manager.getTab(b)).toBeNull();
      expect(manager.getTab(c)).toBeNull();
    });

    it('activates the kept tab when the active tab was to the right', () => {
      const manager = new TabManager();
      const a = manager.createTab({ url: 'https://a.com' });
      const b = manager.createTab({ url: 'https://b.com' }); // active
      manager.closeTabsToRight(a);
      expect(manager.activeTab?.id).toBe(a);
    });

    it('ignores a missing tab', () => {
      const manager = new TabManager();
      manager.createTab({ url: 'https://a.com' });
      manager.closeTabsToRight('nope');
      expect(manager.size).toBe(1);
    });
  });
});

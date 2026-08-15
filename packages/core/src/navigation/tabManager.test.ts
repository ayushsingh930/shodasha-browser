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
});

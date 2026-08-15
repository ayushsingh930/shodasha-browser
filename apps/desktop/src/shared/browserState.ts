/**
 * Shared types for the renderer ↔ main IPC contract.
 *
 * These types describe the browser state sent from the main process to the
 * renderer UI, and are imported by both sides. They are UI-agnostic views of
 * the core tab model.
 */

import type { SecurityState, ShieldMode, ShieldStats } from '@shodasha/core';

/** A tab as presented to the UI. */
export interface TabViewState {
  readonly id: string;
  readonly url: string;
  readonly title: string;
  readonly loading: boolean;
  readonly active: boolean;
  readonly favicon: string | null;
  readonly securityState: SecurityState;
  readonly error: string | null;
  readonly showErrorPage: boolean;
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
}

/** The complete browser state pushed to the UI. */
export interface BrowserState {
  readonly tabs: readonly TabViewState[];
  readonly activeTabId: string | null;
  /** Whether a recently-closed tab can be reopened (Ctrl+Shift+T). */
  readonly canReopenClosedTab: boolean;
}

/** The state shown in the Shield panel and site-settings panel. */
export interface ShieldPanelState {
  /** Whether the Shield is globally enabled. */
  readonly enabled: boolean;
  /** The global protection mode. */
  readonly mode: ShieldMode;
  /** Current session statistics. */
  readonly stats: ShieldStats;
  /** The hostname of the site currently being viewed, if any. */
  readonly currentSite: string | null;
  /** Whether the Shield is on for the current site. */
  readonly siteEnabled: boolean;
  /** The protection mode for the current site (falls back to the global mode). */
  readonly siteMode: ShieldMode;
  /** Whether the current site is allowlisted. */
  readonly siteAllowlisted: boolean;
}

/** Whether a URL represents a blank new-tab page (nothing to show). */
export function isBlankTabUrl(url: string): boolean {
  return url.length === 0 || url === 'about:blank' || url.startsWith('about:blank#');
}

/** IPC channel names used between renderer and main. */
export const IPC = {
  getState: 'browser:get-state',
  submitAddress: 'browser:submit-address',
  goBack: 'browser:go-back',
  goForward: 'browser:go-forward',
  reload: 'browser:reload',
  hardReload: 'browser:hard-reload',
  stop: 'browser:stop',
  newTab: 'browser:new-tab',
  closeTab: 'browser:close-tab',
  activateTab: 'browser:activate-tab',
  reloadTab: 'browser:reload-tab',
  duplicateTab: 'browser:duplicate-tab',
  closeOtherTabs: 'browser:close-other-tabs',
  closeTabsToRight: 'browser:close-tabs-to-right',
  reopenClosedTab: 'browser:reopen-closed-tab',
  nextTab: 'browser:next-tab',
  prevTab: 'browser:prev-tab',
  stateChanged: 'browser:state-changed',
  focusAddressBar: 'browser:focus-address-bar',
  shieldGetState: 'shield:get-state',
  shieldSetEnabled: 'shield:set-enabled',
  shieldSetMode: 'shield:set-mode',
  shieldSetSiteSetting: 'shield:set-site-setting',
  shieldToggleAllowlist: 'shield:toggle-allowlist',
  shieldSubscribe: 'shield:subscribe',
  shieldUnsubscribe: 'shield:unsubscribe',
  shieldPanelChanged: 'shield:panel-changed',
} as const;

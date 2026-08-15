/**
 * Shared types for the renderer ↔ main IPC contract.
 *
 * These types describe the browser state sent from the main process to the
 * renderer UI, and are imported by both sides. They are UI-agnostic views of
 * the core tab model.
 */

import type { SecurityState } from '@shodasha/core';

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
} as const;

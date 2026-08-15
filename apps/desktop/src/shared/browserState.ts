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
}

/** IPC channel names used between renderer and main. */
export const IPC = {
  getState: 'browser:get-state',
  submitAddress: 'browser:submit-address',
  goBack: 'browser:go-back',
  goForward: 'browser:go-forward',
  reload: 'browser:reload',
  stop: 'browser:stop',
  newTab: 'browser:new-tab',
  closeTab: 'browser:close-tab',
  activateTab: 'browser:activate-tab',
  stateChanged: 'browser:state-changed',
} as const;

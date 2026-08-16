/**
 * ShieldCoordinator: wires the platform-agnostic ShieldEngine onto Electron's
 * request pipeline.
 *
 * Responsibilities:
 * - Observes every web request on the shared session, builds a typed
 *   ShieldRequest, evaluates it, records statistics, and cancels requests the
 *   Shield decides to block.
 * - Tracks the currently viewed site from the active tab so per-site settings
 *   are honored (explicitly and never silently).
 * - Exposes a minimal IPC surface for the Shield UI (panel + site settings)
 *   and pushes panel state only while the panel is open, throttled, so the
 *   filter never spams the renderer.
 *
 * This is the browser's own controlled request pipeline: nothing here touches
 * third-party servers, bypasses website security, or defeats any site's
 * protection mechanisms.
 */

import { ipcMain, type Session, type WebContents } from 'electron';
import {
  ShieldEngine,
  demoFilterList,
  hostnameFromUrl,
  isValidHostname,
  normalizeHostname,
  originFromUrl,
  type ResourceType,
  type ShieldMode,
  type ShieldRequest,
  type TabManager,
} from '@shodasha/core';
import { IPC, type ShieldPanelState } from '../shared/browserState.js';

export interface ShieldCoordinatorOptions {
  /** The session whose requests the Shield filters (shared default session). */
  readonly session: Session;
  /** The chrome webContents used to push panel state to the UI. */
  readonly chrome: WebContents;
}

/** Electron's onBeforeRequest resourceType → Shield ResourceType mapping. */
const ELECTRON_RESOURCE_TYPES: Record<string, ResourceType> = {
  mainFrame: 'document',
  subFrame: 'document',
  stylesheet: 'stylesheet',
  script: 'script',
  image: 'image',
  font: 'font',
  media: 'media',
  websocket: 'websocket',
  xhr: 'xhr',
  fetch: 'xhr',
  beacon: 'xhr',
  csp_report: 'other',
  ping: 'other',
  other: 'other',
};

/** Panel pushes are throttled to avoid unnecessary IPC during traffic. */
const PANEL_PUSH_THROTTLE_MS = 500;

/** The number of recent events shown in the panel (privacy-safe metadata). */
const MAX_RECENT_EVENTS_SHOWN = 8;

let requestCounter = 0;

export class ShieldCoordinator {
  private readonly engine = new ShieldEngine();
  private readonly session: Session;
  private readonly chrome: WebContents;
  private manager: TabManager | null = null;
  private panelSubscribed = false;
  private lastPanelPush = 0;
  private disposed = false;

  public constructor(options: ShieldCoordinatorOptions) {
    this.session = options.session;
    this.chrome = options.chrome;
    this.installIpcHandlers();
    this.installRequestFilter();
    // Ship the deterministic local test list (reserved .test domains only).
    // Real lists are imported separately with their license documented; the
    // Shield never bundles unverified third-party content.
    this.engine.addList(demoFilterList);
  }

  /**
   * Attaches the tab manager for the current window so the Shield can derive
   * the currently viewed site. Called for each window; the most recent window
   * wins (single-window is the normal desktop case).
   */
  public attachManager(manager: TabManager): void {
    this.manager = manager;
    manager.subscribe(() => {
      this.pushPanelState();
    });
  }

  /** Releases resources. The coordinator is app-scoped, so this is optional. */
  public dispose(): void {
    this.disposed = true;
    this.panelSubscribed = false;
  }

  // ------------------------------------------------------------ IPC

  private installIpcHandlers(): void {
    ipcMain.handle(IPC.shieldGetState, () => this.serializePanelState());

    ipcMain.handle(IPC.shieldSetEnabled, (_e, enabled: unknown) => {
      this.engine.setEnabled(enabled === true);
      this.pushPanelState();
    });

    ipcMain.handle(IPC.shieldSetMode, (_e, mode: unknown) => {
      if (isShieldMode(mode)) {
        this.engine.setMode(mode);
        this.pushPanelState();
      }
    });

    ipcMain.handle(IPC.shieldSetSiteSetting, (_e, site: unknown, setting: unknown) => {
      this.handleSiteSetting(site, setting);
    });

    ipcMain.handle(IPC.shieldToggleAllowlist, (_e, site: unknown) => {
      this.handleToggleAllowlist(site);
    });

    ipcMain.on(IPC.shieldSubscribe, () => {
      this.panelSubscribed = true;
      this.pushPanelState();
    });

    ipcMain.on(IPC.shieldUnsubscribe, () => {
      this.panelSubscribed = false;
    });
  }

  private handleSiteSetting(site: unknown, setting: unknown): void {
    const host = shieldSiteOf(site);
    if (host === null) {
      return;
    }
    const parsed =
      typeof setting === 'object' && setting !== null
        ? (setting as Record<string, unknown>)
        : {};
    const enabled = parsed.enabled;
    const mode = parsed.mode;
    this.engine.setSiteSetting(host, {
      ...(typeof enabled === 'boolean' ? { enabled } : {}),
      ...(isShieldMode(mode) ? { mode } : {}),
    });
    this.pushPanelState();
  }

  private handleToggleAllowlist(site: unknown): void {
    const host = shieldSiteOf(site);
    if (host === null) {
      return;
    }
    this.engine.toggleAllowlist(host);
    this.pushPanelState();
  }

  // ---------------------------------------------------- request filter

  private installRequestFilter(): void {
    this.session.webRequest.onBeforeRequest((details, callback) => {
      if (this.disposed) {
        callback({ cancel: false });
        return;
      }
      const request = this.buildRequest(details);
      if (request === null) {
        callback({ cancel: false });
        return;
      }
      const decision = this.engine.evaluate(request, {
        currentSite: this.currentSiteHostname(),
      });
      this.maybePushPanelThrottled();
      callback({ cancel: decision.kind === 'block' });
    });
  }

  private buildRequest(
    details: Electron.OnBeforeRequestListenerDetails,
  ): ShieldRequest | null {
    const url = details.url;
    if (!isFilterableRequest(url, details.resourceType)) {
      return null;
    }
    const hostname = hostnameFromUrl(url);
    if (hostname === null) {
      return null;
    }
    requestCounter += 1;
    return {
      id: `shield-req-${String(requestCounter)}`,
      url,
      hostname,
      origin: originFromUrl(url),
      firstPartyOrigin: this.currentSiteOrigin(),
      resourceType: mapElectronResourceType(details.resourceType),
      method: details.method.toUpperCase(),
      timestamp: Date.now(),
      tabId:
        details.webContentsId !== undefined
          ? String(details.webContentsId)
          : null,
    };
  }

  /** The hostname of the site currently being viewed, or null. */
  private currentSiteHostname(): string | null {
    const active = this.manager?.activeTab ?? null;
    if (active === null) {
      return null;
    }
    return hostnameFromUrl(active.url);
  }

  /** The origin of the currently viewed page, or null. */
  private currentSiteOrigin(): string | null {
    const active = this.manager?.activeTab ?? null;
    if (active === null) {
      return null;
    }
    return /^https?:\/\//i.test(active.url) ? originFromUrl(active.url) : null;
  }

  // --------------------------------------------------------- panel push

  private serializePanelState(): ShieldPanelState {
    const site = this.currentSiteHostname();
    return {
      enabled: this.engine.enabled,
      mode: this.engine.mode,
      stats: this.engine.stats,
      currentSite: site,
      siteEnabled: site === null ? true : this.engine.isSiteEnabled(site),
      siteMode:
        site === null ? this.engine.mode : this.engine.getSiteSetting(site).mode,
      siteAllowlisted: site === null ? false : this.engine.isAllowlisted(site),
      siteStats: site === null ? null : this.engine.siteStatsFor(site),
      recentEvents: this.engine.recentEvents.slice(0, MAX_RECENT_EVENTS_SHOWN),
    };
  }

  private maybePushPanelThrottled(): void {
    if (!this.panelSubscribed || this.disposed) {
      return;
    }
    const now = Date.now();
    if (now - this.lastPanelPush < PANEL_PUSH_THROTTLE_MS) {
      return;
    }
    this.lastPanelPush = now;
    this.pushPanelState();
  }

  private pushPanelState(): void {
    if (!this.panelSubscribed || this.disposed) {
      return;
    }
    if (this.chrome.isDestroyed()) {
      return;
    }
    this.chrome.send(IPC.shieldPanelChanged, this.serializePanelState());
  }
}

/** Whether a request URL should be inspected by the Shield. */
function isFilterableRequest(url: string, resourceType: string): boolean {
  if (resourceType === 'websocket') {
    return true;
  }
  return /^https?:\/\//i.test(url);
}

/** Maps an Electron resource type string to a Shield resource type. */
function mapElectronResourceType(type: string): ResourceType {
  return ELECTRON_RESOURCE_TYPES[type] ?? 'other';
}

/** Interprets a site value (hostname or URL) for per-site settings. */
function shieldSiteOf(site: unknown): string | null {
  if (typeof site !== 'string' || site.length === 0) {
    return null;
  }
  // Accept both a bare hostname and a full URL.
  const host = hostnameFromUrl(site) ?? normalizeHostname(site);
  return isValidHostname(host) ? host : null;
}

function isShieldMode(value: unknown): value is ShieldMode {
  return value === 'standard' || value === 'strict' || value === 'custom';
}

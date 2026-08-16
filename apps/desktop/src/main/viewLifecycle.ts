/**
 * Lifecycle helpers for tab views.
 *
 * Tab views are torn down from several paths (tab close, window close, an
 * externally destroyed renderer), and Electron destroys views/windows
 * asynchronously underneath us. These helpers make destruction safe to run
 * more than once and safe to run against partially destroyed Electron
 * objects, without ever calling methods on destroyed objects.
 *
 * The module deliberately avoids importing Electron so it stays unit-testable
 * with plain fakes; the interfaces are the structural subset of the Electron
 * types the helpers rely on.
 */

/** The subset of a tab webContents that destruction needs. */
export interface WebContentsLike {
  isDestroyed(): boolean;
  close(options: { waitForBeforeUnload: boolean }): void;
}

/** The subset of the owning BrowserWindow that destruction needs. */
export interface WindowLike {
  isDestroyed(): boolean;
  contentView: {
    removeChildView(view: unknown): void;
  };
}

/** A live tab view plus the state destruction needs to be idempotent. */
export interface LiveTabLifecycle {
  readonly view: unknown;
  /**
   * Cached webContents reference. A cached reference keeps `isDestroyed()`
   * callable even after the view itself is gone.
   */
  readonly wc: WebContentsLike;
  /** Whether the view is currently attached to the window's content view. */
  attached: boolean;
}

/**
 * Detaches and closes a tab view, tolerating every destroyed state.
 *
 * Safe to call:
 * - more than once for the same tab
 * - after the webContents has already been destroyed
 * - after the owning window has already been destroyed
 *
 * Never throws and never calls methods on destroyed Electron objects.
 */
export function destroyViewSafely(
  live: LiveTabLifecycle,
  owner: WindowLike,
): void {
  const webContentsDestroyed = live.wc.isDestroyed();
  if (!webContentsDestroyed && !owner.isDestroyed() && live.attached) {
    owner.contentView.removeChildView(live.view);
  }
  live.attached = false;
  if (!webContentsDestroyed) {
    live.wc.close({ waitForBeforeUnload: false });
  }
}

/**
 * Cleans up a tab whose webContents was destroyed externally (renderer crash,
 * window teardown). Removes the stale reference so later cleanup never touches
 * the destroyed object. Never triggers further destruction itself, so it
 * cannot recurse. Returns the removed tab, or null when nothing was removed.
 */
export function handleViewDestroyed<T extends LiveTabLifecycle>(
  id: string,
  liveTabs: Map<string, T>,
): T | null {
  const live = liveTabs.get(id);
  if (live === undefined) {
    return null;
  }
  live.attached = false;
  liveTabs.delete(id);
  return live;
}
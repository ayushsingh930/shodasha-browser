/**
 * Browser keyboard shortcuts.
 *
 * Shared between the main process (where the shortcut is pressed while a page
 * view has focus) and the renderer chrome (where it is pressed while the
 * toolbar, tab bar, or address bar has focus). A single pure mapping keeps the
 * behavior identical in both places.
 *
 * Only the browser's own shortcuts are intercepted. Everything else is left to
 * the website or the chrome UI, so normal keyboard behavior is preserved.
 */

/** The browser actions that can be triggered by a keyboard shortcut. */
export type ShortcutAction =
  | 'new-tab'
  | 'close-tab'
  | 'reopen-tab'
  | 'next-tab'
  | 'prev-tab'
  | 'focus-address'
  | 'reload'
  | 'hard-reload'
  | 'toggle-bookmarks-bar'
  | 'open-history'
  | 'open-downloads';

/** A normalized view of a key event (shared across Electron and DOM). */
export interface ShortcutInput {
  /** The key value, e.g. `'t'`, `'Tab'`, `'F5'`. */
  readonly key: string;
  /** Whether Ctrl (or Cmd on macOS) is held. */
  readonly ctrl: boolean;
  /** Whether Shift is held. */
  readonly shift: boolean;
  /** Whether Alt is held. */
  readonly alt: boolean;
  /** Whether the Cmd (or Win) key is held. */
  readonly meta: boolean;
  /** The event type: `keyDown`, `keydown`, etc. */
  readonly type: string;
}

/**
 * Maps a key event to a browser shortcut action, or `null` when the event is
 * not a browser shortcut and should be left alone.
 */
export function shortcutActionFor(input: ShortcutInput): ShortcutAction | null {
  if (input.type !== 'keyDown' && input.type !== 'keydown') {
    return null;
  }
  const ctrl = input.ctrl || input.meta;
  if (!ctrl && input.key !== 'F5' && input.key !== 'f5') {
    return null;
  }
  const key = input.key.toLowerCase();

  if (ctrl) {
    if (key === 't') {
      return input.shift ? 'reopen-tab' : 'new-tab';
    }
    if (key === 'w' && !input.shift) {
      return 'close-tab';
    }
    if (key === 'tab') {
      return input.shift ? 'prev-tab' : 'next-tab';
    }
    if (key === 'l' && !input.shift) {
      return 'focus-address';
    }
    if (key === 'r') {
      return input.shift ? 'hard-reload' : 'reload';
    }
    if (key === 'b' && input.shift) {
      return 'toggle-bookmarks-bar';
    }
    if (key === 'h' && !input.shift) {
      return 'open-history';
    }
    if (key === 'j' && !input.shift) {
      return 'open-downloads';
    }
    return null;
  }

  if (key === 'f5') {
    return 'reload';
  }
  return null;
}

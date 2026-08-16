import { describe, expect, it } from 'vitest';
import { shortcutActionFor, type ShortcutInput } from './shortcuts.js';

function key(overrides: Partial<ShortcutInput>): ShortcutInput {
  return {
    key: '',
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
    type: 'keyDown',
    ...overrides,
  };
}

describe('shortcutActionFor', () => {
  it('maps Ctrl+T to new-tab', () => {
    expect(shortcutActionFor(key({ key: 't', ctrl: true }))).toBe('new-tab');
    expect(shortcutActionFor(key({ key: 'T', ctrl: true }))).toBe('new-tab');
  });

  it('maps Ctrl+Shift+T to reopen-tab', () => {
    expect(shortcutActionFor(key({ key: 't', ctrl: true, shift: true }))).toBe(
      'reopen-tab',
    );
  });

  it('maps Ctrl+W to close-tab', () => {
    expect(shortcutActionFor(key({ key: 'w', ctrl: true }))).toBe('close-tab');
  });

  it('maps Ctrl+Tab to next-tab', () => {
    expect(shortcutActionFor(key({ key: 'Tab', ctrl: true }))).toBe('next-tab');
  });

  it('maps Ctrl+Shift+Tab to prev-tab', () => {
    expect(shortcutActionFor(key({ key: 'Tab', ctrl: true, shift: true }))).toBe(
      'prev-tab',
    );
  });

  it('maps Ctrl+L to focus-address', () => {
    expect(shortcutActionFor(key({ key: 'l', ctrl: true }))).toBe('focus-address');
  });

  it('maps Ctrl+R to reload', () => {
    expect(shortcutActionFor(key({ key: 'r', ctrl: true }))).toBe('reload');
  });

  it('maps Ctrl+Shift+R to hard-reload', () => {
    expect(shortcutActionFor(key({ key: 'r', ctrl: true, shift: true }))).toBe(
      'hard-reload',
    );
  });

  it('maps Ctrl+Shift+B to toggle-bookmarks-bar', () => {
    expect(
      shortcutActionFor(key({ key: 'b', ctrl: true, shift: true })),
    ).toBe('toggle-bookmarks-bar');
  });

  it('maps F5 to reload', () => {
    expect(shortcutActionFor(key({ key: 'F5' }))).toBe('reload');
    expect(shortcutActionFor(key({ key: 'f5' }))).toBe('reload');
  });

  it('treats Cmd as Ctrl on macOS-style input', () => {
    expect(shortcutActionFor(key({ key: 't', meta: true }))).toBe('new-tab');
    expect(shortcutActionFor(key({ key: 'w', meta: true }))).toBe('close-tab');
  });

  it('ignores key-up events', () => {
    expect(shortcutActionFor(key({ key: 't', ctrl: true, type: 'keyUp' }))).toBeNull();
    expect(shortcutActionFor(key({ key: 'r', ctrl: true, type: 'char' }))).toBeNull();
  });

  it('leaves non-shortcut keys alone', () => {
    expect(shortcutActionFor(key({ key: 'a', ctrl: true }))).toBeNull();
    expect(shortcutActionFor(key({ key: 'Enter' }))).toBeNull();
    expect(shortcutActionFor(key({ key: 'Tab' }))).toBeNull();
    expect(shortcutActionFor(key({ key: 't' }))).toBeNull();
    expect(shortcutActionFor(key({ key: 'r' }))).toBeNull();
    expect(shortcutActionFor(key({ key: 'z', ctrl: true }))).toBeNull();
  });

  it('does not map Ctrl+Shift+W or Ctrl+Shift+L', () => {
    expect(shortcutActionFor(key({ key: 'w', ctrl: true, shift: true }))).toBeNull();
    expect(shortcutActionFor(key({ key: 'l', ctrl: true, shift: true }))).toBeNull();
  });

  it('does not map Ctrl+B (without shift) to bookmarks', () => {
    expect(shortcutActionFor(key({ key: 'b', ctrl: true }))).toBeNull();
  });
});

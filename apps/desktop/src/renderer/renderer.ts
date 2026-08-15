/**
 * SHODASHA desktop - renderer entry.
 *
 * Runs inside the sandboxed renderer with context isolation. It may only use
 * the minimal surface exposed by the preload (`window.shodasha`).
 */

interface ShodashaBridge {
  platform: string;
  versions: {
    electron: string;
    chrome: string;
    node: string;
  };
}

declare global {
  interface Window {
    shodasha?: ShodashaBridge;
  }
}

const status = document.querySelector<HTMLParagraphElement>('#status-text');

function render(): void {
  const bridge = window.shodasha;
  if (status === null) {
    return;
  }
  if (bridge === undefined) {
    status.textContent = 'Preload bridge unavailable.';
    return;
  }
  status.textContent =
    `Running on ${bridge.platform} · Electron ${bridge.versions.electron} · ` +
    `Chromium ${bridge.versions.chrome}`;
}

render();

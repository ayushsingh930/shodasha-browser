/**
 * SHODASHA download data model and pure helpers.
 *
 * A download entry is a privacy-safe record of a file download: the source
 * URL, the final filename and save path chosen by the host, progress counters,
 * timestamps, an error message when the download failed, and the mime type.
 * It never stores file contents, cookies, auth tokens, or any other sensitive
 * data, and it never leaves the device.
 *
 * This module is pure and host-agnostic: no filesystem, no Electron, no DOM.
 * Path construction is deliberately left to the host so the core can never
 * be used to reach outside the host's chosen download directory.
 */

/** The lifecycle state of a download. */
export type DownloadState =
  | 'pending'
  | 'progressing'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'failed';

/** The terminal states — a download can never leave these. */
export const TERMINAL_DOWNLOAD_STATES: readonly DownloadState[] = [
  'completed',
  'cancelled',
  'failed',
];

/** The active (non-terminal) states. */
export const ACTIVE_DOWNLOAD_STATES: readonly DownloadState[] = [
  'pending',
  'progressing',
  'paused',
];

/** A single download record. */
export interface DownloadItem {
  /** Stable, unique id (never the URL). */
  readonly id: string;
  /** The source URL the file was downloaded from. */
  readonly url: string;
  /** The final filename written to disk (host-sanitized and uniquified). */
  readonly filename: string;
  /** The absolute path the file was saved to. */
  readonly savePath: string;
  readonly state: DownloadState;
  /** Bytes received so far. */
  readonly receivedBytes: number;
  /** Total bytes when known, or 0 when the server gave no length. */
  readonly totalBytes: number;
  /** When the download started (epoch milliseconds). */
  readonly startedAt: number;
  /** When the download reached a terminal state, or null. */
  readonly completedAt: number | null;
  /** A friendly error message when the download failed, or null. */
  readonly error: string | null;
  /** The reported mime type, or null when unknown. */
  readonly mimeType: string | null;
  /** Whether the filename marks an executable/script (safety display). */
  readonly executable: boolean;
}

/** The full download collection (also the persistence format). */
export interface DownloadCollection {
  readonly version: 1;
  readonly items: readonly DownloadItem[];
}

/** The current collection format version. */
export const DOWNLOAD_COLLECTION_VERSION = 1 as const;

/** The maximum length of a stored filename (before extension). */
export const MAX_DOWNLOAD_FILENAME_LENGTH = 200;

/** The maximum number of download records retained (oldest finished trimmed). */
export const MAX_DOWNLOAD_ITEMS = 500;

/** Generates a stable, unique id for a download. */
export function createDownloadId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `dl_${time}${rand}`;
}

/**
 * Whether a URL is a valid download source. Only `http:`/`https:` are
 * accepted — never `javascript:`, `data:`, `file:`, or any other scheme that
 * could turn a download record into an execution or privilege vector.
 */
export function isValidDownloadUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return false;
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      parsed.hostname.length > 0
    );
  } catch {
    return false;
  }
}

/**
 * Sanitizes a suggested download filename into a safe, single-component
 * basename the host may write to disk.
 *
 * - Directory components (`/`, `\`) are stripped so `..`/`.` traversal is
 *   impossible.
 * - Invalid Windows filename characters and control characters are removed.
 * - Leading/trailing dots and spaces are trimmed (Windows hides/forbids them).
 * - Windows reserved device names (`CON`, `NUL`, `COM1`, …) are prefixed.
 * - Overlong names are truncated while preserving a short extension.
 * - Empty results fall back to `download`.
 */
export function sanitizeFilename(name: string): string {
  let clean = String(name ?? '').replace(/[\\/]+/g, '/');
  const lastSlash = clean.lastIndexOf('/');
  if (lastSlash >= 0) {
    clean = clean.slice(lastSlash + 1);
  }
  clean = clean
    .replace(/[<>:"/\\|?*\u0000-\u001f\u007f]/g, '')
    .replace(/^[. ]+/, '')
    .replace(/[. ]+$/, '');
  if (clean.length === 0) {
    return 'download';
  }
  const stem = clean.split('.')[0] ?? '';
  if (WINDOWS_RESERVED_NAMES.has(stem.toUpperCase())) {
    clean = `_${clean}`;
  }
  const extIndex = clean.lastIndexOf('.');
  const extension = extIndex > 0 ? clean.slice(extIndex) : '';
  if (extension.length <= 12 && clean.length > MAX_DOWNLOAD_FILENAME_LENGTH) {
    const maxStem = MAX_DOWNLOAD_FILENAME_LENGTH - extension.length;
    clean = `${clean.slice(0, maxStem)}${extension}`;
  } else if (clean.length > MAX_DOWNLOAD_FILENAME_LENGTH) {
    clean = clean.slice(0, MAX_DOWNLOAD_FILENAME_LENGTH);
  }
  return clean;
}

/** Windows reserved device names that cannot be used as filenames. */
const WINDOWS_RESERVED_NAMES = new Set([
  'CON',
  'PRN',
  'AUX',
  'NUL',
  'COM1',
  'COM2',
  'COM3',
  'COM4',
  'COM5',
  'COM6',
  'COM7',
  'COM8',
  'COM9',
  'LPT1',
  'LPT2',
  'LPT3',
  'LPT4',
  'LPT5',
  'LPT6',
  'LPT7',
  'LPT8',
  'LPT9',
]);

/**
 * Chooses a non-destructive filename when `name` is already taken: appends
 * ` (1)`, ` (2)`, … before the extension. Existing user files are never
 * overwritten.
 */
export function uniqueFilename(
  existing: ReadonlySet<string>,
  name: string,
): string {
  if (!existing.has(name)) {
    return name;
  }
  const extIndex = name.lastIndexOf('.');
  const base = extIndex > 0 ? name.slice(0, extIndex) : name;
  const extension = extIndex > 0 ? name.slice(extIndex) : '';
  let counter = 1;
  let candidate = `${base} (${counter})${extension}`;
  while (existing.has(candidate)) {
    counter += 1;
    candidate = `${base} (${counter})${extension}`;
  }
  return candidate;
}

/**
 * Whether a filename looks like an executable/script format. Used only to
 * surface a safety hint in the UI — never as an antivirus verdict, never to
 * decide blocking, and never to auto-open.
 */
export function isExecutableFilename(name: string): boolean {
  const lower = name.toLowerCase().trim();
  for (const ext of EXECUTABLE_EXTENSIONS) {
    if (lower.endsWith(ext)) {
      return true;
    }
  }
  return false;
}

/** Common executable/script extensions surfaced as a safety hint. */
const EXECUTABLE_EXTENSIONS = [
  '.exe',
  '.msi',
  '.bat',
  '.cmd',
  '.com',
  '.scr',
  '.vbs',
  '.vbe',
  '.js',
  '.jse',
  '.jar',
  '.ps1',
  '.psm1',
  '.cpl',
  '.pif',
  '.hta',
  '.wsf',
  '.wsh',
];

/**
 * Case-insensitive local search across download filename and source URL.
 * Never leaves the device.
 */
export function searchDownloads(
  items: readonly DownloadItem[],
  query: string,
): DownloadItem[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) {
    return [...items];
  }
  return items.filter((item) => {
    return (
      item.filename.toLowerCase().includes(needle) ||
      item.url.toLowerCase().includes(needle)
    );
  });
}

/** Formats a byte count into a compact human-readable string. */
export function formatBytes(bytes: number): string {
  const value = typeof bytes === 'number' && Number.isFinite(bytes) ? bytes : 0;
  if (value < 1024) {
    return `${Math.max(0, Math.floor(value))} B`;
  }
  const units = ['KB', 'MB', 'GB', 'TB'];
  let amount = value;
  let unit = 'B';
  for (const next of units) {
    if (amount < 1024) {
      break;
    }
    amount /= 1024;
    unit = next;
  }
  const digits = amount >= 100 ? 0 : amount >= 10 ? 1 : 2;
  const text = amount.toFixed(digits).replace(/\.?0+$/, '');
  return `${text} ${unit}`;
}
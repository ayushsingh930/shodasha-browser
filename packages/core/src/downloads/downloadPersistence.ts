/**
 * Download persistence.
 *
 * Persisted download data is never trusted: every value is re-validated on
 * load. Structurally invalid files, malformed entries, invalid URLs, missing
 * fields, and unknown states are all handled without crashing the browser.
 * Valid entries are always preserved.
 *
 * The serialized format is the stable JSON format:
 *
 * ```json
 * { "version": 1, "items": [] }
 * ```
 *
 * Only download metadata is persisted — never file contents.
 */

import {
  isValidDownloadUrl,
  sanitizeFilename,
  type DownloadCollection,
  type DownloadItem,
  type DownloadState,
} from './downloadModel.js';

const VALID_STATES: readonly DownloadState[] = [
  'pending',
  'progressing',
  'paused',
  'completed',
  'cancelled',
  'failed',
];

/** Parses a non-negative number field, falling back to the default. */
function parseCount(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}

/** Parses a timestamp field, falling back to the provided default. */
function parseTimestamp(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

/** Parses and validates a single download record. Returns null when unusable. */
function parseItem(raw: unknown): DownloadItem | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const source = raw as Record<string, unknown>;
  if (typeof source.url !== 'string' || !isValidDownloadUrl(source.url)) {
    return null;
  }
  if (typeof source.savePath !== 'string' || source.savePath.length === 0) {
    return null;
  }
  const now = Date.now();
  const rawState = source.state;
  const state: DownloadState = VALID_STATES.includes(rawState as DownloadState)
    ? (rawState as DownloadState)
    : 'cancelled';
  const startedAt = parseTimestamp(source.startedAt, now);
  const completedAt =
    typeof source.completedAt === 'number' &&
    Number.isFinite(source.completedAt) &&
    source.completedAt >= 0
      ? source.completedAt
      : null;
  return {
    id:
      typeof source.id === 'string' && source.id.length > 0
        ? source.id
        : `dl_${Math.random().toString(36).slice(2, 12)}`,
    url: source.url.trim(),
    filename: sanitizeFilename(
      typeof source.filename === 'string' ? source.filename : 'download',
    ),
    savePath: source.savePath,
    state,
    receivedBytes: parseCount(source.receivedBytes, 0),
    totalBytes: parseCount(source.totalBytes, 0),
    startedAt,
    completedAt,
    error:
      typeof source.error === 'string'
        ? source.error.slice(0, 300)
        : null,
    mimeType:
      typeof source.mimeType === 'string' ? source.mimeType : null,
    executable:
      typeof source.executable === 'boolean' ? source.executable : false,
  };
}

/**
 * Parses and validates unknown data into a {@link DownloadCollection}. Never
 * throws. Missing or malformed roots yield an empty collection; individual
 * invalid records are dropped; valid data is always preserved. Records are
 * returned newest-first.
 */
export function parseDownloadCollection(raw: unknown): DownloadCollection {
  if (typeof raw !== 'object' || raw === null) {
    return { version: 1, items: [] };
  }
  const source = raw as Record<string, unknown>;
  const items: DownloadItem[] = [];
  if (Array.isArray(source.items)) {
    const seenIds = new Set<string>();
    for (const item of source.items) {
      const parsed = parseItem(item);
      if (parsed !== null && !seenIds.has(parsed.id)) {
        seenIds.add(parsed.id);
        items.push(parsed);
      }
    }
  }
  items.sort((a, b) => b.startedAt - a.startedAt);
  return { version: 1, items };
}

/** Serializes a collection to the stable JSON format. */
export function serializeDownloadCollection(
  collection: DownloadCollection,
): string {
  return JSON.stringify(
    {
      version: 1,
      items: collection.items,
    },
    null,
    2,
  );
}

/** An empty, valid collection. */
export function emptyDownloadCollection(): DownloadCollection {
  return { version: 1, items: [] };
}
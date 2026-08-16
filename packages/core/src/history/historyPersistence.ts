/**
 * History persistence.
 *
 * Persisted history data is never trusted: every value is re-validated on
 * load. Structurally invalid files, malformed entries, invalid URLs, missing
 * fields, and out-of-range timestamps are all handled without crashing the
 * browser. Valid entries are always preserved.
 *
 * The serialized format is the stable JSON format:
 *
 * ```json
 * { "version": 1, "entries": [] }
 * ```
 */

import {
  isValidHistoryUrl,
  isValidHistoryFavicon,
  type HistoryCollection,
  type HistoryEntry,
} from './historyModel.js';

/** Parses a timestamp field, falling back to the provided default. */
function parseTimestamp(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : fallback;
}

/** Parses and validates a single history entry. Returns null when unusable. */
function parseEntry(raw: unknown): HistoryEntry | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }
  const source = raw as Record<string, unknown>;
  if (typeof source.url !== 'string' || !isValidHistoryUrl(source.url)) {
    return null;
  }
  const now = Date.now();
  return {
    id:
      typeof source.id === 'string' && source.id.length > 0
        ? source.id
        : `he_${Math.random().toString(36).slice(2, 12)}`,
    url: source.url.trim(),
    title:
      typeof source.title === 'string'
        ? source.title.slice(0, 500)
        : '',
    visitedAt: parseTimestamp(source.visitedAt, now),
    favicon: isValidHistoryFavicon(source.favicon) ? source.favicon : null,
  };
}

/**
 * Parses and validates unknown data into a {@link HistoryCollection}. Never
 * throws. Missing or malformed roots yield an empty collection; individual
 * invalid entries are dropped; valid data is always preserved. Entries are
 * returned newest-first.
 */
export function parseHistoryCollection(raw: unknown): HistoryCollection {
  if (typeof raw !== 'object' || raw === null) {
    return { version: 1, entries: [] };
  }
  const source = raw as Record<string, unknown>;
  const entries: HistoryEntry[] = [];
  if (Array.isArray(source.entries)) {
    const seenIds = new Set<string>();
    for (const item of source.entries) {
      const entry = parseEntry(item);
      if (entry !== null && !seenIds.has(entry.id)) {
        seenIds.add(entry.id);
        entries.push(entry);
      }
    }
  }
  entries.sort((a, b) => b.visitedAt - a.visitedAt);
  return { version: 1, entries };
}

/** Serializes a collection to the stable JSON format. */
export function serializeHistoryCollection(
  collection: HistoryCollection,
): string {
  return JSON.stringify(
    {
      version: 1,
      entries: collection.entries,
    },
    null,
    2,
  );
}

/** An empty, valid collection. */
export function emptyHistoryCollection(): HistoryCollection {
  return { version: 1, entries: [] };
}

/**
 * URL parsing, validation, and address-bar input classification.
 *
 * This module decides what happens when a user types into the address bar:
 * - a valid URL → navigate
 * - anything else  → treat as a search query
 *
 * It is deliberately platform-agnostic so it can be unit-tested and reused by
 * any host (Electron, future Android).
 */

/** Schemes SHODASHA is allowed to load directly. */
const ALLOWED_SCHEMES: ReadonlySet<string> = new Set(['http:', 'https:']);

/**
 * The kind of input the user typed in the address bar.
 */
export type AddressInputKind = 'url' | 'search';

/** The result of interpreting address-bar input. */
export interface AddressInput {
  /** Whether the input was a URL or a search query. */
  readonly kind: AddressInputKind;
  /** The validated URL when `kind === 'url'`, otherwise `null`. */
  readonly url: string | null;
  /** The normalized search query when `kind === 'search'`, otherwise `null`. */
  readonly query: string | null;
}

/**
 * Returns `true` if the string looks like it has an explicit URI scheme
 * (e.g. `http:`, `https:`, `about:`, `ftp:`).
 */
export function hasScheme(input: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(input.trim());
}

/**
 * Attempts to parse `input` as an absolute, web-loadable URL.
 *
 * Accepts fully-qualified URLs with an explicit `http:` or `https:` scheme,
 * and bare hostnames (e.g. `example.com`) which are treated as `https://`.
 * Returns `null` when the input cannot be a navigable web URL.
 */
export function parseWebUrl(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return null;
  }

  let candidate: string;
  if (hasScheme(trimmed)) {
    candidate = trimmed;
  } else {
    // A bare string is only treated as a hostname if it has no spaces and
    // looks like a domain (contains a dot and no spaces).
    if (/\s/.test(trimmed) || !trimmed.includes('.')) {
      return null;
    }
    candidate = `https://${trimmed}`;
  }

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (!ALLOWED_SCHEMES.has(url.protocol)) {
    return null;
  }
  if (url.hostname.length === 0) {
    return null;
  }
  return url.toString();
}

/**
 * Interprets address-bar input as either a navigable URL or a search query.
 *
 * @param input - Raw text from the address bar.
 * @param searchEngineUrl - The configured search engine template (see
 *   `buildSearchUrl`). Used only to classify; if absent, defaults to search.
 * @returns An {@link AddressInput} describing how to handle the input.
 */
export function classifyAddressInput(input: string): AddressInput {
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    return { kind: 'search', url: null, query: null };
  }

  const url = parseWebUrl(trimmed);
  if (url !== null) {
    return { kind: 'url', url, query: null };
  }
  return { kind: 'search', url: null, query: trimmed };
}

/**
 * Returns the security-relevant scheme label of a URL for display purposes.
 * Returns `null` for non-web URLs (e.g. `about:`).
 */
export function webSchemeOf(url: string): 'http' | 'https' | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') {
      return 'https';
    }
    if (parsed.protocol === 'http:') {
      return 'http';
    }
  } catch {
    return null;
  }
  return null;
}

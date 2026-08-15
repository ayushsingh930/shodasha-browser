/**
 * Hostname utilities for the Shield.
 *
 * All matching operates on normalized, lowercased hostnames. Validation is
 * deliberately strict so malformed patterns cannot create unexpected bypasses:
 * schemes, ports, paths, query strings, fragments, wildcards, and whitespace
 * are rejected in rule/allowlist values.
 */

/** Normalizes a hostname for comparison (trim + lowercase). */
export function normalizeHostname(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Returns `true` if `value` is a valid hostname for the Shield. Accepts DNS
 * names (letters, digits, hyphens) and dotted IP addresses; rejects schemes,
 * ports, paths, query strings, fragments, wildcards, whitespace, and empty or
 * malformed labels.
 */
export function isValidHostname(value: string): boolean {
  if (value.length === 0 || value.length > 253) {
    return false;
  }
  if (/[\s:/?#*\\@]/.test(value)) {
    return false;
  }
  if (value.startsWith('.') || value.endsWith('.')) {
    return false;
  }
  const labels = value.split('.');
  for (const label of labels) {
    if (label.length === 0 || label.length > 63) {
      return false;
    }
    if (!/^[a-z0-9-]+$/i.test(label)) {
      return false;
    }
    if (label.startsWith('-') || label.endsWith('-')) {
      return false;
    }
  }
  return true;
}

/**
 * Yields the hostname and every parent domain, longest first. Used for
 * efficient domain-rule and allowlist matching.
 *
 * `a.b.example.com` → `["a.b.example.com", "b.example.com", "example.com", "com"]`
 */
export function parentDomains(hostname: string): string[] {
  const result: string[] = [];
  let current = hostname;
  result.push(current);
  let index = current.indexOf('.');
  while (index !== -1) {
    current = current.slice(index + 1);
    result.push(current);
    index = current.indexOf('.');
  }
  return result;
}

/**
 * Extracts the lowercased hostname from a URL string, or `null` when the URL
 * cannot be parsed or has no host. Removes userinfo and port.
 */
export function hostnameFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = normalizeHostname(parsed.hostname);
    return hostname.length === 0 ? null : hostname;
  } catch {
    return null;
  }
}

/**
 * Extracts a simple origin (`scheme://host`) from a URL string, or `null`.
 * The port is omitted; the value is used only for first/third-party
 * classification, which operates on the hostname.
 */
export function originFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const hostname = normalizeHostname(parsed.hostname);
    if (hostname.length === 0) {
      return null;
    }
    return `${parsed.protocol}//${hostname}`;
  } catch {
    return null;
  }
}

/**
 * Whether `hostname` is `site` itself or a subdomain of `site`.
 */
export function sameSite(hostname: string, site: string): boolean {
  const host = normalizeHostname(hostname);
  const base = normalizeHostname(site);
  return host === base || host.endsWith(`.${base}`);
}

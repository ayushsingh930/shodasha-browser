/**
 * URL privacy utilities.
 *
 * SHODASHA performs user-controlled content filtering and privacy
 * enhancement through legitimate means. Stripping well-known tracking query
 * parameters is a standard, transparent privacy feature (used by many
 * reputable browsers) and does not circumvent any security control.
 */

/** A canonical, human-curated list of tracking parameters. */
const TRACKING_PARAMETERS: ReadonlySet<string> = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'utm_cid',
  'utm_reader',
  'fbclid',
  'gclid',
  'dclid',
  'gbraid',
  'wbraid',
  'mc_cid',
  'mc_eid',
  'igshid',
  's_cid',
  'vero_id',
  'vero_conv',
  'vero_placement',
  'yclid',
  'msclkid',
]);

/**
 * Removes known tracking parameters from a URL query string.
 *
 * @param rawUrl - The URL to clean. Must be a valid absolute URL.
 * @returns The cleaned URL, or `null` if the input could not be parsed.
 */
export function stripTrackingParameters(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  const params = url.searchParams;
  let removed = false;

  for (const key of Array.from(params.keys())) {
    if (TRACKING_PARAMETERS.has(key.toLowerCase())) {
      params.delete(key);
      removed = true;
    }
  }

  if (!removed) {
    return rawUrl;
  }

  url.search = params.toString();
  return url.toString();
}

/**
 * Removes the fragment (hash) from a URL.
 *
 * Fragments are often used to carry tracking state and are never sent to the
 * server. Removing them reduces information leakage at navigation time.
 *
 * @param rawUrl - The URL to clean.
 * @returns The URL without its fragment, or `null` if unparsable.
 */
export function stripFragment(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  url.hash = '';
  return url.toString();
}

/**
 * Applies all URL privacy cleanups in a single pass.
 *
 * @param rawUrl - The URL to clean.
 * @returns The cleaned URL or `null` if unparsable.
 */
export function cleanUrl(rawUrl: string): string | null {
  const stripped = stripTrackingParameters(rawUrl);
  if (stripped === null) {
    return null;
  }
  return stripFragment(stripped);
}

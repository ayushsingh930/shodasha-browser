/**
 * First-party / third-party classification.
 *
 * Same-site means the request hostname equals the first-party hostname or is
 * a subdomain of it. A third-party request is *not* assumed to be an ad: it
 * may be a CDN, an analytics beacon, a font, a payment provider, an auth
 * service, or a legitimate API. Filtering is always rule-based — never simply
 * "third-party = block".
 */

import { sameSite } from './hostname.js';

/**
 * Classifies a request as first- or third-party. When the first-party origin
 * is unknown, the request is conservatively classified as third-party but is
 * never blocked for that reason alone.
 */
export function classifyParty(request: {
  readonly hostname: string;
  readonly firstPartyOrigin: string | null;
}): 'first-party' | 'third-party' {
  const firstParty = firstPartyHostname(request.firstPartyOrigin);
  if (firstParty === null) {
    return 'third-party';
  }
  return sameSite(request.hostname, firstParty) ? 'first-party' : 'third-party';
}

/** Extracts a normalized hostname from a first-party origin. */
function firstPartyHostname(origin: string | null): string | null {
  if (origin === null || origin.length === 0) {
    return null;
  }
  try {
    const hostname = new URL(origin).hostname.toLowerCase();
    return hostname.length === 0 ? null : hostname;
  } catch {
    return null;
  }
}

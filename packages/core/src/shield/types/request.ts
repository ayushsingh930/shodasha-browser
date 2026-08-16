/**
 * The SHODASHA Shield request model.
 *
 * A request carries only information legitimately available to the browser or
 * its networking layer. No browsing history, no sensitive payloads, and no
 * remote logging are stored here — just the fields needed to make a filtering
 * decision on the user's own device.
 */

/** The kind of resource a request is loading. Extensible for future types. */
export type ResourceType =
  | 'document'
  | 'script'
  | 'stylesheet'
  | 'image'
  | 'font'
  | 'media'
  | 'websocket'
  | 'xhr'
  | 'other';

/**
 * Whether a request is same-site (first party), cross-site (third party), or
 * undeterminable (`unknown-party` — never guessed).
 */
export type PartyContext = 'first-party' | 'third-party' | 'unknown-party';

/** A single network request, as observed by the browser. */
export interface ShieldRequest {
  /** Host-provided unique identifier for this request. */
  readonly id: string;
  /** The full request URL. */
  readonly url: string;
  /** Lowercased hostname of the request URL (no port). */
  readonly hostname: string;
  /** The request origin (`scheme://host`), when parseable. */
  readonly origin: string | null;
  /** The origin of the page that initiated the request, when known. */
  readonly firstPartyOrigin: string | null;
  /** The resource type of the request. */
  readonly resourceType: ResourceType;
  /** The HTTP method, uppercased. */
  readonly method: string;
  /** Epoch milliseconds at which the request was observed. */
  readonly timestamp: number;
  /** The tab that initiated the request, when known; otherwise `null`. */
  readonly tabId: string | null;
}

/** Context supplied by the host for a single evaluation. */
export interface ShieldContext {
  /** The site currently being viewed (hostname). `null` when unknown. */
  readonly currentSite: string | null;
}

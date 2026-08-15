/**
 * User-friendly navigation error classification.
 *
 * Browser errors are presented to users as short, human-readable messages.
 * Internal error codes and stack traces are NEVER exposed to the user.
 */

/** The category of a navigation error. */
export type NavigationErrorKind =
  | 'invalid-address'
  | 'connection-failed'
  | 'load-failed'
  | 'blocked'
  | 'unknown';

/** A user-facing error description. */
export interface NavigationError {
  /** Stable machine-readable category. */
  readonly kind: NavigationErrorKind;
  /** Short, human-friendly heading for the error page. */
  readonly title: string;
  /** A sentence explaining what happened. */
  readonly message: string;
}

/** Default text for when a page cannot be reached. */
const GENERIC_LOAD_FAILED: NavigationError = {
  kind: 'load-failed',
  title: 'Unable to load this page.',
  message:
    'SHODASHA could not load this page. Check the address and your connection, then try again.',
};

/**
 * Maps an internal navigation failure to a user-friendly message.
 *
 * Electron's `did-fail-load` provides an error code and a description. The
 * raw description may contain technical details, so we classify by category
 * and always return safe, user-friendly copy.
 *
 * @param errorCode - The internal error code (e.g. `-105` for NAME_NOT_RESOLVED).
 * @returns A user-friendly {@link NavigationError}.
 */
export function classifyLoadError(errorCode: number): NavigationError {
  // Chromium network error codes.
  switch (errorCode) {
    case -105: // ERR_NAME_NOT_RESOLVED
    case -106: // ERR_INTERNET_DISCONNECTED
    case -118: // ERR_CONNECTION_TIMED_OUT
    case -102: // ERR_CONNECTION_REFUSED
    case -101: // ERR_CONNECTION_RESET
    case -100: // ERR_CONNECTION_CLOSED
    case -109: // ERR_ADDRESS_UNREACHABLE
      return {
        kind: 'connection-failed',
        title: 'Connection failed.',
        message:
          'SHODASHA could not reach this site. Check your network connection and try again.',
      };
    case -3: // ERR_ABORTED - user stopped loading
      return {
        kind: 'load-failed',
        title: 'Loading stopped.',
        message: 'The page load was stopped.',
      };
    default:
      return GENERIC_LOAD_FAILED;
  }
}

/**
 * Builds an error for an address that could not be interpreted as a URL.
 */
export function invalidAddressError(): NavigationError {
  return {
    kind: 'invalid-address',
    title: 'Invalid address.',
    message:
      'The address you entered could not be understood. Try a web address like example.com.',
  };
}

/**
 * Builds an error for a navigation that was blocked by SHODASHA policy.
 */
export function blockedNavigationError(reason: string): NavigationError {
  return {
    kind: 'blocked',
    title: 'Navigation blocked.',
    message: reason,
  };
}

/**
 * SHODASHA core - public API.
 *
 * The core is a pure, platform-agnostic TypeScript library. It contains no
 * UI and no host-specific APIs (no Electron, no DOM, no filesystem, no
 * network). Hosts (desktop, future mobile) consume this library and wire the
 * contracts into their platform.
 *
 * @packageDocumentation
 */

export { VERSION } from './version.js';
export type { VersionInfo } from './version.js';

export {
  cleanUrl,
  stripTrackingParameters,
  stripFragment,
} from './url/urlPrivacy.js';

export type {
  FilterCategory,
  FilterDirection,
  FilterRule,
  FilterList,
  FilterDecision,
  ContentFilterEngine,
} from './privacy/contentFilter.js';
export { SimpleFilterEngine } from './privacy/simpleFilterEngine.js';

export {
  redact,
  redactSecrets,
  loadSecret,
  loadBoundedSecret,
  isConfiguredSecret,
  MAX_SECRET_LENGTH,
} from './security/secrets.js';

export type {
  KeyValueStore,
  EncryptedStore,
  StorageStatusListener,
} from './storage/storage.js';

export { Logger } from './logging/logger.js';
export type { LogLevel, LogCategory, LogEntry } from './logging/logger.js';

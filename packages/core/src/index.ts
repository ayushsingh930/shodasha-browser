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
export {
  parseWebUrl,
  classifyAddressInput,
  hasScheme,
  webSchemeOf,
} from './url/urlParser.js';
export type { AddressInput, AddressInputKind } from './url/urlParser.js';

export {
  DEFAULT_SEARCH_ENGINE,
  buildSearchUrl,
  isValidSearchTemplate,
} from './search/searchEngine.js';
export type { SearchEngineDefinition } from './search/searchEngine.js';

export {
  classifyLoadError,
  invalidAddressError,
  blockedNavigationError,
} from './navigation/errorPages.js';
export type {
  NavigationError,
  NavigationErrorKind,
} from './navigation/errorPages.js';

export { TabManager, MAX_CLOSED_TABS } from './navigation/tabManager.js';
export type { TabEvent, TabListener, CreateTabOptions } from './navigation/tabManager.js';
export type {
  Tab,
  TabLoadingState,
  SecurityState,
  NavigationHistory,
} from './navigation/tabModel.js';
export {
  emptyHistory,
  currentHistoryUrl,
  canGoBack,
  canGoForward,
  goBack,
  goForward,
  pushNavigation,
} from './navigation/tabModel.js';

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
  ShieldEngine,
  categoriesForMode,
  RuleEngine,
  normalizeHostname,
  isValidHostname,
  parentDomains,
  hostnameFromUrl,
  originFromUrl,
  sameSite,
  classifyParty,
  classifyResourceType,
  ShieldStatsCounter,
  emptyShieldStats,
  InMemoryFilterListSource,
  parseRuleLines,
} from './shield/index.js';
export type {
  ShieldRequest,
  ShieldContext,
  ResourceType,
  PartyContext,
  ShieldCategory,
  ShieldMode,
  ShieldDecision,
  ShieldDecisionKind,
  BlockRule,
  BlockRuleKind,
  SiteShieldSetting,
  ShieldStats,
  FilterListSource,
  ParseBlocklistOptions,
} from './shield/index.js';

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

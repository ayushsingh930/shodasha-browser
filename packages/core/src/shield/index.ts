/**
 * SHODASHA Shield — public API.
 *
 * The Shield is a user-controlled privacy and content-filtering foundation.
 * It operates through the browser's own controlled request pipeline, works
 * entirely on-device, and never attempts to defeat website security
 * mechanisms. All logic here is pure and platform-agnostic so any host
 * (desktop, future Android) can reuse it.
 *
 * @packageDocumentation
 */

export { ShieldEngine, categoriesForMode } from './shieldEngine.js';

export { RuleEngine } from './engine/ruleMatcher.js';
export {
  normalizeHostname,
  isValidHostname,
  parentDomains,
  hostnameFromUrl,
  originFromUrl,
  sameSite,
} from './engine/hostname.js';
export { classifyParty } from './engine/party.js';
export { classifyResourceType } from './classifier/resourceType.js';

export {
  ShieldStatsCounter,
  emptyShieldStats,
  type ShieldStats,
  type SiteStats,
} from './stats/shieldStats.js';
export {
  RecentEventsBuffer,
  type ShieldFilterEvent,
} from './stats/shieldEvents.js';

export {
  InMemoryFilterListSource,
  type FilterListSource,
} from './lists/filterListSource.js';
export { parseRuleLines } from './lists/parseBlocklist.js';
export type { ParseBlocklistOptions } from './lists/parseBlocklist.js';
export { demoFilterList, DEMO_FILTER_RULES } from './lists/demoFilterList.js';

export type {
  ShieldRequest,
  ShieldContext,
  ResourceType,
  PartyContext,
} from './types/request.js';
export type { ShieldCategory } from './types/category.js';
export type { ShieldMode } from './types/mode.js';
export type { ShieldDecision, ShieldDecisionKind } from './types/decision.js';
export type {
  FilterRule,
  FilterRuleKind,
  FilterRuleAction,
  BlockRule,
  BlockRuleKind,
} from './types/rule.js';
export type { SiteShieldSetting } from './types/state.js';

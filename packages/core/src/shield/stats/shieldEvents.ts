/**
 * Recent filter events.
 *
 * A small, session-scoped, in-memory ring buffer of the most recent
 * rule-driven filter decisions. Only privacy-safe metadata is retained:
 * category, resource type, hostname, and action. Full URLs (which can carry
 * sensitive query strings) are never stored, and nothing is persisted to
 * disk.
 */

import type { FilterRule } from '../types/rule.js';
import type { ResourceType } from '../types/request.js';

/** A single recent filtering event (block or allow-rule). */
export interface ShieldFilterEvent {
  /** Stable identifier for the event. */
  readonly id: string;
  /** Epoch milliseconds at which the event was recorded. */
  readonly timestamp: number;
  /** The action taken by the matching rule. */
  readonly action: 'block' | 'allow';
  /** The category of the first matching rule. */
  readonly category: string;
  /** The resource type of the request. */
  readonly resourceType: ResourceType;
  /** The hostname of the request (never a full URL). */
  readonly hostname: string;
}

/** The maximum number of events kept in memory at once. */
export const MAX_RECENT_EVENTS = 50;

/**
 * A bounded, session-scoped buffer of recent filter events. The most recent
 * events are returned first.
 */
export class RecentEventsBuffer {
  private readonly events: ShieldFilterEvent[] = [];
  private counter = 0;

  /** The current events, most recent first. */
  public get snapshot(): readonly ShieldFilterEvent[] {
    return this.events;
  }

  /**
   * Records a rule-driven decision (block or allow rule). Requests with no
   * matching rule are not recorded, so the buffer stays focused on actual
   * filtering activity.
   */
  public record(
    decision: {
      readonly action: 'block' | 'allow';
      readonly resourceType: ResourceType;
      readonly hostname: string;
    },
    rule: FilterRule,
  ): void {
    this.counter += 1;
    const event: ShieldFilterEvent = {
      id: `shield-event-${String(this.counter)}`,
      timestamp: Date.now(),
      action: decision.action,
      category: rule.category,
      resourceType: decision.resourceType,
      hostname: decision.hostname,
    };
    this.events.unshift(event);
    if (this.events.length > MAX_RECENT_EVENTS) {
      this.events.length = MAX_RECENT_EVENTS;
    }
  }

  /** Clears all events (e.g. at the start of a new session). */
  public clear(): void {
    this.events.length = 0;
  }
}
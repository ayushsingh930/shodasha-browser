/**
 * Filter categories used to classify blocking rules.
 *
 * Extensible: hosts and future filter lists can add categories without
 * changing the engine. Categories are informational (stats) and select which
 * rules are active in a given mode — nothing is auto-blocked purely by
 * category.
 */
export type ShieldCategory =
  | 'ads'
  | 'trackers'
  | 'social-tracking'
  | 'malicious-domains'
  | 'other';

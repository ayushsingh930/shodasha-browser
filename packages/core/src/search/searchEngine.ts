/**
 * Configurable search engine.
 *
 * SHODASHA does not hardcode any API keys. Search is performed by navigating
 * to a search-engine URL that contains the user's query. The search engine is
 * configured through a URL template with a `{query}` placeholder.
 *
 * No credentials or API keys are involved in this flow.
 */

/**
 * A named search engine definition.
 */
export interface SearchEngineDefinition {
  /** Stable identifier, e.g. `duckduckgo`. */
  readonly id: string;
  /** Display name. */
  readonly name: string;
  /**
   * URL template containing exactly one `{query}` placeholder. The user's
   * search query is URL-encoded and substituted for the placeholder.
   */
  readonly urlTemplate: string;
}

/** The default, privacy-respecting search engine. */
export const DEFAULT_SEARCH_ENGINE: SearchEngineDefinition = {
  id: 'duckduckgo',
  name: 'DuckDuckGo',
  urlTemplate: 'https://duckduckgo.com/?q={query}',
} as const;

/**
 * Builds a full search URL for a query using the given engine.
 *
 * @param engine - The search engine definition.
 * @param query - The raw search query.
 * @returns The absolute search URL.
 */
export function buildSearchUrl(
  engine: SearchEngineDefinition,
  query: string,
): string {
  const encoded = encodeURIComponent(query.trim());
  return engine.urlTemplate.replace('{query}', encoded);
}

/**
 * Validates that a URL template contains the required `{query}` placeholder
 * and parses as a valid `http(s)` URL after substitution.
 *
 * @param template - The template to validate.
 * @returns `true` if the template is usable.
 */
export function isValidSearchTemplate(template: string): boolean {
  if (!template.includes('{query}')) {
    return false;
  }
  const sample = buildSearchUrl(
    { id: 'test', name: 'test', urlTemplate: template },
    'shodasha',
  );
  try {
    const url = new URL(sample);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

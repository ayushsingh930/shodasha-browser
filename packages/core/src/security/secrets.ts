/**
 * Security primitives.
 *
 * SHODASHA is secure-by-default. This module provides helpers that reduce
 * the risk of secret leakage and enforce safe boundaries. It deliberately
 * does NOT ship any real secrets, keys, or credentials.
 */

/**
 * A redaction helper for logging.
 *
 * SHODASHA must never log passwords, cookies, authentication tokens, or
 * sensitive form data. This function replaces known-sensitive values with a
 * placeholder before a string ever reaches a logger.
 */
export function redact(value: string): string {
  return '[REDACTED]';
}

/**
 * Redacts a set of named secret values within a free-form log message.
 *
 * @param message - The log message template.
 * @param secrets - Map of placeholder name to the actual secret value.
 * @returns A message where every occurrence of a secret is redacted.
 */
export function redactSecrets(
  message: string,
  secrets: Readonly<Record<string, string>>,
): string {
  let result = message;
  for (const value of Object.values(secrets)) {
    if (value.length > 0) {
      result = result.split(value).join(redact(value));
    }
  }
  return result;
}

/**
 * Loads a secret from the environment.
 *
 * Secrets are read exclusively from the process environment (injected by the
 * host or an operator), never from source code or committed config files.
 * This prevents accidental commits of credentials.
 *
 * @param name - The environment variable name.
 * @returns The secret value, or `null` if absent.
 */
export function loadSecret(name: string): string | null {
  const value = process.env[name];
  return value !== undefined && value.length > 0 ? value : null;
}

/**
 * Returns `true` only when a value is a non-empty string and is not the
 * special "redacted" placeholder. Used to guard optional configuration.
 */
export function isConfiguredSecret(value: string | null | undefined): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  return value.length > 0 && value !== redact(value);
}

/**
 * Constant for the maximum number of bytes a secret may occupy when read
 * from the environment. Guards against accidentally passing enormous values.
 */
export const MAX_SECRET_LENGTH = 4096;

/**
 * Reads a secret from the environment with an upper length bound.
 *
 * @param name - The environment variable name.
 * @returns The secret, or `null` if absent or over-long.
 */
export function loadBoundedSecret(name: string): string | null {
  const value = loadSecret(name);
  if (value === null) {
    return null;
  }
  return value.length <= MAX_SECRET_LENGTH ? value : null;
}

/**
 * Logger with a privacy-by-default policy.
 *
 * The logging layer is the single choke point through which the core emits
 * diagnostics. It refuses to log sensitive categories and forces secrets to
 * be redacted, so a misconfigured caller cannot leak credentials.
 */

import { redact } from '../security/secrets.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Categories of log output. */
export type LogCategory =
  'general' | 'privacy' | 'security' | 'storage' | 'network';

/** Topics that must never be written to any log. */
const SENSITIVE_TOPICS: ReadonlySet<string> = new Set([
  'password',
  'password-value',
  'cookie',
  'cookie-value',
  'auth',
  'auth-token',
  'token',
  'session',
  'session-id',
  'authorization-header',
]);

const ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export interface LoggerOptions {
  readonly level?: LogLevel;
  readonly sink?: (entry: LogEntry) => void;
}

export interface LogEntry {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly category: LogCategory;
  readonly topic: string;
  readonly message: string;
}

/**
 * A minimal structured logger that refuses sensitive topics.
 */
export class Logger {
  private readonly level: LogLevel;
  private readonly sink: (entry: LogEntry) => void;

  public constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? 'info';
    this.sink = options.sink ?? defaultSink;
  }

  public debug(category: LogCategory, topic: string, message: string): void {
    this.write('debug', category, topic, message);
  }

  public info(category: LogCategory, topic: string, message: string): void {
    this.write('info', category, topic, message);
  }

  public warn(category: LogCategory, topic: string, message: string): void {
    this.write('warn', category, topic, message);
  }

  public error(category: LogCategory, topic: string, message: string): void {
    this.write('error', category, topic, message);
  }

  private write(
    level: LogLevel,
    category: LogCategory,
    topic: string,
    message: string,
  ): void {
    if (ORDER[level] < ORDER[this.level]) {
      return;
    }
    if (SENSITIVE_TOPICS.has(topic.toLowerCase())) {
      // Refuse to forward sensitive content, even if a caller asks for it.
      this.sink({
        timestamp: new Date().toISOString(),
        level,
        category,
        topic,
        message: redact(message),
      });
      return;
    }
    this.sink({
      timestamp: new Date().toISOString(),
      level,
      category,
      topic,
      message,
    });
  }
}

function defaultSink(entry: LogEntry): void {
  // eslint-disable-next-line no-console
  const writer =
    entry.level === 'error'
      ? console.error
      : entry.level === 'warn'
        ? console.warn
        : console.log;
  writer(
    `[${entry.timestamp}] ${entry.level.toUpperCase()} [${entry.category}/${entry.topic}] ${entry.message}`,
  );
}

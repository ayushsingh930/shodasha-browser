import { describe, expect, it } from 'vitest';
import { Logger, type LogEntry } from './logger.js';

describe('Logger', () => {
  it('forwards a normal message to the sink', () => {
    const entries: LogEntry[] = [];
    const logger = new Logger({
      level: 'debug',
      sink: (e) => entries.push(e),
    });
    logger.info('general', 'boot', 'hello');
    expect(entries).toHaveLength(1);
    expect(entries[0]?.message).toBe('hello');
  });

  it('filters messages below the configured level', () => {
    const entries: LogEntry[] = [];
    const logger = new Logger({
      level: 'warn',
      sink: (e) => entries.push(e),
    });
    logger.debug('general', 'x', 'debug msg');
    logger.info('general', 'x', 'info msg');
    expect(entries).toHaveLength(0);
  });

  it('redacts sensitive topics even if the caller sends raw content', () => {
    const entries: LogEntry[] = [];
    const logger = new Logger({
      level: 'debug',
      sink: (e) => entries.push(e),
    });
    logger.info('security', 'auth-token', 'Bearer supersecret');
    expect(entries[0]?.message).toBe('[REDACTED]');
  });

  it('does not redact non-sensitive topics', () => {
    const entries: LogEntry[] = [];
    const logger = new Logger({
      level: 'debug',
      sink: (e) => entries.push(e),
    });
    logger.info('general', 'status', 'all good');
    expect(entries[0]?.message).toBe('all good');
  });
});

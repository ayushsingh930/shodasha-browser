/**
 * Storage abstractions.
 *
 * The core defines narrow interfaces for persistence. Hosts provide concrete
 * implementations (Electron's `safeStorage`, an OS keychain, an encrypted
 * file store, or a future Android Keystore-backed store). The core never
 * depends on a concrete storage technology, which keeps it portable and
 * lets sensitive data always be encrypted at rest.
 */

/** A generic key-value store. */
export interface KeyValueStore {
  /** Read a value; resolves `null` when the key is absent. */
  get(key: string): Promise<string | null>;
  /** Write a value under a key. */
  set(key: string, value: string): Promise<void>;
  /** Remove a key. */
  delete(key: string): Promise<void>;
  /** Remove all keys. */
  clear(): Promise<void>;
}

/** A store whose values are encrypted at rest. */
export interface EncryptedStore extends KeyValueStore {
  /**
   * Returns `true` if the host can provide encryption for this platform.
   * When `false`, callers MUST refuse to store sensitive material.
   */
  isEncryptionAvailable(): boolean;
}

/**
 * Optional behaviour a host may implement for notifications about storage
 * health, e.g. "disk full" or "encryption unavailable".
 */
export interface StorageStatusListener {
  onStorageError?(error: unknown): void;
}

/**
 * Minimal IndexedDB access, dependency-free.
 */

let testDatabaseName: string | null = null;

/** @internal Assign an isolated database name for unit tests. */
export function setTestDatabaseName(name: string): void {
  testDatabaseName = name;
  resetDatabaseConnection();
}

export function getDatabaseName(): string {
  if (testDatabaseName) return testDatabaseName;
  if (typeof import.meta.env.VITEST_WORKER_ID !== 'undefined') {
    return `luma-test-${import.meta.env.VITEST_WORKER_ID}`;
  }
  return 'luma';
}

export const DB_NAME = 'luma';
export const DB_VERSION = 3;

export const STORE_BOOKS = 'books';
export const STORE_READING_STATE = 'readingState';
export const STORE_SOURCES = 'sources';
export const STORE_ANNOTATIONS = 'annotations';
export const STORE_SYNC_QUEUE = 'syncQueue';
export const STORE_SYNC_META = 'syncMeta';
export const STORE_SYNC_SESSIONS = 'syncSessions';

let dbPromise: Promise<IDBDatabase> | null = null;

function createReadingStateStore(db: IDBDatabase): void {
  const store = db.createObjectStore(STORE_READING_STATE, { keyPath: 'id' });
  store.createIndex('byBook', 'bookId', { unique: false });
  store.createIndex('byDevice', 'deviceId', { unique: false });
}

export function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(getDatabaseName(), DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const fromVersion = event.oldVersion;

      if (!db.objectStoreNames.contains(STORE_BOOKS)) {
        db.createObjectStore(STORE_BOOKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SOURCES)) {
        db.createObjectStore(STORE_SOURCES, { keyPath: 'bookId' });
      }
      if (!db.objectStoreNames.contains(STORE_ANNOTATIONS)) {
        const store = db.createObjectStore(STORE_ANNOTATIONS, { keyPath: 'id' });
        store.createIndex('byBook', 'bookId', { unique: false });
      }

      if (fromVersion < 2) {
        if (db.objectStoreNames.contains(STORE_READING_STATE)) {
          db.deleteObjectStore(STORE_READING_STATE);
        }
        createReadingStateStore(db);
      } else if (!db.objectStoreNames.contains(STORE_READING_STATE)) {
        createReadingStateStore(db);
      }

      if (fromVersion < 3) {
        if (!db.objectStoreNames.contains(STORE_SYNC_QUEUE)) {
          const queue = db.createObjectStore(STORE_SYNC_QUEUE, { keyPath: 'mutationId' });
          queue.createIndex('byBookDevice', 'bookDeviceKey', { unique: false });
          queue.createIndex('byNextAttempt', 'nextAttemptAt', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_SYNC_META)) {
          db.createObjectStore(STORE_SYNC_META, { keyPath: 'accountId' });
        }
        if (!db.objectStoreNames.contains(STORE_SYNC_SESSIONS)) {
          const sessions = db.createObjectStore(STORE_SYNC_SESSIONS, { keyPath: 'id' });
          sessions.createIndex('byBook', 'bookId', { unique: false });
        }
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

export function resetDatabaseConnection(): void {
  dbPromise = null;
}

export async function closeDatabase(): Promise<void> {
  const pending = dbPromise;
  dbPromise = null;
  if (!pending) return;
  const db = await pending.catch(() => null);
  db?.close();
}

export async function put<T>(store: string, value: T): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(store, 'readwrite');
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
    transaction.objectStore(store).put(value);
  });
}

export async function get<T>(store: string, key: IDBValidKey): Promise<T | undefined> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, 'readonly');
    const request = transaction.objectStore(store).get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getAll<T>(store: string): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, 'readonly');
    const request = transaction.objectStore(store).getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function remove(store: string, key: IDBValidKey): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(store, 'readwrite');
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
    transaction.objectStore(store).delete(key);
  });
}

export async function getAllByIndex<T>(
  store: string,
  indexName: string,
  query: IDBValidKey,
): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, 'readonly');
    const request = transaction.objectStore(store).index(indexName).getAll(query);
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function removeAllByIndex(
  store: string,
  indexName: string,
  query: IDBValidKey,
): Promise<void> {
  const states = await getAllByIndex<{ id: string }>(store, indexName, query);
  for (const state of states) {
    await remove(store, state.id);
  }
}

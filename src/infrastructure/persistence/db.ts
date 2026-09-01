/**
 * Minimal IndexedDB access, dependency-free.
 *
 * A tiny promise wrapper is used instead of a library because Phase 1 only needs
 * a handful of object stores and new dependencies must justify their existence
 * (Phase 1 brief section 15). The stores isolate persistent state from transient
 * UI state (architectural rule 5).
 */

export const DB_NAME = 'luma';
export const DB_VERSION = 1;

export const STORE_BOOKS = 'books';
export const STORE_READING_STATE = 'readingState';
export const STORE_SOURCES = 'sources';
export const STORE_ANNOTATIONS = 'annotations';

let dbPromise: Promise<IDBDatabase> | null = null;

function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_BOOKS)) {
        db.createObjectStore(STORE_BOOKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_READING_STATE)) {
        db.createObjectStore(STORE_READING_STATE, { keyPath: 'bookId' });
      }
      if (!db.objectStoreNames.contains(STORE_SOURCES)) {
        db.createObjectStore(STORE_SOURCES, { keyPath: 'bookId' });
      }
      if (!db.objectStoreNames.contains(STORE_ANNOTATIONS)) {
        const store = db.createObjectStore(STORE_ANNOTATIONS, { keyPath: 'id' });
        store.createIndex('byBook', 'bookId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

/** Reset the cached connection (used by tests running against a fresh backend). */
export function resetDatabaseConnection(): void {
  dbPromise = null;
}

/** Close and forget the cached connection so the database can be deleted. */
export async function closeDatabase(): Promise<void> {
  const pending = dbPromise;
  dbPromise = null;
  if (!pending) return;
  const db = await pending.catch(() => null);
  db?.close();
}

async function tx(
  storeNames: string | string[],
  mode: IDBTransactionMode,
): Promise<IDBTransaction> {
  const db = await openDatabase();
  return db.transaction(storeNames, mode);
}

export async function put<T>(store: string, value: T): Promise<void> {
  const transaction = await tx(store, 'readwrite');
  await promisifyRequest(transaction.objectStore(store).put(value));
}

export async function get<T>(store: string, key: IDBValidKey): Promise<T | undefined> {
  const transaction = await tx(store, 'readonly');
  return promisifyRequest<T | undefined>(
    transaction.objectStore(store).get(key) as IDBRequest<T | undefined>,
  );
}

export async function getAll<T>(store: string): Promise<T[]> {
  const transaction = await tx(store, 'readonly');
  return promisifyRequest<T[]>(
    transaction.objectStore(store).getAll() as IDBRequest<T[]>,
  );
}

export async function remove(store: string, key: IDBValidKey): Promise<void> {
  const transaction = await tx(store, 'readwrite');
  await promisifyRequest(transaction.objectStore(store).delete(key));
}

export async function getAllByIndex<T>(
  store: string,
  indexName: string,
  query: IDBValidKey,
): Promise<T[]> {
  const transaction = await tx(store, 'readonly');
  const index = transaction.objectStore(store).index(indexName);
  return promisifyRequest<T[]>(index.getAll(query) as IDBRequest<T[]>);
}

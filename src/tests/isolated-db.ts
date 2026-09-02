import { getDatabaseName, resetDatabaseConnection, setTestDatabaseName } from '@/infrastructure/persistence/db';

let testDbCounter = 0;

/** Open each test against a fresh IndexedDB database. */
export function useIsolatedTestDatabase(): void {
  testDbCounter += 1;
  setTestDatabaseName(`${getDatabaseName()}-${testDbCounter}`);
  resetDatabaseConnection();
}

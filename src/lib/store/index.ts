import { createMemoryStore } from "./memory";
import { connectPostgres } from "./postgres";
import type { Store } from "./types";

export type { Store } from "./types";
export { createMemoryStore } from "./memory";
export { createPostgresStore, migratePostgres } from "./postgres";

let storePromise: Promise<Store> | null = null;
let memoryStore = createMemoryStore();

export function useMemoryStore(): boolean {
  if (process.env.RIVERA_STORE === "memory") return true;
  if (process.env.RIVERA_STORE === "postgres") return false;
  return !process.env.DATABASE_URL;
}

export async function getStore(): Promise<Store> {
  if (useMemoryStore()) {
    return memoryStore;
  }
  if (!storePromise) {
    storePromise = connectPostgres(process.env.DATABASE_URL!);
  }
  return storePromise;
}

export function resetStore(): Store {
  memoryStore = createMemoryStore();
  storePromise = null;
  return memoryStore;
}

export function setStore(store: Store): void {
  memoryStore = store;
  storePromise = Promise.resolve(store);
}

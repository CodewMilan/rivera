import { createMemoryStore } from "./memory";
import { connectPostgres } from "./postgres";
import type { Store } from "./types";

export type { Store } from "./types";

let storePromise: Promise<Store> | null = null;
let memoryStore = createMemoryStore();

export function useMemoryStore(): boolean {
  if (process.env.RIVERA_STORE === "memory") return true;
  if (process.env.VITEST) return true;
  if (!process.env.DATABASE_URL) return true;
  return false;
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

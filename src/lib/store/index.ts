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
    const production = process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
    if (production && process.env.ALLOW_MEMORY_STORE !== "true" && process.env.RIVERA_STORE !== "memory") {
      throw new Error(
        "DATABASE_URL is required in production. Provision Postgres, or set ALLOW_MEMORY_STORE=true for a throwaway demo.",
      );
    }
    return memoryStore;
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required when RIVERA_STORE=postgres");
  }
  if (!storePromise) {
    storePromise = connectPostgres(process.env.DATABASE_URL);
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

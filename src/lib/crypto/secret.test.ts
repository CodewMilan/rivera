import { beforeAll, describe, expect, it } from "vitest";
import { decryptSecret, encryptSecret, isEncrypted } from "./secret";

beforeAll(() => {
  process.env.RIVERA_SECRET_KEY = "test-secret-key-for-vitest-only";
});

describe("secret vault", () => {
  it("round-trips a value through AES-256-GCM", () => {
    const cipher = encryptSecret("crsr_example_123");
    expect(isEncrypted(cipher)).toBe(true);
    expect(cipher).not.toContain("crsr_example_123");
    expect(decryptSecret(cipher)).toBe("crsr_example_123");
  });

  it("is idempotent when re-encrypting an already-encrypted value", () => {
    const once = encryptSecret("hello");
    const twice = encryptSecret(once);
    expect(twice).toBe(once);
  });

  it("returns plaintext untouched by decrypt (backward compat with unencrypted rows)", () => {
    expect(decryptSecret("legacy_plaintext")).toBe("legacy_plaintext");
  });
});

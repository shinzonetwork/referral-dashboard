import { describe, expect, it } from "vitest";
import { isValidEvmAddress, normalizeEvmAddress } from "@/lib/validation/wallet";

describe("isValidEvmAddress", () => {
  it("accepts a well-formed EVM address", () => {
    expect(isValidEvmAddress("0x1234567890abcdef1234567890abcdef12345678")).toBe(true);
  });

  it("accepts mixed-case hex", () => {
    expect(isValidEvmAddress("0x1234567890ABCDEF1234567890abcdef12345678")).toBe(true);
  });

  it("rejects addresses without the 0x prefix", () => {
    expect(isValidEvmAddress("1234567890abcdef1234567890abcdef12345678")).toBe(false);
  });

  it("rejects addresses with the wrong length", () => {
    expect(isValidEvmAddress("0x1234")).toBe(false);
  });

  it("rejects non-hex characters", () => {
    expect(isValidEvmAddress("0xzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz")).toBe(false);
  });
});

describe("normalizeEvmAddress", () => {
  it("lowercases the address", () => {
    expect(normalizeEvmAddress("0x1234567890ABCDEF1234567890abcdef12345678")).toBe(
      "0x1234567890abcdef1234567890abcdef12345678",
    );
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeEvmAddress("  0x1234567890abcdef1234567890abcdef12345678  ")).toBe(
      "0x1234567890abcdef1234567890abcdef12345678",
    );
  });

  it("makes differently-cased addresses compare equal", () => {
    const a = normalizeEvmAddress("0xABCDEF1234567890abcdef1234567890ABCDEF12");
    const b = normalizeEvmAddress("0xabcdef1234567890ABCDEF1234567890abcdef12");
    expect(a).toBe(b);
  });
});

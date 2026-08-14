import { describe, expect, it } from "vitest";
import {
  generateReferralCode,
  normalizeVanityCode,
  isReservedCodeFormat,
} from "@/lib/referral-codes";

describe("generateReferralCode", () => {
  it("generates an 8-character lowercase alphanumeric code", () => {
    const code = generateReferralCode();
    expect(code).toMatch(/^[0-9a-z]{8}$/);
  });

  it("generates distinct codes across calls", () => {
    const codes = new Set(Array.from({ length: 20 }, () => generateReferralCode()));
    expect(codes.size).toBe(20);
  });
});

describe("normalizeVanityCode", () => {
  it("lowercases and slugifies input", () => {
    expect(normalizeVanityCode("Shinzo Foundation")).toBe("shinzo-foundation");
  });

  it("strips leading/trailing separators", () => {
    expect(normalizeVanityCode("  --acme--  ")).toBe("acme");
  });
});

describe("isReservedCodeFormat", () => {
  it("flags a wallet-address-shaped code as reserved", () => {
    expect(isReservedCodeFormat("0x1234567890abcdef1234567890abcdef12345678")).toBe(true);
  });

  it("allows an ordinary vanity code", () => {
    expect(isReservedCodeFormat("dappnode2026")).toBe(false);
    expect(isReservedCodeFormat("acme-foundation")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { ingestPayloadSchema } from "@/lib/validation/ingest";

const validWallet = "0x1234567890abcdef1234567890abcdef12345678";

describe("ingestPayloadSchema", () => {
  it("accepts a valid payload", () => {
    const result = ingestPayloadSchema.safeParse({
      refCode: "TESTCODE1",
      referredWalletAddress: validWallet,
      referredType: "GENERATOR",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a payload without referredType or metadata", () => {
    const result = ingestPayloadSchema.safeParse({
      refCode: "TESTCODE1",
      referredWalletAddress: validWallet,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing refCode", () => {
    const result = ingestPayloadSchema.safeParse({
      referredWalletAddress: validWallet,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed wallet address", () => {
    const result = ingestPayloadSchema.safeParse({
      refCode: "TESTCODE1",
      referredWalletAddress: "not-a-wallet",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid referredType", () => {
    const result = ingestPayloadSchema.safeParse({
      refCode: "TESTCODE1",
      referredWalletAddress: validWallet,
      referredType: "FOUNDATION",
    });
    expect(result.success).toBe(false);
  });
});

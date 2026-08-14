import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { buildReferralUrl } from "@/lib/referral-url";

describe("buildReferralUrl", () => {
  const originalBase = process.env.NEXT_PUBLIC_REFERRAL_BASE_URL;
  const originalParam = process.env.NEXT_PUBLIC_REFERRAL_PARAM;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_REFERRAL_BASE_URL = "https://shinzo.network/join";
    process.env.NEXT_PUBLIC_REFERRAL_PARAM = "ref";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_REFERRAL_BASE_URL = originalBase;
    process.env.NEXT_PUBLIC_REFERRAL_PARAM = originalParam;
  });

  it("composes the base URL with the ref code as a query param", () => {
    expect(buildReferralUrl("abc123")).toBe("https://shinzo.network/join?ref=abc123");
  });

  it("respects a custom param name from env", () => {
    process.env.NEXT_PUBLIC_REFERRAL_PARAM = "referral";
    expect(buildReferralUrl("abc123")).toBe("https://shinzo.network/join?referral=abc123");
  });
});

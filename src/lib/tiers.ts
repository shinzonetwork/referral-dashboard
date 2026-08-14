import type { ReferredType } from "@/generated/prisma/client";

const DEFAULT_TIER_PERCENT: Record<ReferredType, number> = {
  GENERATOR: 5,
  HOST: 7,
  BUILDER: 10,
};

export function getDefaultTierPercent(
  referredType: ReferredType | null | undefined,
): number | null {
  if (!referredType) return null;
  return DEFAULT_TIER_PERCENT[referredType];
}

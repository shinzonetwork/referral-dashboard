import { prisma } from "@/lib/prisma";
import { generateReferralCode } from "@/lib/referral-codes";

// createdByAdminId is null for links created via the public self-serve flow.
export async function createLinkForReferrer(
  referrerId: string,
  code: string,
  createdByAdminId: string | null,
) {
  // Retry once on the rare code collision.
  try {
    return await prisma.referralLink.create({
      data: { referrerId, code, createdByAdminId },
    });
  } catch {
    const fallbackCode = generateReferralCode();
    return prisma.referralLink.create({
      data: { referrerId, code: fallbackCode, createdByAdminId },
    });
  }
}

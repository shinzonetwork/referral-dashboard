"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";

export async function generatePayoutBatch() {
  const admin = await requireAdmin();

  const now = new Date();
  const periodLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const batch = await prisma.$transaction(async (tx) => {
    const unbatched = await tx.referral.findMany({
      where: { status: "VERIFIED", payoutBatchItem: null },
      include: { referralLink: { include: { referrer: true } } },
    });

    const created = await tx.payoutBatchSnapshot.create({
      data: { periodLabel, generatedByAdminId: admin.id },
    });

    if (unbatched.length > 0) {
      await tx.payoutBatchItem.createMany({
        data: unbatched.map((referral) => ({
          batchId: created.id,
          referralId: referral.id,
          referrerWalletAddress: referral.referralLink.referrer.walletAddress,
          referredWalletAddress: referral.referredWalletAddress,
          referredType: referral.referredType,
          tierPercentSnapshot: referral.tierPercentSnapshot ?? 0,
          verifiedAt: referral.verifiedAt ?? referral.updatedAt,
        })),
      });
    }

    return created;
  });

  await writeAuditLog({
    entityType: "PAYOUT_BATCH",
    entityId: batch.id,
    action: "CREATED",
    actorType: "ADMIN",
    actorAdminId: admin.id,
    afterValue: { periodLabel },
  });

  revalidatePath("/payouts");
  redirect(`/payouts/${batch.id}`);
}

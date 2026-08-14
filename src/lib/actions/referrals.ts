"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { getDefaultTierPercent } from "@/lib/tiers";
import { isValidEvmAddress, normalizeEvmAddress } from "@/lib/validation/wallet";
import type { ReferralStatus, ReferredType } from "@/generated/prisma/client";

export async function recordManualReferral(formData: FormData) {
  const admin = await requireAdmin();

  const referralLinkId = String(formData.get("referralLinkId") ?? "");
  const referredWalletAddressRaw = String(formData.get("referredWalletAddress") ?? "").trim();
  const referredTypeRaw = String(formData.get("referredType") ?? "");
  const referredType = (referredTypeRaw || null) as ReferredType | null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!referralLinkId || !referredWalletAddressRaw) {
    throw new Error("referralLinkId and referredWalletAddress are required");
  }
  if (!isValidEvmAddress(referredWalletAddressRaw)) {
    throw new Error("referredWalletAddress must be an EVM-style address (0x + 40 hex chars)");
  }
  const referredWalletAddress = normalizeEvmAddress(referredWalletAddressRaw);

  const link = await prisma.referralLink.findUniqueOrThrow({
    where: { id: referralLinkId },
    include: { referrer: true },
  });
  if (referredWalletAddress === normalizeEvmAddress(link.referrer.walletAddress)) {
    throw new Error("A referrer cannot refer themselves — this link's referrer and the referred wallet are the same.");
  }

  const referral = await prisma.referral.create({
    data: {
      referralLinkId,
      referredWalletAddress,
      referredType,
      source: "ADMIN_MANUAL",
      tierPercentSnapshot: getDefaultTierPercent(referredType),
      notes,
    },
  });

  await writeAuditLog({
    entityType: "REFERRAL",
    entityId: referral.id,
    action: "CREATED",
    actorType: "ADMIN",
    actorAdminId: admin.id,
    afterValue: { referralLinkId, referredWalletAddress, referredType },
  });

  revalidatePath("/referrals");
  redirect(`/referrals/${referral.id}`);
}

export async function setReferralStatus(
  referralId: string,
  status: ReferralStatus,
  formData: FormData,
) {
  const admin = await requireAdmin();

  const referredTypeRaw = String(formData.get("referredType") ?? "");
  const referredType = (referredTypeRaw || null) as ReferredType | null;
  const tierPercentRaw = String(formData.get("tierPercent") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;

  const before = await prisma.referral.findUniqueOrThrow({ where: { id: referralId } });

  if (status === "VERIFIED" && !referredType && !before.referredType) {
    throw new Error("Cannot verify a referral without a referred type");
  }

  const updated = await prisma.referral.update({
    where: { id: referralId },
    data: {
      status,
      referredType: referredType ?? before.referredType,
      tierPercentSnapshot: tierPercentRaw
        ? Number(tierPercentRaw)
        : before.tierPercentSnapshot ?? getDefaultTierPercent(referredType ?? before.referredType),
      notes: note ?? before.notes,
      verifiedByAdminId: status === "VERIFIED" ? admin.id : before.verifiedByAdminId,
      verifiedAt: status === "VERIFIED" ? new Date() : before.verifiedAt,
    },
  });

  await writeAuditLog({
    entityType: "REFERRAL",
    entityId: referralId,
    action: "STATUS_CHANGE",
    actorType: "ADMIN",
    actorAdminId: admin.id,
    beforeValue: { status: before.status },
    afterValue: { status: updated.status, note },
  });

  revalidatePath(`/referrals/${referralId}`);
  revalidatePath("/referrals");
}

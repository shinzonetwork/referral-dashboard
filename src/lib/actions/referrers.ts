"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import {
  generateReferralCode,
  normalizeVanityCode,
  isReservedCodeFormat,
} from "@/lib/referral-codes";
import { isValidEvmAddress, normalizeEvmAddress } from "@/lib/validation/wallet";
import { createLinkForReferrer } from "@/lib/referral-link-helpers";
import type { ReferrerType } from "@/generated/prisma/client";

export type CreateReferrerState = { error?: string };

export async function createReferrer(
  _prevState: CreateReferrerState,
  formData: FormData,
): Promise<CreateReferrerState> {
  const admin = await requireAdmin();

  const walletAddressRaw = String(formData.get("walletAddress") ?? "").trim();
  const type = String(formData.get("type") ?? "") as ReferrerType;
  const label = String(formData.get("label") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const vanityCodeInput = String(formData.get("vanityCode") ?? "").trim();

  if (!walletAddressRaw || !type || !label) {
    return { error: "Wallet address, type, and label are required." };
  }
  if (!isValidEvmAddress(walletAddressRaw)) {
    return { error: "Wallet address must be an EVM-style address (0x + 40 hex characters)." };
  }
  const walletAddress = normalizeEvmAddress(walletAddressRaw);

  const existing = await prisma.referrer.findUnique({ where: { walletAddress } });
  if (existing) {
    return {
      error: `A referrer already exists for this wallet address ("${existing.label}"). Open their profile instead of creating a new one.`,
    };
  }

  const normalizedVanityCode = vanityCodeInput ? normalizeVanityCode(vanityCodeInput) : "";
  if (normalizedVanityCode && isReservedCodeFormat(normalizedVanityCode)) {
    return {
      error:
        "That vanity code looks like a wallet address, which is a reserved format. Pick something else, or leave it blank to auto-generate.",
    };
  }

  const referrer = await prisma.referrer.create({
    data: {
      walletAddress,
      type,
      label,
      notes,
      createdByAdminId: admin.id,
    },
  });

  await writeAuditLog({
    entityType: "REFERRER",
    entityId: referrer.id,
    action: "CREATED",
    actorType: "ADMIN",
    actorAdminId: admin.id,
    afterValue: { walletAddress, type, label },
  });

  const code = normalizedVanityCode || generateReferralCode();
  const link = await createLinkForReferrer(referrer.id, code, admin.id);

  await writeAuditLog({
    entityType: "REFERRAL_LINK",
    entityId: link.id,
    action: "CREATED",
    actorType: "ADMIN",
    actorAdminId: admin.id,
    afterValue: { code: link.code, referrerId: referrer.id },
  });

  revalidatePath("/referrers");
  redirect(`/referrers/${referrer.id}`);
}

export async function generateNewLink(referrerId: string, vanityCodeInput?: string) {
  const admin = await requireAdmin();

  const normalizedVanityCode = vanityCodeInput ? normalizeVanityCode(vanityCodeInput) : "";
  // Not currently wired to a form that surfaces errors — silently fall back
  // to an auto-generated code rather than crash if the reserved format is
  // hit (see isReservedCodeFormat in referrers.ts's sibling createReferrer).
  const code =
    normalizedVanityCode && !isReservedCodeFormat(normalizedVanityCode)
      ? normalizedVanityCode
      : generateReferralCode();

  const link = await createLinkForReferrer(referrerId, code, admin.id);

  await writeAuditLog({
    entityType: "REFERRAL_LINK",
    entityId: link.id,
    action: "CREATED",
    actorType: "ADMIN",
    actorAdminId: admin.id,
    afterValue: { code: link.code, referrerId },
  });

  revalidatePath(`/referrers/${referrerId}`);
}

export async function toggleLinkActive(linkId: string) {
  const admin = await requireAdmin();

  const link = await prisma.referralLink.findUniqueOrThrow({ where: { id: linkId } });
  const nextActive = !link.active;

  const updated = await prisma.referralLink.update({
    where: { id: linkId },
    data: {
      active: nextActive,
      revokedAt: nextActive ? null : new Date(),
    },
  });

  await writeAuditLog({
    entityType: "REFERRAL_LINK",
    entityId: linkId,
    action: nextActive ? "LINK_REACTIVATED" : "LINK_REVOKED",
    actorType: "ADMIN",
    actorAdminId: admin.id,
    beforeValue: { active: link.active },
    afterValue: { active: updated.active },
  });

  revalidatePath(`/referrers/${link.referrerId}`);
}

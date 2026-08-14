"use server";

import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { buildReferralUrl } from "@/lib/referral-url";
import { isValidEvmAddress, normalizeEvmAddress } from "@/lib/validation/wallet";
import { isRegisteredParticipant } from "@/lib/verification/participant-registry";
import type { ReferrerType } from "@/generated/prisma/client";

const SELF_SERVE_TYPES = new Set(["GENERATOR", "HOST", "BUILDER"]);
const TYPE_LABEL: Record<string, string> = {
  GENERATOR: "Generator",
  HOST: "Host",
  BUILDER: "Builder",
};

export type SelfServeState = { url?: string; error?: string };

// Public, unauthenticated: an existing generator/host/builder generates
// their own link to hand to OTHER people they refer. Foundation/Partner
// referrers remain admin-only (created via the internal dashboard).
//
// Team decision (2026-07-29): the referral identifier for individuals IS
// their own wallet address, not a separate generated code — so the
// ReferralLink.code created here is literally the normalized wallet
// address. This is also what makes "one link per individual" automatic:
// a wallet can only ever map to one link because Referrer.walletAddress is
// unique.
//
// Team decision (2026-07-29): a wallet must be a CONFIRMED registered
// Generator/Host operator before it's allowed to self-serve a link — see
// isRegisteredParticipant(). Builders have no known registration step (per
// docs.shinzo.network, Builder onboarding is a local CLI wallet with no
// registration event), so there's nothing to verify against yet; Builder
// self-serve is left trust-based until the team clarifies whether/how a
// Builder should be verified. Flagged in DECISIONS_AND_OPEN_QUESTIONS.md.
export async function generateOwnReferralLink(
  _prevState: SelfServeState,
  formData: FormData,
): Promise<SelfServeState> {
  const walletAddressRaw = String(formData.get("walletAddress") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const label = String(formData.get("label") ?? "").trim();

  if (!walletAddressRaw || !isValidEvmAddress(walletAddressRaw)) {
    return { error: "Enter a valid wallet address (0x followed by 40 hex characters)." };
  }
  if (!SELF_SERVE_TYPES.has(type)) {
    return { error: "Select whether you're a Generator, Host, or Builder." };
  }

  const walletAddress = normalizeEvmAddress(walletAddressRaw);

  if (type === "GENERATOR" || type === "HOST") {
    const verified = await isRegisteredParticipant(walletAddress, type);
    if (!verified) {
      return {
        error:
          "We can't yet confirm this wallet as a registered Generator/Host — self-serve links are temporarily unavailable while that check is being wired up. Contact the Shinzo team for a referral link in the meantime.",
      };
    }
  }

  let referrer = await prisma.referrer.findUnique({ where: { walletAddress } });

  if (!referrer) {
    const shortWallet = `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;
    referrer = await prisma.referrer.create({
      data: {
        walletAddress,
        type: type as ReferrerType,
        label: label || `${TYPE_LABEL[type]} ${shortWallet}`,
        createdByAdminId: null,
      },
    });
    await writeAuditLog({
      entityType: "REFERRER",
      entityId: referrer.id,
      action: "CREATED",
      actorType: "SELF_SERVICE",
      afterValue: { walletAddress, type },
    });
  }

  let link = await prisma.referralLink.findFirst({
    where: { referrerId: referrer.id },
    orderBy: { createdAt: "asc" },
  });

  if (link && !link.active) {
    return {
      error: "Your referral link has been deactivated. Contact the Shinzo team if you think this is a mistake.",
    };
  }

  if (!link) {
    link = await prisma.referralLink.create({
      data: { referrerId: referrer.id, code: walletAddress, createdByAdminId: null },
    });
    await writeAuditLog({
      entityType: "REFERRAL_LINK",
      entityId: link.id,
      action: "CREATED",
      actorType: "SELF_SERVICE",
      afterValue: { code: link.code, referrerId: referrer.id },
    });
  }

  return { url: buildReferralUrl(link.code) };
}

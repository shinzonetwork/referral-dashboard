import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ingestPayloadSchema } from "@/lib/validation/ingest";
import { getDefaultTierPercent } from "@/lib/tiers";
import { writeAuditLog } from "@/lib/audit";
import { hasValidServiceToken } from "@/lib/service-auth";
import { isValidEvmAddress, normalizeEvmAddress } from "@/lib/validation/wallet";
import { normalizeVanityCode } from "@/lib/referral-codes";

// See docs/ingest-contract.md — this is the current, replaceable contract for
// how ShinzoHub (or a manual script) reports a referred signup back to us.
export async function POST(request: NextRequest) {
  if (!hasValidServiceToken(request, "x-ingest-token", "INGEST_API_TOKEN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = ingestPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { refCode, referredWalletAddress, referredType, metadata } = parsed.data;

  // refCode may be a foundation vanity code OR an individual's own wallet
  // address (see src/lib/actions/self-serve.ts) — normalize the same way
  // the resolve endpoint does so a mixed-case address still matches.
  const lookupCode = isValidEvmAddress(refCode) ? normalizeEvmAddress(refCode) : normalizeVanityCode(refCode);

  const link = await prisma.referralLink.findUnique({
    where: { code: lookupCode },
    include: { referrer: true },
  });
  if (!link || !link.active) {
    return NextResponse.json(
      { error: "Referral link not found or inactive" },
      { status: 400 },
    );
  }
  if (referredWalletAddress === normalizeEvmAddress(link.referrer.walletAddress)) {
    return NextResponse.json(
      { error: "A referrer cannot refer themselves" },
      { status: 400 },
    );
  }

  const existing = await prisma.referral.findFirst({
    where: {
      referralLinkId: link.id,
      referredWalletAddress,
      referredType: referredType ?? null,
    },
  });
  if (existing) {
    return NextResponse.json({ id: existing.id, status: existing.status }, { status: 200 });
  }

  const referral = await prisma.referral.create({
    data: {
      referralLinkId: link.id,
      referredWalletAddress,
      referredType,
      source: "API_INGEST",
      tierPercentSnapshot: getDefaultTierPercent(referredType),
      notes: metadata ? JSON.stringify(metadata) : null,
    },
  });

  await writeAuditLog({
    entityType: "REFERRAL",
    entityId: referral.id,
    action: "CREATED",
    actorType: "SYSTEM",
    afterValue: { status: referral.status, source: referral.source },
  });

  return NextResponse.json({ id: referral.id, status: referral.status }, { status: 201 });
}

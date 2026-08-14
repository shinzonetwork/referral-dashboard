import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidEvmAddress, normalizeEvmAddress } from "@/lib/validation/wallet";
import { normalizeVanityCode } from "@/lib/referral-codes";

// See docs/resolve-contract.md. Public and unauthenticated on purpose: this
// is meant to be called live from the registration app's browser UI as
// someone types a code or wallet address, so it can show a confirmation
// ("Referred by: 0xAbc...123") before they submit — a shared secret can't
// be meaningfully hidden in that context anyway, and the data returned
// (a wallet address) is exactly what a referral identifier is meant to
// publicly resolve to. If abuse becomes a concern, add rate limiting at the
// infra layer, not app-level auth.
//
// Deliberately never returns the internal admin-facing `label` field — per
// team guidance, referral identifiers should resolve to a wallet address
// (or, eventually, an ENS name) and nothing that could be personal/chosen
// display text.
export async function GET(request: NextRequest) {
  const identifier = request.nextUrl.searchParams.get("identifier")?.trim();
  if (!identifier) {
    return NextResponse.json({ error: "Missing identifier" }, { status: 400 });
  }

  const lookupCode = isValidEvmAddress(identifier)
    ? normalizeEvmAddress(identifier)
    : normalizeVanityCode(identifier);

  const link = await prisma.referralLink.findUnique({
    where: { code: lookupCode },
    include: { referrer: true },
  });

  if (!link || !link.active) {
    return NextResponse.json({ valid: false });
  }

  return NextResponse.json({
    valid: true,
    walletAddress: link.referrer.walletAddress,
    // Not implemented yet — no ENS resolution mechanism confirmed for the
    // Shinzo testnet. Reserved so the registration app's UI can render this
    // once it's available without another contract change.
    ensName: null,
  });
}

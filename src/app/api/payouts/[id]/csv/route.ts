import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { toCsv } from "@/lib/csv";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const batch = await prisma.payoutBatchSnapshot.findUnique({
    where: { id },
    include: { items: { orderBy: { createdAt: "asc" } } },
  });

  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  const csv = toCsv(
    [
      "batch_period",
      "referrer_wallet_address",
      "referred_wallet_address",
      "referred_type",
      "tier_percent",
      "verified_at",
      "referral_id",
    ],
    batch.items.map((item) => [
      batch.periodLabel,
      item.referrerWalletAddress,
      item.referredWalletAddress,
      item.referredType,
      item.tierPercentSnapshot.toString(),
      item.verifiedAt.toISOString(),
      item.referralId,
    ]),
  );

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="payout-batch-${batch.periodLabel}-${batch.id}.csv"`,
    },
  });
}

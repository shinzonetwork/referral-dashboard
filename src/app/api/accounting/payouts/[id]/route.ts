import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasValidServiceToken } from "@/lib/service-auth";

// See docs/accounting-contract.md.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!hasValidServiceToken(request, "x-accounting-token", "ACCOUNTING_API_TOKEN")) {
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

  return NextResponse.json({
    id: batch.id,
    periodLabel: batch.periodLabel,
    generatedAt: batch.generatedAt.toISOString(),
    items: batch.items.map((item) => ({
      referralId: item.referralId,
      referrerWalletAddress: item.referrerWalletAddress,
      referredWalletAddress: item.referredWalletAddress,
      referredType: item.referredType,
      tierPercent: item.tierPercentSnapshot.toString(),
      verifiedAt: item.verifiedAt.toISOString(),
    })),
  });
}

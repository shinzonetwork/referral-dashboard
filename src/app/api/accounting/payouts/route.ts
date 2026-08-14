import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasValidServiceToken } from "@/lib/service-auth";

// See docs/accounting-contract.md — the future accounting service pulls
// batch data from here rather than us pushing a CSV/webhook to it. This is
// today's version of the contract; the consumer-side details (polling
// cadence, pagination, auth mechanism) are still open with the team.
export async function GET(request: NextRequest) {
  if (!hasValidServiceToken(request, "x-accounting-token", "ACCOUNTING_API_TOKEN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const batches = await prisma.payoutBatchSnapshot.findMany({
    orderBy: { generatedAt: "asc" },
    include: { _count: { select: { items: true } } },
  });

  return NextResponse.json({
    batches: batches.map((batch) => ({
      id: batch.id,
      periodLabel: batch.periodLabel,
      generatedAt: batch.generatedAt.toISOString(),
      itemCount: batch._count.items,
    })),
  });
}

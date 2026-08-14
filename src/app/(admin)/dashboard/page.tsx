import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function DashboardPage() {
  const [referrerCount, pending, verified, rejected, unbatched, batchCount] =
    await Promise.all([
      prisma.referrer.count(),
      prisma.referral.count({ where: { status: "PENDING" } }),
      prisma.referral.count({ where: { status: "VERIFIED" } }),
      prisma.referral.count({ where: { status: "REJECTED" } }),
      prisma.referral.count({ where: { status: "VERIFIED", payoutBatchItem: null } }),
      prisma.payoutBatchSnapshot.count(),
    ]);

  const cards = [
    { label: "Referrers", value: referrerCount, href: "/referrers" },
    { label: "Pending referrals", value: pending, href: "/referrals?status=PENDING" },
    { label: "Verified referrals", value: verified, href: "/referrals?status=VERIFIED" },
    { label: "Rejected referrals", value: rejected, href: "/referrals?status=REJECTED" },
    { label: "Ready to batch", value: unbatched, href: "/payouts" },
    { label: "Payout batches", value: batchCount, href: "/payouts" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-lg border border-neutral-200 p-4 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
          >
            <p className="text-2xl font-semibold">{card.value}</p>
            <p className="text-sm text-neutral-500">{card.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

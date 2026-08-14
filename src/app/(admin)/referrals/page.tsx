import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { ReferralStatus } from "@/generated/prisma/client";

const STATUSES: ReferralStatus[] = ["PENDING", "VERIFIED", "REJECTED"];

const STATUS_STYLES: Record<ReferralStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  VERIFIED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export default async function ReferralsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const referrals = await prisma.referral.findMany({
    where: status ? { status: status as ReferralStatus } : undefined,
    orderBy: { createdAt: "desc" },
    include: { referralLink: { include: { referrer: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Referrals</h1>
        <Link
          href="/referrals/new"
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-neutral-50 dark:text-neutral-900"
        >
          Record Referral
        </Link>
      </div>

      <div className="flex gap-2 text-sm">
        <Link
          href="/referrals"
          className={`rounded-full px-3 py-1 ${!status ? "bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900" : "bg-neutral-100 dark:bg-neutral-800"}`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/referrals?status=${s}`}
            className={`rounded-full px-3 py-1 ${status === s ? "bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900" : "bg-neutral-100 dark:bg-neutral-800"}`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
            <tr>
              <th className="px-4 py-2 font-medium">Referrer</th>
              <th className="px-4 py-2 font-medium">Referred wallet</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Tier %</th>
              <th className="px-4 py-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((referral) => (
              <tr
                key={referral.id}
                className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900"
              >
                <td className="px-4 py-2">
                  <Link
                    href={`/referrers/${referral.referralLink.referrerId}`}
                    className="hover:underline"
                  >
                    {referral.referralLink.referrer.label}
                  </Link>
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/referrals/${referral.id}`}
                    className="font-mono text-xs hover:underline"
                  >
                    {referral.referredWalletAddress}
                  </Link>
                </td>
                <td className="px-4 py-2">{referral.referredType ?? "—"}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[referral.status]}`}
                  >
                    {referral.status}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {referral.tierPercentSnapshot ? `${referral.tierPercentSnapshot}%` : "—"}
                </td>
                <td className="px-4 py-2 text-neutral-500">
                  {referral.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
            {referrals.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  No referrals yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

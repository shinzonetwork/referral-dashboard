import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { ReferrerType } from "@/generated/prisma/client";

const TYPE_LABELS: Record<ReferrerType, string> = {
  GENERATOR: "Generator",
  HOST: "Host",
  BUILDER: "Builder",
  FOUNDATION_PARTNER: "Foundation / Partner",
};

export default async function ReferrersPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const referrers = await prisma.referrer.findMany({
    where: type ? { type: type as ReferrerType } : undefined,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { links: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Referrers</h1>
        <Link
          href="/referrers/new"
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-neutral-50 dark:text-neutral-900"
        >
          New Referrer
        </Link>
      </div>

      <div className="flex gap-2 text-sm">
        <Link
          href="/referrers"
          className={`rounded-full px-3 py-1 ${!type ? "bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900" : "bg-neutral-100 dark:bg-neutral-800"}`}
        >
          All
        </Link>
        {Object.entries(TYPE_LABELS).map(([value, label]) => (
          <Link
            key={value}
            href={`/referrers?type=${value}`}
            className={`rounded-full px-3 py-1 ${type === value ? "bg-neutral-900 text-white dark:bg-neutral-50 dark:text-neutral-900" : "bg-neutral-100 dark:bg-neutral-800"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
            <tr>
              <th className="px-4 py-2 font-medium">Label</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Wallet</th>
              <th className="px-4 py-2 font-medium">Links</th>
              <th className="px-4 py-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {referrers.map((r) => (
              <tr
                key={r.id}
                className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 dark:border-neutral-900 dark:hover:bg-neutral-900"
              >
                <td className="px-4 py-2">
                  <Link href={`/referrers/${r.id}`} className="font-medium hover:underline">
                    {r.label}
                  </Link>
                </td>
                <td className="px-4 py-2">{TYPE_LABELS[r.type]}</td>
                <td className="px-4 py-2 font-mono text-xs">{r.walletAddress}</td>
                <td className="px-4 py-2">{r._count.links}</td>
                <td className="px-4 py-2 text-neutral-500">
                  {r.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
            {referrers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  No referrers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

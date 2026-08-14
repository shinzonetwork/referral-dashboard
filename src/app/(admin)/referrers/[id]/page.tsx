import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildReferralUrl } from "@/lib/referral-url";
import { generateNewLink, toggleLinkActive } from "@/lib/actions/referrers";
import { CopyButton } from "@/components/copy-button";

const TYPE_LABELS: Record<string, string> = {
  GENERATOR: "Generator",
  HOST: "Host",
  BUILDER: "Builder",
  FOUNDATION_PARTNER: "Foundation / Partner",
};

export default async function ReferrerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const referrer = await prisma.referrer.findUnique({
    where: { id },
    include: {
      links: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { referrals: true } } },
      },
    },
  });

  if (!referrer) notFound();

  const referrals = await prisma.referral.findMany({
    where: { referralLink: { referrerId: id } },
    orderBy: { createdAt: "desc" },
    include: { referralLink: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold">{referrer.label}</h1>
        <p className="text-sm text-neutral-500">
          {TYPE_LABELS[referrer.type]} &middot;{" "}
          <span className="font-mono">{referrer.walletAddress}</span>
        </p>
        {referrer.notes && (
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            {referrer.notes}
          </p>
        )}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase text-neutral-500">
            Referral Links
          </h2>
          <form action={generateNewLink.bind(null, referrer.id, undefined)}>
            <button
              type="submit"
              className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium dark:bg-neutral-800"
            >
              Generate New Link
            </button>
          </form>
        </div>

        <div className="space-y-2">
          {referrer.links.map((link) => (
            <div
              key={link.id}
              className="flex items-center justify-between rounded-md border border-neutral-200 px-4 py-3 dark:border-neutral-800"
            >
              <div>
                <div className="flex items-center gap-2 font-mono text-sm">
                  {buildReferralUrl(link.code)}
                  <CopyButton text={buildReferralUrl(link.code)} />
                </div>
                <p className="text-xs text-neutral-500">
                  {link._count.referrals} referral(s) &middot;{" "}
                  {link.active ? "Active" : `Revoked ${link.revokedAt?.toLocaleDateString()}`}
                </p>
              </div>
              <form action={toggleLinkActive.bind(null, link.id)}>
                <button
                  type="submit"
                  className="rounded-md border border-neutral-300 px-3 py-1 text-xs dark:border-neutral-700"
                >
                  {link.active ? "Revoke" : "Reactivate"}
                </button>
              </form>
            </div>
          ))}
          {referrer.links.length === 0 && (
            <p className="text-sm text-neutral-500">No links yet.</p>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase text-neutral-500">Referrals</h2>
        <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2 font-medium">Referred wallet</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Status</th>
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
                      href={`/referrals/${referral.id}`}
                      className="font-mono text-xs hover:underline"
                    >
                      {referral.referredWalletAddress}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{referral.referredType ?? "—"}</td>
                  <td className="px-4 py-2">{referral.status}</td>
                  <td className="px-4 py-2 text-neutral-500">
                    {referral.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {referrals.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                    No referrals yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

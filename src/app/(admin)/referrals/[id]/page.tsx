import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDefaultTierPercent } from "@/lib/tiers";
import { setReferralStatus } from "@/lib/actions/referrals";

export default async function ReferralDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const referral = await prisma.referral.findUnique({
    where: { id },
    include: {
      referralLink: { include: { referrer: true } },
      verifiedByAdmin: true,
      payoutBatchItem: true,
    },
  });

  if (!referral) notFound();

  const auditLogs = await prisma.auditLog.findMany({
    where: { entityType: "REFERRAL", entityId: id },
    orderBy: { createdAt: "desc" },
    include: { actorAdmin: true },
  });

  const suggestedTier = getDefaultTierPercent(referral.referredType);

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Referral Detail</h1>
        <p className="text-sm text-neutral-500">
          Referrer:{" "}
          <Link
            href={`/referrers/${referral.referralLink.referrerId}`}
            className="hover:underline"
          >
            {referral.referralLink.referrer.label}
          </Link>{" "}
          &middot; Link code:{" "}
          <span className="font-mono">{referral.referralLink.code}</span>
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-neutral-500">Referred wallet</dt>
          <dd className="font-mono">{referral.referredWalletAddress}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Status</dt>
          <dd className="font-medium">{referral.status}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Source</dt>
          <dd>{referral.source}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Tier %</dt>
          <dd>{referral.tierPercentSnapshot ? `${referral.tierPercentSnapshot}%` : "—"}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Verified by</dt>
          <dd>{referral.verifiedByAdmin?.name ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-neutral-500">Batched</dt>
          <dd>{referral.payoutBatchItem ? "Yes" : "No"}</dd>
        </div>
      </dl>

      {referral.notes && (
        <div className="text-sm">
          <p className="text-neutral-500">Notes</p>
          <p className="mt-1 whitespace-pre-wrap">{referral.notes}</p>
        </div>
      )}

      {referral.status !== "VERIFIED" && !referral.payoutBatchItem && (
        <section className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="text-sm font-semibold uppercase text-neutral-500">
            Verify / Reject
          </h2>
          <form
            action={setReferralStatus.bind(null, referral.id, "VERIFIED")}
            className="space-y-3"
          >
            <div className="space-y-1">
              <label className="text-sm font-medium">Referred type</label>
              <select
                name="referredType"
                defaultValue={referral.referredType ?? ""}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              >
                <option value="">Unknown</option>
                <option value="GENERATOR">Generator</option>
                <option value="HOST">Host</option>
                <option value="BUILDER">Builder</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">
                Tier % (defaults to {suggestedTier ?? "n/a"}, override if needed)
              </label>
              <input
                name="tierPercent"
                type="number"
                step="0.01"
                defaultValue={referral.tierPercentSnapshot?.toString() ?? suggestedTier ?? ""}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Evidence / note</label>
              <textarea
                name="note"
                rows={2}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white"
            >
              Mark Verified
            </button>
          </form>

          <form action={setReferralStatus.bind(null, referral.id, "REJECTED")}>
            <input type="hidden" name="note" value="" />
            <button
              type="submit"
              className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 dark:border-red-800 dark:text-red-400"
            >
              Reject
            </button>
          </form>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase text-neutral-500">Activity</h2>
        <ul className="space-y-2 text-sm">
          {auditLogs.map((log) => (
            <li key={log.id} className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800">
              <p>
                <span className="font-medium">{log.action}</span> by{" "}
                {log.actorType === "SYSTEM"
                  ? "system (ingest)"
                  : log.actorType === "SELF_SERVICE"
                    ? "self-service (referrer)"
                    : (log.actorAdmin?.name ?? "admin")}
              </p>
              <p className="text-xs text-neutral-500">{log.createdAt.toLocaleString()}</p>
            </li>
          ))}
          {auditLogs.length === 0 && (
            <p className="text-neutral-500">No activity yet.</p>
          )}
        </ul>
      </section>
    </div>
  );
}

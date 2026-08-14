import { prisma } from "@/lib/prisma";
import { recordManualReferral } from "@/lib/actions/referrals";

export default async function NewReferralPage() {
  const links = await prisma.referralLink.findMany({
    where: { active: true },
    include: { referrer: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Record Referral</h1>
        <p className="text-sm text-neutral-500">
          Manual fallback for when a signup isn&apos;t reported automatically via the
          ingestion API.
        </p>
      </div>

      <form action={recordManualReferral} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Referral link used</label>
          <select
            name="referralLinkId"
            required
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            {links.map((link) => (
              <option key={link.id} value={link.id}>
                {link.referrer.label} — {link.code}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Referred wallet address</label>
          <input
            name="referredWalletAddress"
            required
            placeholder="0x..."
            className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Referred type <span className="text-neutral-500">(if known)</span>
          </label>
          <select
            name="referredType"
            defaultValue=""
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="">Unknown yet</option>
            <option value="GENERATOR">Generator</option>
            <option value="HOST">Host</option>
            <option value="BUILDER">Builder</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Notes <span className="text-neutral-500">(optional)</span>
          </label>
          <textarea
            name="notes"
            rows={3}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>

        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white dark:bg-neutral-50 dark:text-neutral-900"
        >
          Record Referral
        </button>
      </form>
    </div>
  );
}

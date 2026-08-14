"use client";

import { useActionState } from "react";
import { createReferrer, type CreateReferrerState } from "@/lib/actions/referrers";

const initialState: CreateReferrerState = {};

export default function NewReferrerPage() {
  const [state, formAction, pending] = useActionState(createReferrer, initialState);

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-semibold">New Referrer</h1>

      <form action={formAction} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Label</label>
          <input
            name="label"
            required
            placeholder="e.g. Jane Doe, or Acme Foundation"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Wallet address</label>
          <input
            name="walletAddress"
            required
            placeholder="0x..."
            className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Type</label>
          <select
            name="type"
            required
            defaultValue="GENERATOR"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            <option value="GENERATOR">Generator</option>
            <option value="HOST">Host</option>
            <option value="BUILDER">Builder</option>
            <option value="FOUNDATION_PARTNER">Foundation / Partner</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">
            Vanity referral code <span className="text-neutral-500">(optional)</span>
          </label>
          <input
            name="vanityCode"
            placeholder="Leave blank to auto-generate"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          />
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

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-50 dark:text-neutral-900"
        >
          {pending ? "Creating..." : "Create Referrer"}
        </button>
      </form>
    </div>
  );
}

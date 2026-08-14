"use client";

import { useActionState } from "react";
import Image from "next/image";
import { generateOwnReferralLink, type SelfServeState } from "@/lib/actions/self-serve";
import { CopyButton } from "@/components/copy-button";

const initialState: SelfServeState = {};

export default function ReferPage() {
  const [state, formAction, pending] = useActionState(generateOwnReferralLink, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12 dark:bg-neutral-950">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-neutral-200 bg-white p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div>
          <Image
            src="/shinzo-logo.svg"
            alt="Shinzo"
            width={136}
            height={24}
            className="mb-4 h-6 w-auto dark:hidden"
          />
          <Image
            src="/shinzo-logo-white.svg"
            alt="Shinzo"
            width={136}
            height={24}
            className="mb-4 hidden h-6 w-auto dark:block"
          />
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Get Your Referral Link
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            For existing Shinzo generators, hosts, and builders. This link is for
            referring <strong>other people</strong> who want to join — it can&apos;t be
            used to refer yourself. Generators and Hosts must already be confirmed,
            registered operators.
          </p>
        </div>

        {state.url ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Here&apos;s your referral link:
            </p>
            <div className="flex items-center gap-2 rounded-md border border-neutral-200 p-3 font-mono text-sm dark:border-neutral-800">
              <span className="break-all">{state.url}</span>
              <CopyButton text={state.url} />
            </div>
            <p className="text-xs text-neutral-500">
              Share this with people you want to refer. Your referral link is built
              from your own wallet address — you&apos;ll only ever have one, and this
              same page will show it again if you come back.
            </p>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Your wallet address</label>
              <input
                name="walletAddress"
                required
                placeholder="0x..."
                className="w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-sm dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">You are a...</label>
              <select
                name="type"
                required
                defaultValue="GENERATOR"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
              >
                <option value="GENERATOR">Generator</option>
                <option value="HOST">Host</option>
                <option value="BUILDER">Builder</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">
                Display name <span className="text-neutral-500">(optional)</span>
              </label>
              <input
                name="label"
                placeholder="How should we label you internally?"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800"
              />
            </div>

            {state.error && <p className="text-sm text-red-600">{state.error}</p>}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-neutral-50 dark:text-neutral-900"
            >
              {pending ? "Generating..." : "Get My Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

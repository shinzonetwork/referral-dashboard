# Referral Dashboard — Decisions & Open Questions

Living doc tracking what's confirmed vs. what still needs a team decision.
Update this file as answers come in — don't just keep it in chat history.

## Confirmed decisions

1. **View scope (v1)**: Admin-only for monitoring/verification/payouts. No
   public/referrer-facing *dashboard* (no page where a referrer views their
   referrals, status, or earnings). (Resolves the contradiction between the
   requirements doc's "Scope" section — one internal admin view — and its
   "Goals" section, which mentions a public dashboard for referrers.) **Narrow
   exception, see #12 below**: individuals do get one small public page to
   self-generate their own referral link — that's link issuance, not a
   dashboard.
2. **Reward calculation**: Out of scope for this dashboard. It tracks
   verification status and referral type only. A separate, future "accounting
   service" will do the actual % → USDC calculation and execution. This
   dashboard should still record the applicable tier (5% generator / 7% host /
   10% builder) as metadata so that future service has what it needs.
3. **Repo**: Standalone project, not added into the `shinzonetwork/web` pnpm
   monorepo. May borrow visual style from it.
4. **Verification (v1 mechanism)**: Fully manual. Admin sets a referral's
   status to Pending / Verified / Rejected based on information they have
   outside this tool. Every status change is audit-logged (who, when).
5. **Referral identifier shape — RESOLVED with the team (2026-07-29)**: The
   original assumption (a ShinzoHub web signup page at something like
   `shinzo.network/join?ref=CODE`) turned out not to exist — see the "Real
   onboarding flow" history below. After discussion with Max/Daniel/Duncan/
   Lerna, the team settled on a **hybrid identifier model**:
   - **Individuals** (Generator/Host/Builder): their own wallet address IS
     their referral identifier — no separately generated code. Implemented
     by setting `ReferralLink.code` equal to the normalized wallet address
     for self-serve links (`src/lib/actions/self-serve.ts`).
   - **Foundation/Partner**: keep the existing short/vanity code system,
     admin-issued, unchanged — these are easier to put in docs/campaigns
     than a raw address.
   - The registration flow (whatever calls our ingestion endpoint) can
     submit either shape under the same `refCode` field; both endpoints
     (`/api/referrals/ingest`, `/api/referrals/resolve`) normalize and match
     against the same `ReferralLink.code` column, so no dual-lookup logic
     was needed.
   - A validation/preview step was requested: `GET /api/referrals/resolve`
     (see `docs/resolve-contract.md`) lets a caller check a code or wallet
     address *before* submission and show something like "Referred by:
     0xAbc...123" for confirmation.
   - Explicit team guidance: this resolution must return a **wallet address
     or ENS name — never a chosen display name/username** (PII concern per
     Duncan). The resolve endpoint never returns the internal admin-facing
     `label` field for this reason.
   - The CORS-as-security-control idea floated during discussion was
     corrected — CORS only restricts browser JS, not other callers. Real
     protection is the existing shared-secret header pattern
     (`X-Ingest-Token` / `hasValidServiceToken`).
6. **Referrer identity**: Tied to a wallet address, not a traditional
   login/account system. There is no existing validator/host/builder account
   system this ties into.
7. **Tech stack**: Next.js (App Router) + TypeScript + PostgreSQL + Prisma,
   deployed on Vercel.
8. **Admin auth**: Simple email/password login (e.g. NextAuth credentials
   provider) for a small fixed list of admin accounts. No wallet needed to
   access the admin dashboard itself (wallets are only used to identify
   referrers/referred parties, not admins).
9. **Accounting service integration shape**: Pull-based API. The future
   accounting service calls this dashboard to read verified/batched referral
   data — not a CSV file we hand off, and not a webhook we push. Built as
   `GET /api/accounting/payouts` (list batches) and
   `GET /api/accounting/payouts/[id]` (batch detail), token-authenticated the
   same way as the ingestion endpoint. See `docs/accounting-contract.md` — the
   exact consumer-side details (polling cadence, pagination needs, auth
   mechanism preference) are still open, see below.
10. **Multiple/duplicate tiers**: Confirmed — if a referred party ends up
    qualifying as more than one type (e.g. both host and builder), the
    referrer is paid under **both** tiers. The schema already supported this
    (no unique constraint forcing one referral per referred wallet); each
    qualifying type gets its own `Referral` row, gets verified independently,
    and becomes its own line item in a payout batch.
11. **Wallet format**: Confirmed EVM-style addresses (`0x` + 40 hex chars).
    Enforced via `src/lib/validation/wallet.ts`, used by the ingestion
    endpoint and the admin-facing referrer/referral forms. Addresses are
    normalized to lowercase everywhere (EVM addresses are case-insensitive;
    mixed case is just checksum encoding) so lookups and the self-referral
    check below are reliable regardless of input casing.
12. **Self-serve link generation**: Individuals (Generator/Host/Builder)
    generate their own referral link themselves via a public page (`/refer`)
    — no admin involved. Foundation/Partner referrers are still admin-only,
    created the same way as today via the internal dashboard. The self-serve
    link is for referring **other** people — a wallet cannot appear as both
    the referrer and the referred party on the same link (enforced in the
    ingestion endpoint and the manual "Record Referral" admin form; rejected
    with an error). One link per individual is now structural, not just
    policy: since the link's code IS the wallet address (see #5), and
    `Referrer.walletAddress` is unique, a wallet can only ever have one link.
13. **Wallets must be confirmed registered before self-serve — RESOLVED,
    supersedes the old "no wallet-ownership proof" note**: Team decision
    (Lerna + Duncan, 2026-07-29): a wallet must be a **confirmed, registered
    Generator or Host operator** before it's allowed to self-serve a
    referral link — "avoid random or shady wallets." This is stronger than
    the earlier accepted-risk framing (which was about proving *who's
    submitting the form*); this instead gates on the wallet being a *real
    network participant* at all. Implemented as
    `isRegisteredParticipant()` in
    `src/lib/verification/participant-registry.ts`, wired into
    `generateOwnReferralLink` for Generator/Host — **but the function is
    currently a stub that always returns `false`**, because we don't yet
    know the actual mechanism to check this (see open question below). Self-
    serve for Generators/Hosts is effectively paused until that's answered;
    the form shows a clear message rather than silently allowing everyone
    through. **Builders are not covered by this gate** — per the docs
    research, there's no known registration step for Builders to verify
    against at all (see the onboarding-flow notes below), so Builder
    self-serve is left on the old trust-based behavior for now. That's a
    genuine gap, not a considered decision — flagged below.
    Residual narrower gap, worth a follow-up if it matters: this check
    (once wired) confirms the wallet is *somebody's* real registered
    Generator/Host, but doesn't prove the *person filling out our form*
    controls that wallet — someone could still type in another real
    operator's address. Closing that would need a signature/wallet-connect
    step specifically on our `/refer` page, which is a separate, smaller
    question from the registration-gate above.

## Background: real onboarding flow (research, for context)

docs.shinzo.network's actual install/registration docs, for reference —
none of these go through a web signup page:
- **Generators**: Docker/binary install (env vars: `GETH_RPC_URL` etc.),
  then registration is a wallet-signed on-chain transaction via a *local*
  app at `http://localhost:8080/registration-app`.
- **Hosts**: Same pattern — same local `registration-app`, wallet-signed
  on-chain transaction. A CLI method (`cast`) is "in development" but not
  live yet.
- **Builders** ("Views" in the docs): Purely CLI (`viewkit`), generates its
  own wallet locally (`viewkit wallet generate`), deploys straight to
  devnet/testnet. No signup or registration step of any kind.

This is what prompted the team discussion that produced decision #5 above
(hybrid identifier model). What's still open from that original list:
whether a web `?ref=` flow exists anywhere (seems not to, per the docs —
treat as resolved-by-omission unless someone says otherwise), and whether
ShinzoHub itself plays any role in onboarding at all vs. being a separate
surface (e.g. the Studio for browsing/deploying Views).

## Open questions for the team

- **How do we actually check `isRegisteredParticipant`? (the current
  blocker)**: Duncan's note — "only wallets that are registered with
  Shinzohub can get uuids" — implies ShinzoHub maintains a registry of
  confirmed Generator/Host operators, but we don't have an API endpoint, a
  contract address, or an ABI to query it. This is the one concrete thing
  blocking `src/lib/verification/participant-registry.ts` from being real
  instead of a stub that always returns `false`. Need either:
  - A ShinzoHub API endpoint we can call with a wallet address and get back
    registration status (and ideally the UUID Duncan mentioned), or
  - Direct access to query the on-chain "Registered Generators"/"Registered
    Hosts" table ourselves (contract address + ABI + which RPC).
  Until this is answered, self-serve for Generators/Hosts stays paused.
- **Builder verification**: No known registration step exists for Builders
  to check against (see onboarding-flow notes above — it's pure local CLI).
  Should Builder self-serve stay trust-based indefinitely, gate on some
  other signal (e.g. evidence of a deployed View), or is Builder
  attribution simply out of scope for now?
- **Call timing**: Whatever ends up calling `POST /api/referrals/ingest` —
  does it fire before or after the on-chain registration transaction
  confirms? If before, and the transaction later fails/reverts, we'd record
  a PENDING referral for a wallet that never actually registered. Worth
  knowing whether that's handled upstream or needs to be caught during our
  own manual verification.
- **ENS resolution**: Duncan suggested referral identifiers could resolve
  to an ENS name in addition to a raw wallet address. Not implemented
  (`docs/resolve-contract.md`'s `ensName` field is always `null` today) —
  unclear whether this would resolve against Ethereum mainnet or something
  Shinzo-testnet-specific. Low priority, worth a follow-up only once the
  higher-priority registry-check question is answered.
- **Accounting service API details**: Direction (pull) is confirmed, but not
  the specifics — polling cadence, whether pagination is needed, preferred
  auth mechanism (shared token vs. something else), and whether it needs a
  "mark as consumed" step to avoid double-processing a batch.
- **Admin-generated links (foundations etc.)**: What wallet does a
  foundation's link tie to — the foundation's own wallet, or a Shinzo-side
  placeholder? Do these get a distinct tier, or do they inherit
  generator/host/builder tier based on who ends up being referred?
- **Payout batch export format**: Exact columns ops/finance need in the
  monthly export (wallet address, tier %, verified date, referral code,
  batch period, etc.) — needs sign-off from whoever executes payouts. (Same
  fields now also apply to the JSON API shape, not just the CSV.)
- **Admin authentication**: How do internal team members log in — shared
  credential, individual accounts, SSO? How many admins, and do they all
  have equal permission to override verification, or are there roles?
- **Referral link format/domain**: Confirm exact URL structure/domain,
  since this depends on how ShinzoHub's router is set up.
- **Payout cadence specifics**: Exact monthly cutoff day/timezone for
  "batch" boundaries.

# Referral dashboard: technical overview and team implementation requests

## Purpose and current boundary

This repository is a standalone full-stack application for referral operations. It:

- creates referrers and referral links;
- resolves a referral code or wallet address to the referring wallet;
- records referred wallets through an API or an admin form;
- lets an admin mark referrals Pending, Verified, or Rejected;
- snapshots verified, not-yet-batched referrals into a payout batch;
- exposes batch data as admin CSV and as a read-only accounting API; and
- keeps audit records for important changes.

It does not calculate revenue, calculate USDC amounts, execute payments, prove a payout
cryptographically, or provide a referrer-facing analytics dashboard.

## Current technology

- Application: Next.js 16 App Router with React 19 and TypeScript.
- Styling: Tailwind CSS 4 through PostCSS.
- Database: PostgreSQL.
- Data access and migrations: Prisma ORM 7 using `@prisma/adapter-pg` and the `pg`
  driver. The Prisma client is generated into `src/generated/prisma`.
- Admin authentication: NextAuth 4 Credentials provider, bcrypt password hashes, and
  JWT sessions.
- Validation: Zod plus EVM wallet validation (`0x` followed by 40 hexadecimal chars).
- IDs and referral codes: Prisma CUIDs and Nano ID.
- Testing: Vitest; linting: ESLint; production runtime: Next.js/Node.js.
- Intended hosting noted in project decisions: Vercel plus an external PostgreSQL
  database. Deployment configuration is not present in this repository yet.

This is a single Next.js application rather than separate frontend and backend
services. Pages, server actions, API routes, authentication, and database queries live
in the same repository.

## Run the dashboard locally

Prerequisites are Node.js 20.19 or newer, npm, and PostgreSQL. From the repository root:

```bash
npm ci
cp .env.example .env
# Edit DATABASE_URL and the secrets in .env.
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
npm run dev
```

Open `http://localhost:3000` and sign in using the `SEED_ADMIN_EMAIL` and
`SEED_ADMIN_PASSWORD` values. The full environment-variable and troubleshooting guide
is in `docs/local-development.md`.

## Database design

The schema is in `prisma/schema.prisma`, with committed SQL migrations under
`prisma/migrations`.

- `Admin`: internal user email, bcrypt password hash, name, and relationships to
  actions they performed.
- `Referrer`: unique normalized EVM wallet, type, internal label/notes, and optional
  creating admin. Types are Generator, Host, Builder, and Foundation Partner.
- `ReferralLink`: globally unique code belonging to a referrer. A link can be active,
  revoked, or reactivated. Individual self-service codes are their normalized wallet
  address; admin-created foundation/partner links may use vanity codes.
- `Referral`: a referred wallet, optional referred type, status, tier-percent snapshot,
  source, verification details, and notes. The same wallet may have separate rows for
  multiple qualifying types.
- `AuditLog`: actor, action, entity, and before/after JSON snapshots.
- `PayoutBatchSnapshot`: a batch label, creation timestamp, and creating admin.
- `PayoutBatchItem`: immutable referral, wallet, type, tier, and verification data copied
  into a batch. A referral can belong to only one batch.

The default tier metadata is 5% for Generator, 7% for Host, and 10% for Builder. It is
only metadata for the future accounting service; this app does not apply the percentage
to revenue.

## Required referral change in one paragraph

An existing registered Generator first obtains a link whose `ref` value identifies the
referrer. A new Generator opens that link at the current Generator Assertion page. The
registration frontend validates and displays the referral, preserves it from Assertion
through Registration, and does not expose a secret. After on-chain registration reaches
the agreed successful state, the registration backend sends the referral identifier,
the new Generator's canonical EVM wallet, type `GENERATOR`, and safe reconciliation
metadata to the dashboard ingestion API. The registration system must also expose a
wallet-registration lookup so this dashboard can confirm that somebody requesting a
referral link is already a real Generator.

## Runtime flows

### Admin flow

An admin signs in with email/password, creates foundation/partner or other referrers,
records or reviews referrals, changes their verification status, generates payout
batches, and downloads CSV exports. Admin pages and the admin CSV endpoint are protected
by NextAuth middleware/session checks.

### Individual referral-link flow

The public `/refer` page accepts a Generator, Host, or Builder wallet. The intended flow
checks that Generator/Host wallets are registered participants, creates a referrer if
needed, creates one wallet-address-based link, and returns the shareable onboarding URL.

This is not fully operational: `isRegisteredParticipant()` always returns `false`.
Generator and Host self-service is therefore blocked. Builder self-service is currently
trust-based because no Builder registry source has been defined.

### Referred-user flow

The external onboarding frontend receives a `ref` query parameter. It may call the
public `GET /api/referrals/resolve?identifier=...` endpoint to validate it and display
the referring wallet. After the new participant reaches the agreed registration point,
a trusted backend calls `POST /api/referrals/ingest` with a server-only token. The new
referral starts as Pending and an admin verifies it manually.

### Integration with the current two-step Generator registration

The registration screenshots reviewed on 2026-09-01 show this existing flow:

1. `https://registration.shinzo.network/generator-assertion` — Step 1, **Assertion**.
   The user supplies Validator Public Key, Withdrawal Address, and Source Chain, then
   selects **Submit Assertion**.
2. `https://registration.shinzo.network/generator-registration` — Step 2,
   **Registration**. The first step already forwards values in the query string, such
   as `role`, `sourceChain`, `sourceChainId`, and `validatorPublicKey`. The user then
   supplies Signed Message, Public Key, Signed Public Key Message, and Connection
   String, and selects **Register** to register on-chain.

Referral support should be added around these two steps; it should not create a third
manual registration step.

#### Entry into Step 1

The registration application must accept links such as:

```text
https://registration.shinzo.network/generator-assertion?ref=<code-or-referrer-wallet>
```

On initial load it should:

1. Read `ref` without changing its value.
2. Call the dashboard's public resolve endpoint.
3. If valid, retain the identifier and show a small read-only message such as
   `Referral applied — referred by 0x1234…5678`.
4. Never show the dashboard's internal referrer label.
5. If invalid or inactive, show a clear message and do not attribute the registration.
   The recommended behavior is to let the user continue registration without a
   referral; product should confirm this behavior.

Referral validation must not wait until after the user completes both long forms.

#### Transition from Step 1 to Step 2

The referral identifier must survive **Submit Assertion** and every redirect, reload,
wallet-connect transition, and retry. Since the application already passes Step 1 state
to Step 2, it can add the referral identifier to that state:

```text
/generator-registration?role=generator&sourceChain=ethereum&sourceChainId=1&validatorPublicKey=...&ref=...
```

Passing it through a server-side registration/session record is preferable if such a
record already exists. A query parameter is acceptable for attribution but must still
be revalidated server-side; it is user-controlled and must not be trusted as proof.

Step 2 should show the same read-only referral confirmation. It does not need another
editable referral field unless product explicitly wants users to change/remove a
referral at this stage.

#### Successful registration event

The registration frontend must not call the protected ingestion endpoint directly.
After the **Register** operation reaches the agreed success state, the registration
backend should call:

```http
POST <REFERRAL_DASHBOARD_URL>/api/referrals/ingest
Content-Type: application/json
X-Ingest-Token: <server-only secret>
```

Example Generator payload:

```json
{
  "refCode": "0xreferrer-wallet-or-vanity-code",
  "referredWalletAddress": "0xnew-generator-wallet",
  "referredType": "GENERATOR",
  "metadata": {
    "registrationId": "stable-registration-id",
    "registrationTxHash": "0xtransaction-hash",
    "sourceChain": "ethereum",
    "sourceChainId": 1,
    "validatorPublicKey": "public-key-from-step-1"
  }
}
```

Only send metadata needed for reconciliation. Do **not** send the Connection String,
Signed Message, Signed Public Key Message, private keys, access tokens, or other
sensitive registration material to the referral dashboard.

The preferred trigger is after the registration transaction is confirmed to the
protocol's required finality, rather than when the user merely clicks **Register**. If
the backend instead sends at transaction submission time, it must define how failed,
reverted, replaced, or reorganized transactions are corrected.

#### Blocking wallet-identity decision

The screenshots expose more than one possible identity:

- the connected EVM wallet shown in the page header;
- the Withdrawal Address entered in Step 1;
- the Validator Public Key; and
- the Public Key entered in Step 2.

The referral dashboard requires one EVM address in `referredWalletAddress`. The
registration/protocol team must confirm which address is the canonical Generator owner
and must use the same definition when deciding whether an existing Generator is allowed
to obtain their own referral link. The recommended default is the connected wallet that
authorizes/submits registration, **if** that wallet is the protocol's durable participant
identity. Otherwise the team should explicitly select the Withdrawal Address. Validator
and other public keys should remain metadata, not be placed in the wallet field.

#### Existing participant becoming a referrer

This is the reverse integration and is also required:

1. An already registered Generator enters their wallet on this dashboard's `/refer`
   page.
2. `isRegisteredParticipant(wallet, "GENERATOR")` asks the registration system or
   on-chain registry whether that canonical wallet is registered.
3. If registered, the dashboard returns that participant's referral URL.
4. A new Generator opens that URL and enters the two-step flow above.

Step 2 is currently impossible because the registration system has not supplied an API
or on-chain registry contract for the lookup. Until that integration is provided,
Generator self-service referral-link creation remains closed.

### Accounting flow

An admin creates a batch containing every Verified referral that has never been batched.
The accounting service is expected to list batches and fetch batch details using a
separate server-only token. It then owns revenue lookup, USDC calculation, payment, and
receipts.

## Existing interfaces

- `GET /api/referrals/resolve`: public lookup for a code/wallet. Returns `valid`, the
  referring `walletAddress`, and an `ensName` placeholder that is always `null`.
- `POST /api/referrals/ingest`: server-to-server referral creation using
  `X-Ingest-Token`. It is retry-friendly for an existing code/wallet/type tuple.
- `GET /api/accounting/payouts`: token-protected list of all batches.
- `GET /api/accounting/payouts/:id`: token-protected batch detail.
- `GET /api/payouts/:id/csv`: session-protected admin CSV download.

Request/response examples are in `docs/resolve-contract.md`,
`docs/ingest-contract.md`, and `docs/accounting-contract.md`.

## Frontend team: implementation requested

Please integrate referrals into the existing `registration.shinzo.network` Assertion →
Registration flow described above. The current dashboard default
`https://shinzo.network/join` is only a placeholder and must be replaced with the agreed
registration entry route or a participant-type selection route.

The frontend work should:

1. Confirm the production onboarding URL and query parameter name (`ref` is the current
   assumption).
2. Read and preserve the referral identifier from Generator Assertion through Generator
   Registration, including redirects, reloads, wallet connection, and retries.
3. Call `GET /api/referrals/resolve` to validate the identifier and show a confirmation
   using only the returned wallet address (or future ENS name). Do not request or expose
   the internal referrer label.
4. Define behavior for invalid, inactive, expired-looking, or unavailable referral
   identifiers. An invalid referral should not silently be presented as valid.
5. Never call the ingestion endpoint with `INGEST_API_TOKEN` from browser code. The
   token must remain on a trusted server.
6. Confirm whether the onboarding UI and this dashboard share an origin. If they are on
   different origins, agree on a same-origin proxy or add a narrowly scoped CORS policy
   for the public resolve endpoint; the current route sends no CORS headers.
7. Keep referral confirmation read-only on both current steps; do not make the user
   re-enter it after completing Assertion.
8. Confirm whether `/refer` remains in this application or should be linked/embedded in
   another Shinzo product, and provide final copy/design requirements.

Frontend acceptance evidence requested: final URL examples, screenshots of valid and
invalid states, proof that the referral value survives the complete flow, and the exact
backend event triggered after registration.

## Backend/ShinzoHub team: implementation requested

The most urgent request is a source of truth for registered Generator and Host wallets.
Please provide one of:

- an authenticated ShinzoHub endpoint that accepts wallet address and participant type
  and returns registration status (plus the UUID if relevant); or
- the network/RPC, registry contract addresses, ABI, chain IDs, finality requirement,
  and query rules needed for this app to verify registration directly.

Also provide decisions and implementation support for:

1. Who calls `POST /api/referrals/ingest` and from which trusted service.
2. Which existing registration identity becomes `referredWalletAddress`: connected
   wallet or Withdrawal Address. Confirm that the same identity is queryable later.
3. The exact event/timing for ingestion: transaction submitted, transaction confirmed,
   participant activated, or another lifecycle event.
4. A stable unique event/idempotency identifier if retries or reorgs are possible. The
   current application checks for an existing tuple before inserting, but there is no
   matching database unique constraint, so simultaneous requests could race.
5. The behavior when registration fails, is reverted, or is later revoked.
6. How Builder eligibility should be verified, since no Builder registration source is
   currently known.
7. The production service-auth method. Separate shared tokens exist today, but HMAC,
   OAuth client credentials, mTLS, or platform identity may be preferable.
8. Rate limiting and abuse protection for the public resolve endpoint and `/refer`.
9. Whether automated verification will eventually replace or supplement the current
   manual admin status change.

Backend acceptance evidence requested: documented endpoint/contract, test credentials
or a test network, example success/not-found/error responses, retry and timeout rules,
and an end-to-end test that creates a Pending referral without exposing a secret in the
browser.

## To brainstorm

Please confirm:

1. Polling cadence and monthly cutoff day, time, and timezone.
2. Whether the list endpoint requires pagination/filtering as batches accumulate.
3. Whether accounting needs an acknowledgement or `consumedAt` state to prevent
   duplicate processing.
4. The final fields required for JSON and CSV exports.
5. Revenue source and the exact rule for applying the tier percent to first-year revenue.
6. USDC network, token contract, precision/rounding rules, payment executor, transaction
   receipt fields, and failure/retry handling.
7. Whether a referred wallet qualifying for multiple types should produce separate
   payments or one aggregated transfer. The current confirmed data model creates a line
   item for every qualifying type.

The current batch generator labels a batch with the month in which it is created and
includes all Verified, unbatched referrals, regardless of when they were verified. It
does not enforce a cutoff window.

## Infrastructure/security team: implementation requested

Please provide:

1. Production and staging PostgreSQL instances, connection pooling requirements,
   backups, retention, and recovery ownership.
2. Secret storage and rotation for `DATABASE_URL`, `NEXTAUTH_SECRET`,
   `INGEST_API_TOKEN`, and `ACCOUNTING_API_TOKEN`.
3. The final deployment target/domain and `NEXTAUTH_URL`.
4. A migration step using `npx prisma migrate deploy`, followed by
   `npx prisma generate` before `next build` where required by the build environment.
5. An admin-account provisioning process. Decide between individual credentials, a
   shared credential, or SSO, and whether roles/permissions are required.
6. Build-network access for Google Fonts, or a decision to self-host Geist fonts.
7. Logging, monitoring, alerting, API rate limiting, and audit-log retention.

## Decisions still needed before production

- Real referral onboarding domain and integration point.
- Registered-participant verification mechanism and Builder policy.
- Ingestion caller, event timing, authentication, and failure/reorg behavior.
- Admin authentication model and authorization roles.
- Accounting polling, consumption semantics, payout calculation, and payment execution.
- Monthly batch cutoff semantics and timezone.
- Foundation/Partner wallet ownership and tier treatment.
- ENS network/resolver, if ENS display is required.
- Cross-origin strategy for the browser resolve request.

## Known implementation risks

- Generator/Host self-service is intentionally unavailable until the registry stub is
  replaced.
- Builder self-service currently proves neither registration nor wallet ownership.
- No wallet signature proves that the person submitting `/refer` controls the entered
  wallet.
- Referral-ingestion idempotency is implemented as read-then-insert without a database
  uniqueness constraint, leaving a concurrency race.
- Service tokens use direct string comparison and have no rotation/version mechanism.
- Payout APIs return every batch and have no pagination, filtering, or consumed state.
- Batches cannot be regenerated or adjusted through a defined correction workflow.
- Manual status changes are audited, but external registration and revenue truth are not
  integrated.
- The application depends on Google Fonts during production builds.

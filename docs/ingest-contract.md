# Referral Ingestion Contract (current, replaceable)

`POST /api/referrals/ingest` is how a referred signup gets reported into this
dashboard. The team has confirmed the identifier shape (see below) and the
security approach (real auth, not CORS), but **exactly which system calls
this, and at what point in the registration flow, is still open** — see
`team-handoff.md`. This is today's version of the contract;
revisit the caller/timing details once those are confirmed.

## Auth

Header: `X-Ingest-Token: <shared secret>` (env var `INGEST_API_TOKEN`). This is
a placeholder for whatever real service-to-service auth ShinzoHub's team wants
(HMAC signature, OAuth client-credentials, mTLS, etc.) — swap it out here
without touching anything else in the app.

## Request

```
POST /api/referrals/ingest
Content-Type: application/json
X-Ingest-Token: <token>

{
  "refCode": "TESTCODE1",
  "referredWalletAddress": "0x1234567890abcdef1234567890abcdef12345678",
  "referredType": "GENERATOR",   // optional: "GENERATOR" | "HOST" | "BUILDER"
  "metadata": { "any": "extra context" }  // optional, stored as a note
}
```

`refCode` can be **either** a foundation/partner vanity code (e.g.
`dappnode2026`) **or** an individual's own wallet address (e.g.
`0x1234...5678`) — team decision (2026-07-29): individuals' referral
identifier IS their wallet address, not a separately generated code.
Matching is case-insensitive for both shapes. See
`docs/resolve-contract.md` for the companion lookup endpoint that lets a
caller validate/preview an identifier before submitting it here.

## Responses

- `201` — new referral created, `PENDING` status. Body: `{ id, status }`.
- `200` — a referral already existed for this `(refCode, referredWalletAddress,
  referredType)` combination; the call is idempotent and returns the existing
  record instead of creating a duplicate (tolerates retries).
- `400` — payload failed validation, or the `refCode` doesn't match an active
  referral link.
- `401` — missing/incorrect `X-Ingest-Token`.

## Fallback

The admin "Record Referral" form (`/referrals/new`) does the same thing
manually, independent of this endpoint — the dashboard works even if this
integration is delayed or ships differently than described here.

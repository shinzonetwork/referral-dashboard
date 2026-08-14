# Accounting Service API Contract (current, replaceable)

The future accounting service **pulls** payout data from this dashboard via a
read-only API — confirmed direction, but the fine details (polling cadence,
pagination, whether it needs a "mark as consumed" step, preferred auth
mechanism) are **not yet decided by the team**. See
`DECISIONS_AND_OPEN_QUESTIONS.md`. This is today's version; revisit once
those are confirmed.

Deliberately **no dollar amounts appear anywhere in this API** — tier percent
and revenue are handed off as data; the accounting service does the actual
USDC math and execution.

## Auth

Header: `X-Accounting-Token: <shared secret>` (env var `ACCOUNTING_API_TOKEN`).
Same pattern as the ingestion endpoint's `X-Ingest-Token` — a separate token
per integration, both placeholders for whatever real service-to-service auth
gets decided later.

## `GET /api/accounting/payouts`

Lists all payout batches, oldest first.

```
GET /api/accounting/payouts
X-Accounting-Token: <token>
```

```json
{
  "batches": [
    { "id": "cms3...", "periodLabel": "2026-07", "generatedAt": "2026-07-27T16:45:00.000Z", "itemCount": 3 }
  ]
}
```

## `GET /api/accounting/payouts/:id`

Full detail for one batch — one entry per verified referral in that batch.
Note a referrer can appear more than once in a batch if the same referred
wallet qualified under more than one type (e.g. host and builder) — each
qualifying referral is paid independently (see `DECISIONS_AND_OPEN_QUESTIONS.md`,
"Multiple/duplicate tiers").

```
GET /api/accounting/payouts/cms3gkdb800001b8of40u64tl
X-Accounting-Token: <token>
```

```json
{
  "id": "cms3gkdb800001b8of40u64tl",
  "periodLabel": "2026-07",
  "generatedAt": "2026-07-27T16:45:00.000Z",
  "items": [
    {
      "referralId": "cms3gcvlg0000c38oq3lsc2ru",
      "referrerWalletAddress": "0x1111111111111111111111111111111111111111",
      "referredWalletAddress": "0x1234567890abcdef1234567890abcdef12345678",
      "referredType": "GENERATOR",
      "tierPercent": "5",
      "verifiedAt": "2026-07-27T16:44:55.054Z"
    }
  ]
}
```

`404` if the batch id doesn't exist, `401` if the token is missing/wrong.

## Relationship to the CSV export

`GET /api/payouts/:id/csv` (session-protected, admin-only) serves the same
data as a CSV for manual ops use. This API exists in parallel for the
accounting service to consume programmatically — same underlying data, two
audiences.

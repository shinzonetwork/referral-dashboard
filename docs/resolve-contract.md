# Referral Resolve Contract

`GET /api/referrals/resolve` lets a caller — e.g. the registration app, live
as someone types — check whether a referral identifier (a foundation vanity
code, or an individual's own wallet address) is valid, before final
submission. This is what powers a "Referred by: X" confirmation step.

## Auth

**None — intentionally public.** This is meant to be called from browser JS
in real time, where a shared secret can't be hidden anyway, and the
response (a wallet address) is exactly what a referral identifier is
designed to publicly resolve to. If abuse/scraping becomes a problem, add
rate limiting at the infra layer (reverse proxy / edge config), not an
app-level secret.

## Request

```
GET /api/referrals/resolve?identifier=<code-or-wallet-address>
```

`identifier` can be either shape — a foundation's vanity code (e.g.
`dappnode2026`) or an individual's wallet address (e.g.
`0x1234567890abcdef1234567890abcdef12345678`). Matching is
case-insensitive; both shapes get normalized before lookup the same way
they're normalized at creation time.

## Response

```json
{ "valid": true, "walletAddress": "0x1234...5678", "ensName": null }
```

or, if the identifier doesn't match an active referral link:

```json
{ "valid": false }
```

`ensName` is reserved for later — no ENS resolution mechanism is wired up
yet (unclear whether it'd resolve against Ethereum mainnet or something
Shinzo-testnet-specific), so it's always `null` today.

**Never returns the internal admin-facing `label`** (e.g. "Alice's
Generator Node") — per team guidance, a referral identifier should resolve
to a wallet address (or eventually an ENS name), not a chosen display name,
to avoid exposing anything PII-like.

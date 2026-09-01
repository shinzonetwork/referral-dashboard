# Shinzo Referral Dashboard

Internal referral operations dashboard for Shinzo. It creates and resolves referral
links, records referred participants, supports manual verification, snapshots verified
referrals into payout batches, and exports those batches for accounting. It does not
calculate revenue or execute USDC payouts.

## Run locally

Prerequisites:

- Node.js 20.19 or newer
- npm
- A PostgreSQL database and connection string

```bash
npm ci
cp .env.example .env
```

Edit `.env`, then initialize the database:

```bash
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
```

Start the application:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The seed command creates the
admin configured by `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and
`SEED_ADMIN_NAME`, plus a sample referral link with code `TESTCODE1`.

For complete setup instructions, troubleshooting, and test commands, see
[docs/local-development.md](docs/local-development.md).

## Team handoff

The current architecture, database model, integration contracts, known gaps, and
specific requests for the frontend, backend, infrastructure, and accounting teams—now
mapped to the existing two-step Generator Assertion → Registration flow—are in
[docs/team-handoff.md](docs/team-handoff.md).

Existing API contracts:

- [Referral identifier resolution](docs/resolve-contract.md)
- [Referral ingestion](docs/ingest-contract.md)
- [Accounting payout batches](docs/accounting-contract.md)

## Useful commands

```bash
npm run dev       # development server
npm test          # unit tests
npm run lint      # ESLint
npm run build     # production build
npm start         # run a completed production build
npx prisma studio # inspect local database data
```

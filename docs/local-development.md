# Local development guide

## What you need

- Node.js 20.19 or newer. Prisma 7 requires this minimum.
- npm (the repository is locked with `package-lock.json`).
- PostgreSQL, either locally installed or supplied by a hosted development database.

The application does not contain a Docker Compose file and it does not start a
database automatically.

## 1. Install dependencies

From the repository root:

```bash
npm ci
```

Use `npm ci` for a clean, repeatable install. Use `npm install` only when intentionally
changing dependencies.

## 2. Create a PostgreSQL database

If PostgreSQL is installed locally, a typical command is:

```bash
createdb referral_dashboard
```

The exact command depends on the local PostgreSQL user. A hosted PostgreSQL database
also works; use the connection string it provides.

## 3. Configure environment variables

```bash
cp .env.example .env
```

At minimum, update these values:

- `DATABASE_URL`: PostgreSQL connection string in the form
  `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public`.
- `NEXTAUTH_URL`: use `http://localhost:3000` locally.
- `NEXTAUTH_SECRET`: random secret for signing authentication tokens. Generate one
  with `openssl rand -base64 32`.
- `INGEST_API_TOKEN`: secret accepted by `POST /api/referrals/ingest`.
- `ACCOUNTING_API_TOKEN`: separate secret accepted by the accounting endpoints.
- `NEXT_PUBLIC_REFERRAL_BASE_URL`: destination page for generated referral links.
  The example is only a local placeholder because this repository has no `/join`
  page; the frontend team must supply the real onboarding URL.
- `NEXT_PUBLIC_REFERRAL_PARAM`: referral query parameter, currently expected to be
  `ref`.

The `SEED_ADMIN_*` values control the development administrator created by the seed.
Set a private local password rather than relying on the defaults in `prisma/seed.ts`.

`DIRECT_URL` may appear in an existing local environment file, but the current code
does not read it.

## 4. Prepare Prisma and the database

Apply the committed migrations, generate the Prisma client, and add development data:

```bash
npx prisma migrate deploy
npx prisma generate
npx prisma db seed
```

Prisma 7 does not automatically generate the client or run the seed after applying
migrations, so all three commands are intentional.

The seed is safe to run more than once. It upserts the configured admin and creates a
sample referrer/link only when it does not already exist. The sample referral code is
`TESTCODE1`.

When changing `prisma/schema.prisma` during development, create and commit a migration,
then regenerate the client:

```bash
npx prisma migrate dev --name describe_the_change
npx prisma generate
```

Do not use `migrate dev` against production. Deployment environments should use
`npx prisma migrate deploy`.

## 5. Start and sign in

```bash
npm run dev
```

Open `http://localhost:3000`. Sign in with the configured `SEED_ADMIN_EMAIL` and
`SEED_ADMIN_PASSWORD`.

Useful pages:

- `/dashboard`: internal summary
- `/referrers`: referrer and link administration
- `/referrals`: referral review and manual verification
- `/payouts`: snapshot verified referrals and export batches
- `/refer`: public self-service referral-link page
- `/login`: admin login

Generator and Host submissions on `/refer` currently fail closed by design because
`src/lib/verification/participant-registry.ts` is not implemented. Builder submissions
are currently allowed without registry verification.

## 6. Verify the project

```bash
npm test
npm run lint
npm run build
```

The production build downloads Geist and Geist Mono from Google Fonts. It therefore
needs outbound network access during the build. The current lint output contains two
warnings for unused parameters in the intentionally unimplemented participant registry
stub; there are no lint errors.

To inspect data visually:

```bash
npx prisma studio
```

## Common failures

### Database connection failure

Confirm PostgreSQL is running, the host and port are reachable, and special characters
in the username/password are URL-encoded in `DATABASE_URL`.

### Generated Prisma imports are missing

Run `npx prisma generate`. Generated files under `src/generated/prisma` are ignored by
Git and must be recreated after a clean checkout.

### Login fails

Run `npx prisma db seed`, verify the `SEED_ADMIN_*` values used for that command, and
restart the dev server after changing authentication environment variables.

### Production build cannot fetch Geist fonts

Allow access to `fonts.googleapis.com` during the build, or replace the Google font
imports with locally hosted fonts in a separate change.

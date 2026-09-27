# The Nest Church

Next.js application for the public church website, member registration, attendance,
department reports, and administration. Supabase provides PostgreSQL, Auth, and
profile-image Storage. Payload CMS is no longer a runtime dependency.

## Local setup

Use Node.js 22.13 or later and the pnpm version declared in `package.json`.

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
# Fill in the environment values for your church project.
pnpm dev
```

Keep database credentials, `SUPABASE_SECRET_KEY`, and `PUBLIC_OPERATIONS_SECRET`
server-only. The operation secret must match the configured database secret.
`DATABASE_URL` is used by maintenance and birthday-email scripts; application
requests use the Supabase clients in `lib/supabase`.

## Verification

```bash
pnpm test:foundation
pnpm verify:migration-drafts
pnpm typecheck
pnpm build
```

With access authorized for the configured database:

```bash
pnpm audit:supabase-cutover
pnpm verify:public-attendance-operation
```

The cutover audit is read-only and exits unsuccessfully for missing business
tables, duplicate records, incomplete Auth links, missing sequences, or missing
business-table RLS. The public attendance check calls only the search RPC.
Password-login verification is separate and requires verification credentials;
do not reset existing account passwords just to run a check.

## Migration and operations

- Current verification: [docs/supabase-cutover-verification.md](docs/supabase-cutover-verification.md).
- Migration instructions: [supabase/migrations/README.md](supabase/migrations/README.md).
- Historical application record: [supabase/migrations/APPLIED.md](supabase/migrations/APPLIED.md).
- Birthday email scheduling: [docs/birthday-email-cron.md](docs/birthday-email-cron.md).
- Database relationships: [docs/erd.md](docs/erd.md).

The versioned SQL upgrades an existing church database; it is not a complete
empty-database bootstrap. Do not reapply the historical migration set to a live
project just to verify it. Review the target schema and take a verified backup
before authorized schema changes.

Public attendance and report submission still require the production access and
rate-limiting decisions described in the migration instructions. Contact/prayer
form backend delivery and giving integration are separate from this migration.

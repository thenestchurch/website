# Supabase cutover verification — 2026-09-23

Verified against the church project `ybydlinqpusfqzmwdeyo`, with owner authorization.
No schema migrations were reapplied and no production reports were retained by tests.

## Results

- Production Next.js build and TypeScript checking pass.
- All 10 foundation test files pass, including new save-redirect, report-validation,
  error-classification, and missing-session regressions.
- All 15 versioned migration files pass the offline validation.
- Read-only live cutover audit passes: 24 admin profiles, no broken/missing active
  Auth links, no audited duplicate groups, one birthday settings row, required ID
  sequences, pgcrypto, and RLS on all 13 business tables.
- Configured public attendance search RPC succeeds without exposing member records.
- All 21 department-head accounts can insert and return a report for the newest
  service under the `authenticated` database role with their JWT subject. Each
  transaction was rolled back, using an explicit test ID to avoid sequence changes.
  The submitter trigger correctly assigns the actor.
- The newest service (September 20, 2026) had zero reports before verification.
  The report sequence was at the existing maximum ID, and authenticated sequence
  usage was granted.
- Local production HTTP checks confirm login pages render, protected report pages
  redirect signed-out visitors to login, and public report/attendance pages render.
- Browser verification confirms repaired public registration loads its department
  choices without browser errors.

## Fixes

- Public registration now uses the narrow public department RPC instead of an
  authenticated table reader, resolving its HTTP 500 / permission-denied failure.
- Account and department save success redirects are outside error handlers.
- Missing/expired-session promise failures are caught before rendering protected pages.
- Auth refresh responses preserve the Supabase SSR no-cache headers.
- Report submission distinguishes uniqueness, permission, validation, and other
  failures. Previously every repository failure was shown as a duplicate.
- Report counts must be nonnegative PostgreSQL integers; required fields use native
  form validation, and submit buttons disable while requests are pending.
- The migration runner imports its PostgreSQL client; scripts correctly parse
  quoted environment values; Supabase dependencies are pinned and setup docs updated.
- The cutover audit exits unsuccessfully when required integrity/security checks fail.

## Remaining release checks

These changes are local and have not been deployed. The database-role checks do
not verify an actual department-head password login, browser session, or complete
HTTP report submission. The configured migration login-test password is absent;
existing account passwords were not reset. Retest the affected Portals account
on the deployed build to confirm the original submission issue is resolved.

The existing production cutover requirements for public attendance access and
rate limiting remain in `supabase/migrations/README.md`. Legacy Payload metadata
and session tables remain in the database; they were not deleted. The versioned
SQL assumes an existing business schema and is not an empty-database bootstrap.

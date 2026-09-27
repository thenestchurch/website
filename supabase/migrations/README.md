# Supabase migrations

Migrations `0001` through `0015` were applied to the configured Thenestchurch
database on 2026-08-31 after a verified local backup and read-only integrity
audit. They remain versioned SQL and must be reviewed before applying to any
other environment.

Run `pnpm verify:migration-drafts` for an offline-only check of filename order,
versioned-migration markers, transaction wrappers, declared dependencies, and prohibited
destructive statements. The command never initializes a database client.

Run `pnpm audit:supabase-cutover` only after database access is explicitly
authorized. It uses a read-only transaction and reports aggregate schema and
integrity findings without outputting member records.

Run `pnpm migrate:supabase --apply` only after an authorized, verified backup
and a clean audit. It applies the checked-in SQL migrations in numeric order and
stops on the first failed migration; each draft has its own transaction.

Do not run them until all of the following are complete:

1. The target Supabase project and environment are explicitly identified.
2. A database backup or snapshot exists.
3. Existing columns, constraints, nulls, duplicates, roles, and row counts have
   been audited read-only.
4. The SQL has been reviewed against the live schema.
5. The user explicitly authorizes database access and migration execution.

The migrations are intentionally split so additive auth linkage can be reviewed
separately from RLS enablement. Enabling RLS before policy parity is verified
could interrupt the application.

## Public department-list cutover gate

`/members/member-register` reads active departments through a narrow
`security definer` RPC from `0014_narrow_public_reads.sql`, returning only IDs
and names.

Granting anonymous direct `select` access to the departments table is not the
recommended cutover design.

The same draft provides narrow active service and report-content reads for the
public report page. Migration `0005_report_content_rls.sql` and draft `0014`
intentionally grant no anonymous table access.

## Attendance write cutover gate

The attendance write RPC in `0006_attendance_integrity_and_write_rpc.sql` must
not be modified without first confirming that:

- duplicate member/service and date-only attendance groups are audited and
  repaired;
- the attendance ID sequence is confirmed and backed up;
- migrations `0001`, `0003`, and `0006` are reviewed in order; and
- the authenticated admin/staff RPC succeeds and other roles are denied.

The authenticated RPC is intentionally unavailable to `anon`. Draft migrations
`0009_narrow_public_operations.sql` and `0014_narrow_public_reads.sql` provide
bounded, server-secret-checked public save/search RPCs without anonymous table
grants. A kiosk/PIN or signed-token decision and rate limiting are still required
before production cutover because the route itself remains publicly reachable.

## Authenticated report and service write cutover gate

Before changing report or service write policies, audit duplicate reports,
invalid content/counts, and both ID sequences; then confirm the scoped
admin/staff and department-head tests. Public report submission remains a
separate anonymous-RPC and rate-limit decision.

## Auth runtime gate

The login, logout, shared admin layout, and request proxy use Supabase Auth.
Keep the `auth_user_id` linkage complete for every active admin and rerun the
account-class login matrix after any authentication-policy change.

## Public media cutover gate

Draft migration `0015_narrow_public_media.sql` creates the media database row
through a size/type/path-validated, server-secret-checked RPC. The public upload
adapter uses the privileged client only for the Storage object operation and
uses the publishable client for the database RPC. Review and apply migrations
`0008`, `0009`, and `0015` before enabling public Supabase media uploads.

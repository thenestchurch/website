# Applied migration record

On 2026-08-31, migrations `0001` through `0015` were applied in numeric order
to the configured Thenestchurch database.

Preconditions completed:

- Verified custom-format backup in the ignored `backups/` directory.
- Read-only schema/integrity audit completed.
- Two duplicate date-only attendance groups were repaired with approval; six
  redundant rows were removed while retaining the newest row in each group.

Post-application verification confirmed the Auth-link column, expected ID
sequences, pgcrypto extension, and RLS coverage. All audited duplicate counts
were zero.

Supabase Auth accounts were subsequently provisioned for every active admin,
and the application now uses Supabase as its sole runtime backend.

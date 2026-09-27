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

## Attendance function repair — 2026-09-27

Applied only the corrected `save_public_attendance_register` function from
`0009_narrow_public_operations.sql` to the configured church database. Its local
`member_id` variable conflicted with the column in `ON CONFLICT`, raising SQLSTATE
`42702` for public attendance saves. Renaming it to `entry_member_id` resolves
the ambiguity without changing the signature, grants, or secret validation.

The previous function definition was backed up before replacement. Transactional
checks under the `anon` role verified insertion, updating the same attendance row,
and rejection of an invalid secret. Test rows and the temporary test ID default
were rolled back before committing only the function replacement. The real ID
sequence was not advanced, and existing attendance records were preserved.

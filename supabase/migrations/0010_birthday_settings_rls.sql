-- VERSIONED MIGRATION: applied to the configured Thenestchurch database on 2026-08-31; review before applying to any other environment.
-- Review singleton row count and current runner database role before applying.
begin;

do $$
begin
  if (select count(*) from public.birthday_notification_settings) > 1 then
    raise exception 'Birthday notification settings contains more than one row.';
  end if;
end $$;

insert into public.birthday_notification_settings (
  enabled, send_time, member_email_subject, member_email_body,
  admin_summary_subject, admin_summary_body
)
select
  false,
  '08:00',
  'Happy birthday from The Nest Church',
  E'Dear {{firstName}},\n\nHappy birthday from The Nest Church. We celebrate God''s goodness in your life today and pray that this new year is filled with grace, joy, and strength.\n\nWith love,\nThe Nest Church',
  'Birthday list for the week of {{date}}',
  E'Here are the members celebrating birthdays from Sunday through Saturday, beginning {{date}}.\n\n{{memberList}}'
where not exists (select 1 from public.birthday_notification_settings);

create unique index if not exists birthday_notification_settings_singleton
  on public.birthday_notification_settings ((true));

alter table public.birthday_notification_settings enable row level security;
alter table public.birthday_notification_logs enable row level security;
revoke all on public.birthday_notification_settings from anon, authenticated;
revoke all on public.birthday_notification_logs from anon, authenticated;
grant select, update on public.birthday_notification_settings to authenticated;
grant select on public.birthday_notification_logs to authenticated;

drop policy if exists birthday_settings_read_admin_staff on public.birthday_notification_settings;
create policy birthday_settings_read_admin_staff on public.birthday_notification_settings
for select to authenticated
using (private.current_admin_has_role('admin') or private.current_admin_has_role('staff'));

drop policy if exists birthday_settings_update_admin_staff on public.birthday_notification_settings;
create policy birthday_settings_update_admin_staff on public.birthday_notification_settings
for update to authenticated
using (private.current_admin_has_role('admin') or private.current_admin_has_role('staff'))
with check (private.current_admin_has_role('admin') or private.current_admin_has_role('staff'));

drop policy if exists birthday_logs_read_admin_staff on public.birthday_notification_logs;
create policy birthday_logs_read_admin_staff on public.birthday_notification_logs
for select to authenticated
using (private.current_admin_has_role('admin') or private.current_admin_has_role('staff'));

commit;

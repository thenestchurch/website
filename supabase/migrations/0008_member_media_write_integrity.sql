-- VERSIONED MIGRATION: applied to the configured Thenestchurch database on 2026-08-31; review before applying to any other environment.
-- Review storage exposure, existing duplicate emails, and media backfill before applying.
begin;

do $$
begin
  if exists (
    select 1 from public.members
    where email is not null and btrim(email) <> ''
    group by lower(btrim(email)) having count(*) > 1
  ) then
    raise exception 'Duplicate normalized member emails must be resolved before migration 0008.';
  end if;
end $$;

alter table public.media add column if not exists storage_path text;
create unique index if not exists media_storage_path_unique
  on public.media (storage_path) where storage_path is not null;
create unique index if not exists members_email_normalized_unique
  on public.members (lower(btrim(email))) where email is not null and btrim(email) <> '';

create or replace function private.set_member_full_name()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.full_name := concat_ws(' ', new.first_name, nullif(btrim(new.middle_name), ''), new.last_name);
  return new;
end;
$$;

drop trigger if exists members_set_full_name on public.members;
create trigger members_set_full_name
before insert or update of first_name, middle_name, last_name on public.members
for each row execute function private.set_member_full_name();

do $sequences$
declare
  members_sequence text := pg_get_serial_sequence('public.members', 'id');
  media_sequence text := pg_get_serial_sequence('public.media', 'id');
begin
  if members_sequence is null or media_sequence is null then
    raise exception 'Member and media IDs must be sequence-backed before migration 0008.';
  end if;
  perform setval(members_sequence::regclass,
    greatest(coalesce((select max(id) from public.members), 1), 1),
    exists(select 1 from public.members));
  perform setval(media_sequence::regclass,
    greatest(coalesce((select max(id) from public.media), 1), 1),
    exists(select 1 from public.media));
  execute format('grant usage, select on sequence %s to authenticated', members_sequence);
  execute format('grant usage, select on sequence %s to authenticated', media_sequence);
end
$sequences$;

alter table public.media enable row level security;
revoke all on public.media from anon, authenticated;
grant select, insert on public.media to authenticated;

drop policy if exists media_read_authenticated on public.media;
create policy media_read_authenticated on public.media for select to authenticated
using (private.current_admin_id() is not null);

drop policy if exists media_insert_admin_staff on public.media;
create policy media_insert_admin_staff on public.media for insert to authenticated
with check (
  private.current_admin_has_role('admin') or private.current_admin_has_role('staff')
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'member-profile-pictures',
  'member-profile-pictures',
  true,
  5242880,
  array['image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists member_profile_pictures_insert_admin_staff on storage.objects;
create policy member_profile_pictures_insert_admin_staff on storage.objects
for insert to authenticated
with check (
  bucket_id = 'member-profile-pictures'
  and (private.current_admin_has_role('admin') or private.current_admin_has_role('staff'))
);

drop policy if exists member_profile_pictures_delete_admin_staff on storage.objects;
create policy member_profile_pictures_delete_admin_staff on storage.objects
for delete to authenticated
using (
  bucket_id = 'member-profile-pictures'
  and (private.current_admin_has_role('admin') or private.current_admin_has_role('staff'))
);

commit;

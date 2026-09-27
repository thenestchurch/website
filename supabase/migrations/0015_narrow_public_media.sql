-- VERSIONED MIGRATION: applied to the configured Thenestchurch database on 2026-08-31; review before applying to any other environment.
-- Depends on 0008_member_media_write_integrity.sql and 0009_narrow_public_operations.sql.
begin;

create or replace function public.register_public_media(p_input jsonb, p_secret text)
returns public.media
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.media%rowtype;
  media_alt text := nullif(btrim(p_input ->> 'alt'), '');
  media_filename text := nullif(btrim(p_input ->> 'filename'), '');
  media_filesize integer := nullif(p_input ->> 'filesize', '')::integer;
  media_mime_type text := nullif(lower(btrim(p_input ->> 'mimeType')), '');
  media_storage_path text := nullif(btrim(p_input ->> 'storagePath'), '');
  media_url text := nullif(btrim(p_input ->> 'url'), '');
begin
  perform private.assert_public_operation_secret(p_secret);
  if media_alt is null or length(media_alt) > 300 or media_filename is null or length(media_filename) > 255 then
    raise exception 'Valid media alt text and filename are required.';
  end if;
  if media_filesize is null or media_filesize < 1 or media_filesize > 5242880 then
    raise exception 'Profile pictures must be between 1 byte and 5 MB.';
  end if;
  if media_mime_type not in ('image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp') then
    raise exception 'Unsupported profile picture type.';
  end if;
  if media_storage_path is null
    or media_storage_path !~ '^members/[0-9a-f-]{36}(\.[a-z0-9]{1,8})?$'
    or media_url is null or length(media_url) > 2048 then
    raise exception 'Invalid profile picture storage metadata.';
  end if;

  insert into public.media (
    alt, filename, filesize, focal_x, focal_y, height, legacy_path,
    mime_type, storage_path, thumbnail_u_r_l, url, width
  ) values (
    media_alt, media_filename, media_filesize, null, null, null, null,
    media_mime_type, media_storage_path, null, media_url, null
  ) returning * into result;
  return result;
end;
$$;

create or replace function public.get_public_media(p_id integer, p_secret text)
returns public.media
language plpgsql
stable
security definer
set search_path = ''
as $$
declare result public.media%rowtype;
begin
  perform private.assert_public_operation_secret(p_secret);
  select * into result from public.media where id = p_id;
  if not found then return null; end if;
  return result;
end;
$$;

revoke all on function public.register_public_media(jsonb, text) from public, anon, authenticated;
revoke all on function public.get_public_media(integer, text) from public, anon, authenticated;
grant execute on function public.register_public_media(jsonb, text) to anon;
grant execute on function public.get_public_media(integer, text) to anon;

commit;

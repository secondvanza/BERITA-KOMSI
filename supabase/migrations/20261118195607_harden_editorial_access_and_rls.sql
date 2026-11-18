begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.current_user_role()
returns text language sql stable security definer set search_path = ''
as $function$
  select p.role from public.profiles p
  where p.id = (select auth.uid()) and p.is_active = true
$function$;

create or replace function private.can_publish_articles()
returns boolean language sql stable set search_path = ''
as $function$
  select coalesce(private.current_user_role() in ('super_admin','admin','editor_in_chief','editor'),false)
$function$;

create or replace function private.is_editorial_staff()
returns boolean language sql stable set search_path = ''
as $function$
  select coalesce(private.current_user_role() in ('super_admin','admin','editor_in_chief','editor','journalist'),false)
$function$;

revoke all on function private.current_user_role() from public, anon;
revoke all on function private.can_publish_articles() from public, anon;
revoke all on function private.is_editorial_staff() from public, anon;
grant execute on function private.current_user_role() to authenticated;
grant execute on function private.can_publish_articles() to authenticated;
grant execute on function private.is_editorial_staff() to authenticated;

create or replace function public.admin_set_profile_role(target_user_id uuid, new_role text)
returns void language plpgsql security definer set search_path = ''
as $function$
declare actor_role text; target_role text;
begin
  select p.role into actor_role from public.profiles p
  where p.id = (select auth.uid()) and p.is_active = true;
  if actor_role not in ('super_admin','admin') then raise exception 'Hanya admin aktif yang dapat mengubah peran.'; end if;
  if new_role not in ('journalist','editor','editor_in_chief','admin','super_admin') then raise exception 'Peran tidak valid.'; end if;
  select p.role into target_role from public.profiles p where p.id = target_user_id;
  if target_role is null then raise exception 'Pengguna tidak ditemukan.'; end if;
  if target_user_id = (select auth.uid()) and new_role <> actor_role then raise exception 'Admin tidak dapat mengubah perannya sendiri.'; end if;
  if actor_role = 'admin' and (new_role in ('admin','super_admin') or target_role in ('admin','super_admin')) then
    raise exception 'Hanya super admin yang dapat mengelola peran admin dan super admin.';
  end if;
  update public.profiles set role = new_role, updated_at = now() where id = target_user_id;
end;
$function$;

revoke all on function public.admin_set_profile_role(uuid,text) from public, anon;
grant execute on function public.admin_set_profile_role(uuid,text) to authenticated;

revoke all privileges on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (is_active) on table public.profiles to authenticated;

drop policy if exists "Profiles visible to staff" on public.profiles;
create policy "Profiles visible to staff" on public.profiles for select to authenticated
using (id = (select auth.uid()) or private.current_user_role() in ('super_admin','admin'));

drop policy if exists "Admins update profile active status" on public.profiles;
create policy "Admins update profile active status" on public.profiles for update to authenticated
using (private.current_user_role() in ('super_admin','admin')
  and (private.current_user_role() = 'super_admin' or role not in ('super_admin','admin'))
  and id <> (select auth.uid()))
with check (private.current_user_role() in ('super_admin','admin')
  and (private.current_user_role() = 'super_admin' or role not in ('super_admin','admin'))
  and id <> (select auth.uid()));

drop policy if exists "Journalists create own articles" on public.articles;
create policy "Journalists create own articles" on public.articles for insert to authenticated
with check (private.is_editorial_staff() and author_id = (select auth.uid())
  and (private.can_publish_articles() or status in ('draft','in_review','revision')));

drop policy if exists "Authors and editors update articles" on public.articles;
create policy "Authors and editors update articles" on public.articles for update to authenticated
using (private.is_editorial_staff() and (author_id = (select auth.uid()) or private.can_publish_articles()))
with check (private.is_editorial_staff() and (private.can_publish_articles()
  or (author_id = (select auth.uid()) and status in ('draft','in_review','revision'))));

drop policy if exists "Public record article views" on public.article_views;
create policy "Public record article views" on public.article_views for insert to anon, authenticated
with check (exists (select 1 from public.articles a where a.id = article_id and a.status = 'published' and a.published_at <= now()));

drop policy if exists "Public submit comments" on public.comments;
create policy "Public submit comments" on public.comments for insert to anon, authenticated
with check (status = 'pending' and exists (
  select 1 from public.articles a where a.id = article_id and a.status = 'published' and a.published_at <= now()
));

drop function if exists public.current_user_role();
drop function if exists public.can_publish_articles();
drop function if exists public.is_editorial_staff();

commit;

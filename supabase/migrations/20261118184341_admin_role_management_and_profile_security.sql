create or replace function public.admin_set_profile_role(target_user_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare actor_role text;
begin
  select role into actor_role
  from public.profiles
  where id = (select auth.uid()) and is_active = true;
  if actor_role not in ('super_admin','admin') then
    raise exception 'Hanya admin aktif yang dapat mengubah peran.';
  end if;
  if new_role not in ('journalist','editor','editor_in_chief','admin','super_admin') then
    raise exception 'Peran tidak valid.';
  end if;
  if target_user_id = (select auth.uid()) and new_role <> actor_role then
    raise exception 'Admin tidak dapat mengubah perannya sendiri.';
  end if;
  update public.profiles set role = new_role, updated_at = now()
  where id = target_user_id;
  if not found then raise exception 'Pengguna tidak ditemukan.'; end if;
end;
$$;
revoke all on function public.admin_set_profile_role(uuid,text) from public, anon;
grant execute on function public.admin_set_profile_role(uuid,text) to authenticated;

create policy "Admins update profile active status" on public.profiles
for update to authenticated
using (public.current_user_role() in ('super_admin','admin'))
with check (public.current_user_role() in ('super_admin','admin'));

create or replace function public.prevent_profile_role_direct_change()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if new.role is distinct from old.role and current_user not in ('postgres','supabase_admin') then
    raise exception 'Gunakan fungsi pengelolaan peran admin.';
  end if;
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists prevent_profile_role_direct_change on public.profiles;
create trigger prevent_profile_role_direct_change before update on public.profiles
for each row execute function public.prevent_profile_role_direct_change();

grant select on public.articles, public.categories, public.tags, public.events, public.pages to anon, authenticated;
grant select, insert, update, delete on public.articles, public.categories, public.tags, public.events, public.pages to authenticated;
grant select, insert, update, delete on public.profiles, public.media, public.article_tags, public.article_media, public.revisions, public.comments, public.newsletter_subscribers, public.site_settings, public.activity_logs to authenticated;
grant insert on public.comments, public.article_views, public.newsletter_subscribers to anon, authenticated;
grant select on public.comments to anon, authenticated;

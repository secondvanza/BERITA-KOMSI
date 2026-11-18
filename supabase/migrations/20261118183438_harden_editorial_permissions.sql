drop policy if exists "Users update own profile" on public.profiles;
create or replace function public.enforce_article_workflow()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare role_name text;
begin
  select role into role_name from public.profiles where id = (select auth.uid()) and is_active = true;
  if role_name is null then raise exception 'Akun redaksi tidak aktif atau tidak memiliki profil.'; end if;
  if role_name not in ('super_admin','admin','editor_in_chief','editor') then
    if tg_op = 'INSERT' and new.status not in ('draft','in_review') then
      raise exception 'Jurnalis hanya dapat membuat draft atau mengirim untuk review.';
    end if;
    if tg_op = 'UPDATE' and new.status not in ('draft','in_review','revision') then
      raise exception 'Hanya editor yang dapat mengubah status publikasi.';
    end if;
  end if;
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists enforce_article_workflow on public.articles;
create trigger enforce_article_workflow before insert or update on public.articles
for each row execute function public.enforce_article_workflow();

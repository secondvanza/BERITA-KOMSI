create or replace function public.enforce_article_workflow()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  role_name text;
begin
  if (select auth.uid()) is null then
    if session_user in ('postgres','supabase_admin') then
      new.updated_at = now();
      return new;
    end if;
    raise exception 'Akun redaksi tidak aktif atau tidak memiliki sesi.';
  end if;

  select p.role into role_name
  from public.profiles p
  where p.id = (select auth.uid()) and p.is_active = true;

  if role_name is null then
    raise exception 'Akun redaksi tidak aktif atau tidak memiliki profil.';
  end if;

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
$function$;

revoke all on function public.enforce_article_workflow() from public, anon, authenticated;

create or replace function public.prevent_profile_role_direct_change()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if new.role is distinct from old.role and current_user not in ('postgres','supabase_admin','service_role') then
    raise exception 'Gunakan fungsi pengelolaan peran admin.';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

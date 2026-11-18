create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

revoke all on function private.touch_updated_at() from public, anon, authenticated;

drop trigger if exists pages_touch_updated_at on public.pages;
create trigger pages_touch_updated_at
before update on public.pages
for each row execute function private.touch_updated_at();

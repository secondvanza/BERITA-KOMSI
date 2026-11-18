begin;
drop policy if exists "Staff read all events" on public.events;
create policy "Editors read all events" on public.events for select to authenticated
using (private.can_publish_articles());

drop policy if exists "Staff read all pages" on public.pages;
create policy "Editors read all pages" on public.pages for select to authenticated
using (private.can_publish_articles());

drop policy if exists "Editorial staff read all comments" on public.comments;
create policy "Editors read all comments" on public.comments for select to authenticated
using (private.can_publish_articles());
commit;

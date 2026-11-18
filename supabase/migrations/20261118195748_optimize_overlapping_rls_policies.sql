begin;

drop policy if exists "Staff manage categories" on public.categories;
create policy "Editorial staff read categories" on public.categories for select to authenticated
using (private.is_editorial_staff());
create policy "Editors insert categories" on public.categories for insert to authenticated
with check (private.can_publish_articles());
create policy "Editors update categories" on public.categories for update to authenticated
using (private.can_publish_articles()) with check (private.can_publish_articles());
create policy "Editors delete categories" on public.categories for delete to authenticated
using (private.can_publish_articles());

drop policy if exists "Staff manage tags" on public.tags;
create policy "Editorial staff read tags" on public.tags for select to authenticated
using (private.is_editorial_staff());
create policy "Editors insert tags" on public.tags for insert to authenticated
with check (private.can_publish_articles());
create policy "Editors update tags" on public.tags for update to authenticated
using (private.can_publish_articles()) with check (private.can_publish_articles());
create policy "Editors delete tags" on public.tags for delete to authenticated
using (private.can_publish_articles());

drop policy if exists "Editors read all events" on public.events;
drop policy if exists "Editors read all pages" on public.pages;

drop policy if exists "Public read selected settings" on public.site_settings;
create policy "Public read selected settings" on public.site_settings for select to anon
using (key = any (array['site_name','tagline','logo_url','social_links']));

commit;

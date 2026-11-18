drop policy if exists "Published articles are public" on public.articles;
create policy "Published articles are public" on public.articles
for select to anon using(status='published' and published_at<=now());
create policy "Editorial staff read all articles" on public.articles
for select to authenticated using(public.is_editorial_staff());

drop policy if exists "Published events public read" on public.events;
create policy "Published events public read" on public.events
for select to anon using(status='published');
create policy "Staff read all events" on public.events
for select to authenticated using(public.is_editorial_staff());

drop policy if exists "Published pages public read" on public.pages;
create policy "Published pages public read" on public.pages
for select to anon using(is_published);
create policy "Staff read all pages" on public.pages
for select to authenticated using(public.is_editorial_staff());

revoke execute on all functions in schema public from public, anon;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.is_editorial_staff() to authenticated;
grant execute on function public.can_publish_articles() to authenticated;
grant execute on function public.admin_set_profile_role(uuid,text) to authenticated;

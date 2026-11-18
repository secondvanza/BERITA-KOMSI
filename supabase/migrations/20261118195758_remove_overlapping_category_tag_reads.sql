begin;
drop policy if exists "Categories public read" on public.categories;
create policy "Categories public read" on public.categories for select to anon using (true);
drop policy if exists "Tags public read" on public.tags;
create policy "Tags public read" on public.tags for select to anon using (true);
commit;

drop policy if exists "Approved comments public read" on public.comments;
create policy "Approved comments public read" on public.comments
for select to anon using(status='approved');
create policy "Editorial staff read all comments" on public.comments
for select to authenticated using(public.is_editorial_staff());

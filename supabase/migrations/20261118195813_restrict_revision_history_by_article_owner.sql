begin;
drop policy if exists "Staff manage revisions" on public.revisions;

create policy "Staff read permitted revisions" on public.revisions
for select to authenticated
using (
  private.can_publish_articles()
  or exists (
    select 1 from public.articles a
    where a.id = revisions.article_id and a.author_id = (select auth.uid())
  )
);

create policy "Authors and editors create revisions" on public.revisions
for insert to authenticated
with check (
  editor_id = (select auth.uid())
  and (
    private.can_publish_articles()
    or exists (
      select 1 from public.articles a
      where a.id = revisions.article_id and a.author_id = (select auth.uid())
    )
  )
);

create policy "Editors update revisions" on public.revisions
for update to authenticated
using (private.can_publish_articles())
with check (private.can_publish_articles());

create policy "Editors delete revisions" on public.revisions
for delete to authenticated
using (private.can_publish_articles());
commit;

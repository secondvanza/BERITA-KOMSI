begin;

drop policy if exists "Staff manage article tags" on public.article_tags;
drop policy if exists "Published article tags are public" on public.article_tags;

create policy "Public read published article tags"
on public.article_tags for select to anon
using (
  exists (
    select 1 from public.articles a
    where a.id = article_tags.article_id
      and a.status = 'published'
      and a.published_at <= now()
  )
);

create policy "Authenticated read article tags"
on public.article_tags for select to authenticated
using (
  private.is_editorial_staff()
  or exists (
    select 1 from public.articles a
    where a.id = article_tags.article_id
      and a.status = 'published'
      and a.published_at <= now()
  )
);

create policy "Editors and authors insert article tags"
on public.article_tags for insert to authenticated
with check (
  private.can_publish_articles()
  or exists (
    select 1 from public.articles a
    where a.id = article_tags.article_id
      and a.author_id = (select auth.uid())
      and a.status in ('draft','in_review','revision')
  )
);

create policy "Editors and authors update article tags"
on public.article_tags for update to authenticated
using (
  private.can_publish_articles()
  or exists (
    select 1 from public.articles a
    where a.id = article_tags.article_id
      and a.author_id = (select auth.uid())
      and a.status in ('draft','in_review','revision')
  )
)
with check (
  private.can_publish_articles()
  or exists (
    select 1 from public.articles a
    where a.id = article_tags.article_id
      and a.author_id = (select auth.uid())
      and a.status in ('draft','in_review','revision')
  )
);

create policy "Editors and authors delete article tags"
on public.article_tags for delete to authenticated
using (
  private.can_publish_articles()
  or exists (
    select 1 from public.articles a
    where a.id = article_tags.article_id
      and a.author_id = (select auth.uid())
      and a.status in ('draft','in_review','revision')
  )
);

drop policy if exists "Staff manage article media" on public.article_media;
create policy "Editors and authors manage article media"
on public.article_media for all to authenticated
using (
  private.can_publish_articles()
  or exists (
    select 1 from public.articles a
    where a.id = article_media.article_id
      and a.author_id = (select auth.uid())
      and a.status in ('draft','in_review','revision')
  )
)
with check (
  private.can_publish_articles()
  or exists (
    select 1 from public.articles a
    where a.id = article_media.article_id
      and a.author_id = (select auth.uid())
      and a.status in ('draft','in_review','revision')
  )
);

commit;

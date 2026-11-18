create index if not exists activity_logs_actor_id_idx on public.activity_logs(actor_id);
create index if not exists article_media_media_id_idx on public.article_media(media_id);
create index if not exists article_tags_tag_id_idx on public.article_tags(tag_id);
create index if not exists articles_editor_id_idx on public.articles(editor_id);
create index if not exists events_created_by_idx on public.events(created_by);
create index if not exists media_uploaded_by_idx on public.media(uploaded_by);
create index if not exists revisions_article_id_idx on public.revisions(article_id);
create index if not exists revisions_editor_id_idx on public.revisions(editor_id);

begin;

drop policy if exists "Staff manage media" on public.media;
create policy "Editorial staff read media" on public.media
for select to authenticated
using (private.is_editorial_staff());

create policy "Staff upload own media metadata" on public.media
for insert to authenticated
with check (
  private.is_editorial_staff()
  and uploaded_by = (select auth.uid())
);

create policy "Owners and editors update media metadata" on public.media
for update to authenticated
using (
  private.is_editorial_staff()
  and (uploaded_by = (select auth.uid()) or private.can_publish_articles())
)
with check (
  private.is_editorial_staff()
  and (uploaded_by = (select auth.uid()) or private.can_publish_articles())
);

create policy "Admins delete media metadata" on public.media
for delete to authenticated
using (private.current_user_role() in ('super_admin','admin'));

drop policy if exists "Editorial staff upload KOMSI media" on storage.objects;
create policy "Editorial staff upload KOMSI media" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'komsi-media'
  and private.is_editorial_staff()
  and (
    private.can_publish_articles()
    or (storage.foldername(name))[1] = (select auth.uid())::text
  )
);

drop policy if exists "Editorial staff update KOMSI media" on storage.objects;
create policy "Editorial staff update KOMSI media" on storage.objects
for update to authenticated
using (
  bucket_id = 'komsi-media'
  and private.is_editorial_staff()
  and (
    private.can_publish_articles()
    or (storage.foldername(name))[1] = (select auth.uid())::text
  )
)
with check (
  bucket_id = 'komsi-media'
  and private.is_editorial_staff()
  and (
    private.can_publish_articles()
    or (storage.foldername(name))[1] = (select auth.uid())::text
  )
);

commit;

begin;

create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

alter table public.articles
  add constraint articles_scheduled_at_required
  check (status <> 'scheduled' or scheduled_at is not null);

alter table public.articles
  add constraint articles_published_at_required
  check (status <> 'published' or published_at is not null);

select cron.unschedule(jobid)
from cron.job
where jobname = 'publish-scheduled-articles';

select cron.schedule(
  'publish-scheduled-articles',
  '* * * * *',
  $job$
    update public.articles
    set status = 'published',
        published_at = coalesce(scheduled_at, now()),
        updated_at = now()
    where status = 'scheduled'
      and scheduled_at <= now();
  $job$
);

commit;

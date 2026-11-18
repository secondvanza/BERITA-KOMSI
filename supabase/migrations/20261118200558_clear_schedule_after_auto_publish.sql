select cron.unschedule(jobid) from cron.job where jobname='publish-scheduled-articles';
select cron.schedule(
  'publish-scheduled-articles',
  '* * * * *',
  $job$
    update public.articles
    set status = 'published',
        published_at = coalesce(scheduled_at, now()),
        scheduled_at = null,
        updated_at = now()
    where status = 'scheduled'
      and scheduled_at <= now();
  $job$
);

-- "Hey, you saved this -- still want to look into it?" reminder emails,
-- sent once per capture, 3 days after it was saved.

alter table public.captures add column remind_at timestamptz not null default (now() + interval '3 days');
alter table public.captures add column reminder_sent boolean not null default false;

-- the cron sweep scans exactly this: unset reminders whose time has come.
create index captures_remind_idx on public.captures (remind_at) where reminder_sent = false;

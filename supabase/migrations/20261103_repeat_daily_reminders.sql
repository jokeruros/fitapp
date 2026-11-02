-- Allow a user to receive another reminder after postponing it to a new time on the same day.
-- Existing sends are attributed to the user's current reminder time so they are not resent
-- unless the user changes that time.
alter table public.daily_reminder_sends
  add column if not exists reminder_time time;

update public.daily_reminder_sends as sent
set reminder_time = coalesce(pref.reminder_time, time '00:00')
from public.daily_reminder_preferences as pref
where sent.user_id = pref.user_id and sent.reminder_time is null;

update public.daily_reminder_sends
set reminder_time = time '00:00'
where reminder_time is null;

alter table public.daily_reminder_sends
  alter column reminder_time set default time '00:00',
  alter column reminder_time set not null;

alter table public.daily_reminder_sends
  drop constraint if exists daily_reminder_sends_pkey;
alter table public.daily_reminder_sends
  add constraint daily_reminder_sends_pkey primary key (user_id, local_date, reminder_time);

drop function if exists public.get_due_daily_reminders(timestamptz);

create function public.get_due_daily_reminders(p_now timestamptz default now())
returns table(user_id uuid, local_date date, reminder_time time, language text)
language sql
security definer
set search_path = public
as $$
  select pref.user_id, local_clock.local_now::date, pref.reminder_time, pref.language
  from public.daily_reminder_preferences as pref
  cross join lateral (
    select p_now at time zone pref.time_zone as local_now
  ) as local_clock
  where pref.enabled
    and local_clock.local_now >= local_clock.local_now::date + pref.reminder_time
    and local_clock.local_now < local_clock.local_now::date + pref.reminder_time + interval '5 minutes'
    and not exists (
      select 1 from public.daily_progress as progress
      where progress.user_id = pref.user_id and progress.date = local_clock.local_now::date
    )
    and not exists (
      select 1 from public.daily_reminder_sends as sent
      where sent.user_id = pref.user_id
        and sent.local_date = local_clock.local_now::date
        and sent.reminder_time = pref.reminder_time
    );
$$;
revoke all on function public.get_due_daily_reminders(timestamptz) from public, anon, authenticated;
grant execute on function public.get_due_daily_reminders(timestamptz) to service_role;

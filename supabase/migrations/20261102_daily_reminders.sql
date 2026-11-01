create table if not exists public.daily_reminder_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  enabled boolean not null default false,
  reminder_time time not null default '20:00',
  time_zone text not null default 'UTC',
  language text not null default 'en',
  updated_at timestamptz not null default now()
);

alter table public.daily_reminder_preferences enable row level security;
revoke all on table public.daily_reminder_preferences from public, anon;
grant select, insert, update, delete on table public.daily_reminder_preferences to authenticated;
drop policy if exists "Users manage their own reminder preferences" on public.daily_reminder_preferences;
create policy "Users manage their own reminder preferences"
  on public.daily_reminder_preferences for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.push_subscriptions (
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  subscription jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;
revoke all on table public.push_subscriptions from public, anon;
grant select, insert, update, delete on table public.push_subscriptions to authenticated;
drop policy if exists "Users manage their own push subscriptions" on public.push_subscriptions;
create policy "Users manage their own push subscriptions"
  on public.push_subscriptions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.daily_reminder_sends (
  user_id uuid not null references auth.users (id) on delete cascade,
  local_date date not null,
  sent_at timestamptz,
  primary key (user_id, local_date)
);
alter table public.daily_reminder_sends enable row level security;
revoke all on table public.daily_reminder_sends from public, anon, authenticated;
grant select, insert, update, delete on table public.daily_reminder_sends to service_role;

create or replace function public.get_due_daily_reminders(p_now timestamptz default now())
returns table(user_id uuid, local_date date, language text)
language sql
security definer
set search_path = public
as $$
  select pref.user_id, local_clock.local_now::date, pref.language
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
      where sent.user_id = pref.user_id and sent.local_date = local_clock.local_now::date
    );
$$;
revoke all on function public.get_due_daily_reminders(timestamptz) from public, anon, authenticated;
grant execute on function public.get_due_daily_reminders(timestamptz) to service_role;

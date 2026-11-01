create table if not exists public.daily_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  saved_at timestamptz not null default now(),
  goals jsonb not null,
  achieved jsonb not null,
  primary key (user_id, date)
);

alter table public.daily_progress enable row level security;
revoke all on table public.daily_progress from public, anon;
grant select, insert, update, delete on table public.daily_progress to authenticated;

drop policy if exists "Users can read their own daily progress" on public.daily_progress;
create policy "Users can read their own daily progress"
  on public.daily_progress for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert their own daily progress" on public.daily_progress;
create policy "Users can insert their own daily progress"
  on public.daily_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own daily progress" on public.daily_progress;
create policy "Users can update their own daily progress"
  on public.daily_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own daily progress" on public.daily_progress;
create policy "Users can delete their own daily progress"
  on public.daily_progress for delete to authenticated
  using ((select auth.uid()) = user_id);

alter table public.user_data drop constraint if exists user_data_data_key_check;
alter table public.user_data add constraint user_data_data_key_check
  check (data_key in ('foods', 'food_overrides', 'goals', 'meals', 'settings'));

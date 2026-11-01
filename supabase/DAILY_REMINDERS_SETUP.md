# Daily progress reminders

The app sends a reminder only when a user has enabled it, granted notification permission, and has not saved progress for the current day in their time zone. The default time is 20:00 and can be changed in Settings.

## Supabase setup

1. Run `migrations/20261102_daily_reminders.sql` in the Supabase SQL Editor.
2. Install the Supabase CLI and link this project to the Supabase project.
3. Edit `supabase/.env.push.local` and replace the example `PUSH_VAPID_SUBJECT` with a real contact email, for example `mailto:you@example.com`.
4. Set the Edge Function secrets and deploy the function:

   ```powershell
   supabase secrets set --env-file supabase/.env.push.local --project-ref YOUR_PROJECT_REF
   supabase functions deploy send-daily-progress-reminders --project-ref YOUR_PROJECT_REF
   ```

5. In Supabase Dashboard, enable the `pg_cron`, `pg_net`, and `vault` extensions. Then run the following in the SQL Editor, replacing the project ref and cron secret with the values in `supabase/.env.push.local`:

   ```sql
   select vault.create_secret(
     'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-daily-progress-reminders',
     'daily_reminder_function_url',
     'Daily progress reminder function URL'
   );

   select vault.create_secret(
     'CRON_SECRET_FROM_supabase/.env.push.local',
     'daily_reminder_cron_secret',
     'Daily progress reminder cron secret'
   );

   select cron.schedule(
     'send-daily-progress-reminders',
     '* * * * *',
     $$
       select net.http_post(
         url := (select decrypted_secret from vault.decrypted_secrets where name = 'daily_reminder_function_url'),
         headers := jsonb_build_object(
           'Content-Type', 'application/json',
           'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'daily_reminder_cron_secret')
         ),
         body := '{}'::jsonb
       );
     $$
   );
   ```

The scheduler checks each minute. A five-minute delivery window and a per-user/day send record prevent duplicate reminders. Keep `supabase/.env.push.local` private; it contains the VAPID private key and cron secret.

## Local web app

`node scripts/generate-push-secrets.mjs` generates a VAPID key pair, writes the public key into `.env.local`, and writes private server values into the ignored `supabase/.env.push.local`. Restart Vite after generating the key.

Serve the app over HTTPS in production. On iPhone, users need to add NutriTrack to their Home Screen from Safari before granting notification permission. On Android, install the web app from a supported browser and allow notifications.

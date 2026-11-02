import { createClient } from 'npm:@supabase/supabase-js@2'
import * as webpush from 'jsr:@negrel/webpush@0.5.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret'
}

const copy: Record<string, { title: string; body: string }> = {
  en: { title: 'NutriTrack reminder', body: 'Your day is nearly over. Save today’s nutrition progress.' },
  zh: { title: 'NutriTrack 提醒', body: '今天快结束了。保存今天的营养进度。' },
  hi: { title: 'NutriTrack रिमाइंडर', body: 'दिन समाप्त होने वाला है। आज की पोषण प्रगति सहेजें।' },
  es: { title: 'Recordatorio de NutriTrack', body: 'El día casi termina. Guarda tu progreso nutricional de hoy.' },
  ar: { title: 'تذكير NutriTrack', body: 'ينتهي اليوم قريبًا. احفظ تقدمك الغذائي لهذا اليوم.' },
  fr: { title: 'Rappel NutriTrack', body: 'La journée se termine bientôt. Enregistrez votre progression nutritionnelle.' },
  bn: { title: 'NutriTrack অনুস্মারক', body: 'দিন প্রায় শেষ। আজকের পুষ্টির অগ্রগতি সংরক্ষণ করুন।' },
  pt: { title: 'Lembrete NutriTrack', body: 'O dia está acabando. Salve seu progresso nutricional de hoje.' },
  ru: { title: 'Напоминание NutriTrack', body: 'День скоро закончится. Сохраните сегодняшний прогресс питания.' },
  sr: { title: 'NutriTrack podsetnik', body: 'Dan se bliži kraju. Sačuvajte današnji nutritivni napredak.' },
  ur: { title: 'NutriTrack یاد دہانی', body: 'دن ختم ہونے والا ہے۔ آج کی غذائی پیش رفت محفوظ کریں۔' },
  id: { title: 'Pengingat NutriTrack', body: 'Hari hampir berakhir. Simpan progres nutrisi hari ini.' }
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const cronSecret = Deno.env.get('PUSH_CRON_SECRET')
  if (!cronSecret || request.headers.get('x-cron-secret') !== cronSecret) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const exportedVapidKeys = Deno.env.get('PUSH_VAPID_KEYS')
  const subject = Deno.env.get('PUSH_VAPID_SUBJECT')
  if (!supabaseUrl || !serviceRoleKey || !exportedVapidKeys || !subject) {
    return new Response('Missing push server configuration', { status: 500 })
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const vapidKeys = await webpush.importVapidKeys(JSON.parse(exportedVapidKeys), { extractable: false })
  const applicationServer = await webpush.ApplicationServer.new({ contactInformation: subject, vapidKeys })

  const { data: due, error: dueError } = await admin.rpc('get_due_daily_reminders', { p_now: new Date().toISOString() })
  if (dueError) return new Response(dueError.message, { status: 500 })
  if (!due?.length) return Response.json({ sent: 0 })

  const users = [...new Set(due.map((entry: { user_id: string }) => entry.user_id))]
  const { data: subscriptions, error: subscriptionsError } = await admin
    .from('push_subscriptions')
    .select('user_id,endpoint,subscription')
    .in('user_id', users)
  if (subscriptionsError) return new Response(subscriptionsError.message, { status: 500 })

  let sentCount = 0
  for (const candidate of due as Array<{ user_id: string; local_date: string; reminder_time: string; language: string }>) {
    const targets = (subscriptions ?? []).filter(subscription => subscription.user_id === candidate.user_id)
    if (!targets.length) continue

    const { error: claimError } = await admin.from('daily_reminder_sends').insert({
      user_id: candidate.user_id,
      local_date: candidate.local_date,
      reminder_time: candidate.reminder_time
    })
    if (claimError?.code === '23505') continue
    if (claimError) return new Response(claimError.message, { status: 500 })

    const message = copy[candidate.language] ?? copy.en
    const payload = JSON.stringify({ ...message, url: '/' })
    let sent = false
    for (const target of targets) {
      try {
        await applicationServer.subscribe(target.subscription).pushTextMessage(payload, { ttl: 3600 })
        sent = true
      } catch (error) {
        if (error instanceof webpush.PushMessageError && error.isGone()) {
          await admin.from('push_subscriptions').delete().eq('user_id', target.user_id).eq('endpoint', target.endpoint)
        }
        console.error('Unable to deliver daily reminder', target.user_id, error)
      }
    }

    if (sent) {
      await admin.from('daily_reminder_sends').update({ sent_at: new Date().toISOString() })
        .eq('user_id', candidate.user_id).eq('local_date', candidate.local_date).eq('reminder_time', candidate.reminder_time)
      sentCount++
    } else {
      await admin.from('daily_reminder_sends').delete()
        .eq('user_id', candidate.user_id).eq('local_date', candidate.local_date).eq('reminder_time', candidate.reminder_time)
    }
  }

  return Response.json({ sent: sentCount })
})

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface NotificationRecord {
  id: string
  recipient_id: string
  actor_id: string
  type: 'like' | 'comment' | 'follow' | 'mention'
  activity_log_id: string | null
  comment_id: string | null
  title: string
  body: string
  read: boolean
  created_at: string
}

interface WebhookPayload {
  type: 'INSERT'
  table: string
  record: NotificationRecord
  schema: string
}

serve(async (req) => {
  try {
    // Verify webhook secret
    const authHeader = req.headers.get('Authorization')
    const expectedSecret = Deno.env.get('WEBHOOK_SECRET')

    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      console.error('Unauthorized webhook request')
      return new Response('Unauthorized', { status: 401 })
    }

    const payload: WebhookPayload = await req.json()
    const { record } = payload

    // Only process INSERT events
    if (payload.type !== 'INSERT') {
      return new Response('Ignored: not an INSERT', { status: 200 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get push tokens for recipient
    const { data: tokens, error } = await supabase
      .from('push_tokens')
      .select('token')
      .eq('user_id', record.recipient_id)

    if (error) {
      console.error('Error fetching tokens:', error)
      return new Response('Error fetching tokens', { status: 500 })
    }

    if (!tokens?.length) {
      console.log('No push tokens found for user:', record.recipient_id)
      return new Response('No tokens', { status: 200 })
    }

    // Build push messages
    const messages = tokens.map((t) => ({
      to: t.token,
      title: record.title,
      body: record.body,
      sound: 'default' as const,
      data: {
        type: record.type,
        activity_log_id: record.activity_log_id,
        actor_id: record.actor_id,
        notification_id: record.id,
      },
    }))

    // Send to Expo push service
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    const result = await response.json()
    console.log('Push sent:', result)

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error:', err)
    return new Response('Internal error', { status: 500 })
  }
})

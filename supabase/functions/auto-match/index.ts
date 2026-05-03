// Supabase Edge Function: auto-match
// Triggered by pg_cron or external cron service (e.g. Vercel Cron)
// Calls the matching engine every hour

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (_req) => {
  try {
    const { data: entrepreneurs, error } = await supabase
      .rpc('get_unmatched_entrepreneurs')

    if (error) throw error

    let matchesCreated = 0

    for (const e of (entrepreneurs || [])) {
      const { data: candidates } = await supabase
        .rpc('find_overlapping_groups', {
          p_entrepreneur_id: e.id,
          p_min_duration_minutes: 45,
        })

      if (!candidates || candidates.length === 0) continue

      const best = candidates[0]

      const { error: insertErr } = await supabase
        .from('matches')
        .insert({
          entrepreneur_id: e.id,
          student_group_id: best.group_id,
          scheduled_date: best.scheduled_date,
          start_time: best.start_time,
          end_time: best.end_time,
          meeting_type: best.meeting_type,
          status: 'pending',
        })

      if (insertErr) {
        console.error(`Failed to create match for ${e.id}:`, insertErr.message)
        continue
      }

      matchesCreated++
    }

    return new Response(
      JSON.stringify({ success: true, matches_created: matchesCreated }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('auto-match error:', err)
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

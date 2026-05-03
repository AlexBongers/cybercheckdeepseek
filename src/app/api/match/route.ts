import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Run matching engine via RPC
  let matchesCreated = 0
  const errors: string[] = []

  const { data: entrepreneurs, error: fetchErr } = await supabase
    .rpc('get_unmatched_entrepreneurs')

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  }

  for (const e of (entrepreneurs || [])) {
    const { data: candidates, error: matchErr } = await supabase
      .rpc('find_overlapping_groups', {
        p_entrepreneur_id: e.id,
        p_min_duration_minutes: 45,
      })

    if (matchErr) {
      errors.push(matchErr.message)
      continue
    }

    if (!candidates || candidates.length === 0) continue

    const best = candidates[0]

    const { error: insertErr } = await supabase.from('matches').insert({
      entrepreneur_id: e.id,
      student_group_id: best.group_id,
      scheduled_date: best.scheduled_date,
      start_time: best.start_time,
      end_time: best.end_time,
      meeting_type: best.meeting_type,
      status: 'pending',
    })

    if (insertErr) {
      errors.push(insertErr.message)
      continue
    }

    matchesCreated++
  }

  return NextResponse.json({
    success: true,
    matches_created: matchesCreated,
    errors: errors.length > 0 ? errors : undefined,
  })
}

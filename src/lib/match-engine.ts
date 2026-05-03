'use server'

import { createServiceClient } from '@/lib/supabase/server'
import { sendMatchNotification } from '@/lib/email'
import type { Profile } from '@/types/database'

export async function runMatchingEngine(): Promise<{
  success: boolean
  matches_created: number
  errors: string[]
}> {
  const supabase = await createServiceClient()
  const errors: string[] = []
  let matchesCreated = 0

  const { data: entrepreneurs, error: fetchErr } = await supabase
    .rpc('get_unmatched_entrepreneurs')

  if (fetchErr) {
    return { success: false, matches_created: 0, errors: [fetchErr.message] }
  }

  const unmatchedEntrepreneurs = (entrepreneurs || []) as Profile[]

  for (const entrepreneur of unmatchedEntrepreneurs) {
    const { data: groupResults, error: matchErr } = await supabase
      .rpc('find_overlapping_groups', {
        p_entrepreneur_id: entrepreneur.id,
        p_min_duration_minutes: 45,
      })

    if (matchErr) {
      errors.push(`Match error for ${entrepreneur.full_name}: ${matchErr.message}`)
      continue
    }

    const candidates = (groupResults || []) as Array<{
      group_id: string
      group_name: string
      scheduled_date: string
      start_time: string
      end_time: string
      meeting_type: string
      current_match_count: number
    }>

    if (candidates.length === 0) continue

    const best = candidates[0]

    const { error: insertErr } = await supabase.from('matches').insert({
      entrepreneur_id: entrepreneur.id,
      student_group_id: best.group_id,
      scheduled_date: best.scheduled_date,
      start_time: best.start_time,
      end_time: best.end_time,
      meeting_type: best.meeting_type,
      status: 'pending',
    })

    if (insertErr) {
      errors.push(`Insert error for ${entrepreneur.full_name}: ${insertErr.message}`)
      continue
    }

    // Get group members for notification
    const { data: group } = await supabase
      .from('student_groups')
      .select('member_ids')
      .eq('id', best.group_id)
      .single()

    const memberIds: string[] = group?.member_ids || []

    // Send notifications
    await sendMatchNotification({
      entrepreneurEmail: entrepreneur.email,
      entrepreneurName: entrepreneur.full_name,
      groupName: best.group_name,
      scheduledDate: best.scheduled_date,
      startTime: best.start_time,
      endTime: best.end_time,
      memberIds,
    })

    matchesCreated++
  }

  return {
    success: true,
    matches_created: matchesCreated,
    errors,
  }
}

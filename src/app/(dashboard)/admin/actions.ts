'use server'

import { revalidatePath } from 'next/cache'
import { createMatchesForGroup, updateMatchStatus } from '@/lib/db'
import type { MatchStatus } from '@/types/database'

const editableStatuses = new Set<MatchStatus>(['pending', 'confirmed', 'completed', 'cancelled'])

export async function matchGroupToEntrepreneurs(formData: FormData) {
  const groupId = String(formData.get('groupId') ?? '')
  const entrepreneurIds = formData.getAll('entrepreneurIds').map(String).filter(Boolean)

  if (!groupId || entrepreneurIds.length === 0) return

  await createMatchesForGroup(groupId, entrepreneurIds)
  revalidatePath('/admin')
}

export async function updateMatchStatusFromAdmin(formData: FormData) {
  const matchId = String(formData.get('matchId') ?? '')
  const status = String(formData.get('status') ?? '') as MatchStatus

  if (!matchId || !editableStatuses.has(status)) return

  await updateMatchStatus(matchId, status)
  revalidatePath('/admin')
  revalidatePath('/dashboard')
}

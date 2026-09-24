'use server'

import { revalidatePath } from 'next/cache'
import { createMatchesForGroup, deleteEntrepreneur, deleteStudentGroup, getProfileById, updateMatchStatus } from '@/lib/db'
import { getSessionUserId } from '@/lib/session'
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

export async function deleteEntrepreneurFromAdmin(formData: FormData) {
  const userId = await getSessionUserId()
  if (!userId || (await getProfileById(userId))?.role !== 'admin') return

  const entrepreneurId = String(formData.get('entrepreneurId') ?? '').trim()
  if (!entrepreneurId || entrepreneurId.length > 128) return

  await deleteEntrepreneur(entrepreneurId)
  revalidatePath('/admin')
  revalidatePath('/dashboard')
}

export async function deleteStudentGroupFromAdmin(formData: FormData) {
  const userId = await getSessionUserId()
  if (!userId || (await getProfileById(userId))?.role !== 'admin') return

  const groupId = String(formData.get('groupId') ?? '').trim()
  if (!groupId || groupId.length > 128) return

  await deleteStudentGroup(groupId)
  revalidatePath('/admin')
  revalidatePath('/dashboard')
}

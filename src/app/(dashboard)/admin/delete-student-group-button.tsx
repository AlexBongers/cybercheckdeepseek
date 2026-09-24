'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteStudentGroupFromAdmin } from './actions'

export function DeleteStudentGroupButton({
  groupId,
  groupName,
}: {
  groupId: string
  groupName: string
}) {
  return (
    <form
      action={deleteStudentGroupFromAdmin}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Weet je zeker dat je studentengroep ${groupName} wilt verwijderen? De beschikbaarheid en gekoppelde matches worden ook verwijderd. De studentaccounts blijven bestaan.`,
        )
        if (!confirmed) event.preventDefault()
      }}
    >
      <input type="hidden" name="groupId" value={groupId} />
      <Button type="submit" variant="destructive" aria-label={`Verwijder studentengroep ${groupName}`}>
        <Trash2 aria-hidden="true" />
        Verwijderen
      </Button>
    </form>
  )
}

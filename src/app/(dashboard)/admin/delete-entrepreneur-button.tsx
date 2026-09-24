'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteEntrepreneurFromAdmin } from './actions'

export function DeleteEntrepreneurButton({
  entrepreneurId,
  entrepreneurName,
}: {
  entrepreneurId: string
  entrepreneurName: string
}) {
  return (
    <form
      action={deleteEntrepreneurFromAdmin}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Weet je zeker dat je ${entrepreneurName} wilt verwijderen? De beschikbaarheid en gekoppelde matches worden ook verwijderd.`,
        )
        if (!confirmed) event.preventDefault()
      }}
    >
      <input type="hidden" name="entrepreneurId" value={entrepreneurId} />
      <Button type="submit" variant="destructive" aria-label={`Verwijder ${entrepreneurName}`}>
        <Trash2 aria-hidden="true" />
        Verwijderen
      </Button>
    </form>
  )
}

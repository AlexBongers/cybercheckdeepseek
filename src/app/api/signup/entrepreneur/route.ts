import { NextResponse } from 'next/server'
import { createAvailabilitySlots, createProfile } from '@/lib/db'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const slots = Array.isArray(body.slots) ? body.slots : []
    if (
      !String(body.fullName ?? '').trim() ||
      !String(body.email ?? '').trim() ||
      !String(body.companyName ?? '').trim() ||
      !String(body.address ?? '').trim()
    ) {
      return NextResponse.json(
        { error: 'Vul je naam, e-mailadres, bedrijfsnaam en adres in.' },
        { status: 400 }
      )
    }
    if (slots.length === 0) {
      return NextResponse.json({ error: 'Selecteer minimaal één beschikbaar tijdblok.' }, { status: 400 })
    }
    if (slots.length > 10) {
      return NextResponse.json({ error: 'U kunt maximaal 10 tijdsblokken aangeven.' }, { status: 400 })
    }

    const profile = await createProfile({
      role: 'entrepreneur',
      full_name: body.fullName,
      email: body.email,
      password: crypto.randomUUID(),
      company_name: body.companyName,
      phone: body.phone,
      address: body.address,
    })

    if (!profile) {
      return NextResponse.json({ error: 'Aanmelding opslaan mislukt' }, { status: 400 })
    }

    await createAvailabilitySlots(
      slots.map((slot: { dayOfWeek: number; startTime: string; endTime: string }) => ({
        owner_type: 'entrepreneur',
        owner_id: profile.id,
        day_of_week: slot.dayOfWeek,
        start_time: slot.startTime,
        end_time: slot.endTime,
        meeting_type: body.meetingType,
        recurring: true,
      }))
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Aanmelding opslaan mislukt' },
      { status: 400 }
    )
  }
}

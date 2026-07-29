import { NextResponse } from 'next/server'
import { createAvailabilitySlots, createStudentGroup, getOrCreateStudentProfile } from '@/lib/db'

type StudentSignupInput = {
  firstName?: string
  lastName?: string
  email?: string
}

type NormalizedStudent = {
  firstName: string
  lastName: string
  email: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const slots = Array.isArray(body.slots) ? body.slots : []
    const students = Array.isArray(body.students) ? body.students : []
    const validStudents: NormalizedStudent[] = students
      .map((student: StudentSignupInput): NormalizedStudent => ({
        firstName: String(student.firstName ?? '').trim(),
        lastName: String(student.lastName ?? '').trim(),
        email: String(student.email ?? '').trim().toLowerCase(),
      }))
      .filter((student: NormalizedStudent) => student.firstName && student.lastName && student.email)

    if (!String(body.groupName ?? '').trim()) {
      return NextResponse.json({ error: 'Vul een groepsnaam in.' }, { status: 400 })
    }

    if (validStudents.length < 2) {
      return NextResponse.json({ error: 'Voeg minimaal twee studenten toe.' }, { status: 400 })
    }

    const uniqueEmails = new Set(validStudents.map((student) => student.email))
    if (uniqueEmails.size !== validStudents.length) {
      return NextResponse.json({ error: 'Elke student moet een uniek e-mailadres hebben.' }, { status: 400 })
    }

    if (slots.length === 0) {
      return NextResponse.json({ error: 'Selecteer minimaal één beschikbaar tijdblok.' }, { status: 400 })
    }

    if (slots.length > 10) {
      return NextResponse.json({ error: 'U kunt maximaal 10 tijdsblokken aangeven.' }, { status: 400 })
    }

    const profiles = await Promise.all(validStudents.map((student) => getOrCreateStudentProfile(student)))

    if (profiles.some((profile) => !profile)) {
      return NextResponse.json({ error: 'Studentgegevens opslaan mislukt.' }, { status: 400 })
    }

    const group = await createStudentGroup(
      String(body.groupName).trim(),
      profiles.map((profile) => profile!.id)
    )

    if (!group) {
      return NextResponse.json({ error: 'Studentengroep aanmaken mislukt' }, { status: 400 })
    }

    await createAvailabilitySlots(
      slots.map((slot: { dayOfWeek: number; startTime: string; endTime: string }) => ({
        owner_type: 'student_group',
        owner_id: group.id,
        day_of_week: slot.dayOfWeek,
        start_time: slot.startTime,
        end_time: slot.endTime,
        recurring: true,
      }))
    )

    return NextResponse.json({
      success: true,
      groupName: group.name,
      inviteCode: group.invite_code,
      members: profiles.length,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Registratie mislukt' },
      { status: 400 }
    )
  }
}

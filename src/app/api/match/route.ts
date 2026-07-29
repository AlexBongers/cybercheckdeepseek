import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST() {
  return NextResponse.json(
    { error: 'Automatisch matchen is uitgeschakeld. Gebruik handmatig matchen in beheer.' },
    { status: 410 }
  )
}

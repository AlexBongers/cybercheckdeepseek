import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'

let resendInstance: Resend | null = null

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY)
  }
  return resendInstance
}

interface MatchNotificationParams {
  entrepreneurEmail: string
  entrepreneurName: string
  groupName: string
  scheduledDate: string
  startTime: string
  endTime: string
  memberIds: string[]
}

export async function sendMatchNotification(params: MatchNotificationParams) {
  const resend = getResend()
  if (!resend) {
    console.warn('Resend API key not configured — skipping email notification')
    return
  }

  const supabase = await createServiceClient()

  // Get member emails
  const { data: members } = await supabase
    .from('profiles')
    .select('email, full_name')
    .in('id', params.memberIds)

  // Send to entrepreneur
  await resend.emails.send({
    from: process.env.FROM_EMAIL || 'noreply@cybercheck.nl',
    to: params.entrepreneurEmail,
    subject: 'Cybercheck — Match gevonden! 🎉',
    html: `
      <h1>Er is een match gevonden!</h1>
      <p>Beste ${params.entrepreneurName},</p>
      <p>Een studentengroep (<strong>${params.groupName}</strong>) is beschikbaar voor uw cyberveiligheidsscan.</p>
      <p><strong>Datum:</strong> ${params.scheduledDate}<br/>
         <strong>Tijd:</strong> ${params.startTime} - ${params.endTime}</p>
      <p>U ontvangt binnenkort een bevestiging met de definitieve afspraakdetails.</p>
      <p>Met vriendelijke groet,<br/>Team Cybercheck</p>
    `,
  })

  // Send to each student
  for (const member of members || []) {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@cybercheck.nl',
      to: member.email,
      subject: 'Cybercheck — Nieuwe match! 🎉',
      html: `
        <h1>Nieuwe match gevonden!</h1>
        <p>Beste ${member.full_name},</p>
        <p>Jullie groep (<strong>${params.groupName}</strong>) is gematcht met een ondernemer voor een cyberveiligheidsscan.</p>
        <p><strong>Datum:</strong> ${params.scheduledDate}<br/>
           <strong>Tijd:</strong> ${params.startTime} - ${params.endTime}<br/>
           <strong>Ondernemer:</strong> ${params.entrepreneurName}</p>
        <p>Bekijk je dashboard voor meer details.</p>
        <p>Met vriendelijke groet,<br/>Team Cybercheck</p>
      `,
    })
  }
}

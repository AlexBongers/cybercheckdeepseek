'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, ArrowRight, Check, Plus, Trash2, Users } from 'lucide-react'
import { AvailabilityPicker, type TimeSlot } from '@/components/availability-picker'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type StudentRow = {
  firstName: string
  lastName: string
  email: string
}

const emptyStudent = (): StudentRow => ({ firstName: '', lastName: '', email: '' })

export default function StudentSignupPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submittedGroup, setSubmittedGroup] = useState<{ groupName: string; inviteCode: string } | null>(null)

  const [groupName, setGroupName] = useState('')
  const [students, setStudents] = useState<StudentRow[]>([emptyStudent(), emptyStudent(), emptyStudent()])
  const [slots, setSlots] = useState<TimeSlot[]>([])

  const filledStudents = students.filter(
    (student) => student.firstName.trim() && student.lastName.trim() && student.email.trim()
  )

  function updateStudent(index: number, field: keyof StudentRow, value: string) {
    setStudents((current) =>
      current.map((student, i) => (i === index ? { ...student, [field]: value } : student))
    )
  }

  function addStudent() {
    setStudents((current) => [...current, emptyStudent()])
  }

  function removeStudent(index: number) {
    setStudents((current) => current.filter((_, i) => i !== index))
  }

  function validateGroup() {
    if (!groupName.trim()) {
      toast.error('Vul een groepsnaam in.')
      return false
    }

    if (filledStudents.length < 2) {
      toast.error('Voeg minimaal twee studenten toe.')
      return false
    }

    const emails = filledStudents.map((student) => student.email.trim().toLowerCase())
    if (new Set(emails).size !== emails.length) {
      toast.error('Elke student moet een uniek e-mailadres hebben.')
      return false
    }

    return true
  }

  function nextStep() {
    if (step === 1 && !validateGroup()) return
    if (step === 2 && slots.length === 0) {
      toast.error('Selecteer minimaal één beschikbaar tijdblok.')
      return
    }
    setStep(step + 1)
  }

  async function handleSubmit() {
    if (!validateGroup()) return
    if (slots.length === 0) {
      toast.error('Selecteer minimaal één beschikbaar tijdblok.')
      return
    }

    setLoading(true)
    const response = await fetch('/api/signup/student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupName,
        students: filledStudents,
        slots,
      }),
    })

    const result = await response.json()
    setLoading(false)

    if (!response.ok) {
      toast.error(result.error || 'Studentengroep aanmelden mislukt')
      return
    }

    setSubmittedGroup({ groupName: result.groupName, inviteCode: result.inviteCode })
    toast.success('Studentengroep aangemeld.')
  }

  return (
    <div className="min-h-screen bg-[#f4f1ed]">
      <header className="border-b border-slate-950/10 bg-white">
        <div className="hu-band h-2" />
        <Link href="/" className="flex w-fit items-center gap-3 px-6 py-4">
          <Image
            src="/hu-logo.png"
            alt="Hogeschool Utrecht"
            width={32}
            height={32}
            unoptimized
            className="size-8 object-contain"
          />
          <span className="font-extrabold text-slate-900">Cybercheck</span>
        </Link>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-12">
        {submittedGroup ? (
          <Card className="border-slate-950/15 shadow-[6px_6px_0_#ded9d1]">
            <CardHeader>
              <div className="mb-2 flex size-12 items-center justify-center rounded-md bg-[#c8102e] text-white">
                <Check className="size-6" />
              </div>
              <CardTitle className="text-2xl font-extrabold">Studentengroep aangemeld</CardTitle>
              <CardDescription>
                De groep staat nu klaar in beheer om aan ondernemers gekoppeld te worden.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border border-slate-200 bg-white p-4">
                <p className="text-sm font-bold uppercase text-slate-500">Groep</p>
                <p className="mt-1 text-xl font-extrabold">{submittedGroup.groupName}</p>
                <p className="mt-3 text-sm font-bold uppercase text-slate-500">Referentiecode</p>
                <code className="mt-1 inline-block rounded bg-[#fff3bf] px-3 py-2 font-mono text-base font-bold text-slate-950">
                  {submittedGroup.inviteCode}
                </code>
              </div>
              <Link href="/">
                <Button>Terug naar startpagina</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-8 flex items-center justify-center gap-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                      s <= step ? 'bg-[#c8102e] text-white' : 'bg-white text-slate-500'
                    }`}
                  >
                    {s < step ? <Check className="h-4 w-4" /> : s}
                  </div>
                  {s < 3 && <div className={`h-0.5 w-12 ${s < step ? 'bg-[#c8102e]' : 'bg-slate-200'}`} />}
                </div>
              ))}
            </div>

            <Card className="border-slate-950/15 shadow-[6px_6px_0_#ded9d1]">
              <CardHeader>
                <CardTitle className="text-xl font-extrabold">
                  {step === 1 && 'Studentengroep aanmelden'}
                  {step === 2 && 'Beschikbaarheid'}
                  {step === 3 && 'Controle'}
                </CardTitle>
                <CardDescription>
                  {step === 1 && 'Vul de groepsnaam en de gegevens van alle studenten in.'}
                  {step === 2 && 'Geef aan wanneer de groep beschikbaar is voor cyberchecks.'}
                  {step === 3 && 'Controleer de aanmelding voordat je hem verstuurt.'}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <Label htmlFor="groupName">Groepsnaam</Label>
                      <Input
                        id="groupName"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Team CyberSec-1"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Studenten</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addStudent}>
                          <Plus className="size-4" />
                          Student toevoegen
                        </Button>
                      </div>

                      {students.map((student, index) => (
                        <div key={index} className="grid gap-3 border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_1fr_1.4fr_auto]">
                          <Input
                            value={student.firstName}
                            onChange={(e) => updateStudent(index, 'firstName', e.target.value)}
                            placeholder="Voornaam"
                            aria-label={`Voornaam student ${index + 1}`}
                          />
                          <Input
                            value={student.lastName}
                            onChange={(e) => updateStudent(index, 'lastName', e.target.value)}
                            placeholder="Achternaam"
                            aria-label={`Achternaam student ${index + 1}`}
                          />
                          <Input
                            value={student.email}
                            type="email"
                            onChange={(e) => updateStudent(index, 'email', e.target.value)}
                            placeholder="student@hu.nl"
                            aria-label={`E-mailadres student ${index + 1}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStudent(index)}
                            disabled={students.length <= 2}
                            aria-label={`Student ${index + 1} verwijderen`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <AvailabilityPicker
                    value={slots}
                    onChange={setSlots}
                    minDurationMinutes={45}
                  />
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="border border-slate-200 bg-white p-4">
                      <p className="text-sm font-bold uppercase text-slate-500">Groep</p>
                      <p className="mt-1 text-xl font-extrabold">{groupName}</p>
                    </div>
                    <div className="border border-slate-200 bg-white p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Users className="size-4 text-[#c8102e]" />
                        <p className="font-bold">{filledStudents.length} studenten</p>
                      </div>
                      <div className="space-y-2">
                        {filledStudents.map((student) => (
                          <div key={student.email} className="text-sm text-slate-700">
                            {student.firstName} {student.lastName} · {student.email}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="border border-slate-200 bg-white p-4">
                      <p className="font-bold">{slots.length} beschikbaar tijdblok(ken)</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="mt-6 flex items-center justify-between">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Vorige
                </Button>
              ) : (
                <Link href="/">
                  <Button variant="outline" type="button">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Terug
                  </Button>
                </Link>
              )}

              {step < 3 ? (
                <Button onClick={nextStep}>
                  Volgende <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Versturen...' : 'Studentengroep aanmelden'}
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

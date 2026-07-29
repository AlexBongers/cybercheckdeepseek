'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AvailabilityPicker, type TimeSlot } from '@/components/availability-picker'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { MeetingType } from '@/types/database'

export default function EntrepreneurSignupPage() {
  const steps = [
    { number: 1, label: 'Gegevens' },
    { number: 2, label: 'Beschikbaarheid' },
  ]
  const [step, setStep] = useState(() => {
    if (typeof window === 'undefined') return 1
    const requestedStep = Number(new URLSearchParams(window.location.search).get('step'))
    return requestedStep >= 1 && requestedStep <= 2 ? requestedStep : 1
  })
  const [loading, setLoading] = useState(false)
  const [submittedCompanyName, setSubmittedCompanyName] = useState('')

  // Step 1: Company details
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  // Step 2: Availability
  const [slots, setSlots] = useState<TimeSlot[]>([])

  const [meetingType, setMeetingType] = useState<MeetingType>('online')

  function validateDetails() {
    if (!fullName.trim() || !email.trim() || !companyName.trim() || !address.trim()) {
      toast.error('Vul je naam, e-mailadres, bedrijfsnaam en adres in.')
      return false
    }

    return true
  }

  function goToNextStep() {
    if (step === 1 && !validateDetails()) return
    setStep(step + 1)
  }

  async function handleSubmit() {
    if (!validateDetails()) return
    if (slots.length === 0) {
      toast.error('Selecteer minimaal één beschikbaar tijdblok.')
      return
    }

    setLoading(true)

    const response = await fetch('/api/signup/entrepreneur', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName,
        email,
        companyName,
        phone,
        address,
        slots,
        meetingType,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      toast.error(result.error || 'Aanmelding opslaan mislukt')
      setLoading(false)
      return
    }

    toast.success('Aanmelding ontvangen.')
    setSubmittedCompanyName(companyName.trim())
    setLoading(false)
  }

  if (submittedCompanyName) {
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

        <div className="mx-auto max-w-2xl px-4 py-16">
          <Card className="border-slate-950/15 shadow-[6px_6px_0_#ded9d1]">
            <CardHeader>
              <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-[#c8102e] text-white">
                <Check className="size-6" />
              </div>
              <CardTitle className="text-2xl font-extrabold">Aanmelding ontvangen</CardTitle>
              <CardDescription>
                Bedankt. De gegevens en beschikbaarheid van {submittedCompanyName} staan nu klaar voor de beheerder.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Zodra er een passende studentgroep is gekoppeld, kan de coördinator contact opnemen via het opgegeven e-mailadres.
              </p>
              <Link href="/">
                <Button type="button">Terug naar startpagina</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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

      <div className="mx-auto max-w-2xl px-4 py-12">
        {/* Progress bar */}
        <div className="mb-8 flex items-start justify-center gap-2">
          {steps.map((item) => (
            <div key={item.number} className="flex items-start gap-2">
              <div className="flex min-w-20 flex-col items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                    item.number <= step ? 'bg-[#c8102e] text-white' : 'bg-white text-slate-500'
                  }`}
                >
                  {item.number < step ? <Check className="h-4 w-4" /> : item.number}
                </div>
                <span
                  className={`text-center text-xs font-bold ${
                    item.number <= step ? 'text-slate-950' : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
              </div>
              {item.number < steps.length && (
                <div className={`mt-4 h-0.5 w-8 ${item.number < step ? 'bg-[#c8102e]' : 'bg-slate-200'}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="border-slate-950/15 shadow-[6px_6px_0_#ded9d1]">
          <CardHeader>
            <CardTitle className="text-xl font-extrabold">
              {step === 1 && 'Bedrijfsgegevens'}
              {step === 2 && 'Beschikbaarheid'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Vul je bedrijfs- en contactgegevens in.'}
              {step === 2 && 'Geef aan wanneer je beschikbaar bent en hoe je het interview het liefst afneemt.'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Volledige naam</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="Jan Jansen"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mailadres</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="jan@bedrijf.nl"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="companyName">Bedrijfsnaam</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    placeholder="Jansen IT Solutions"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefoonnummer</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06-12345678"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Adres</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    placeholder="Straatnaam 123, 1234 AB Amsterdam"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <AvailabilityPicker
                  value={slots}
                  onChange={setSlots}
                  minDurationMinutes={45}
                />
                <div className="space-y-3 border-t border-slate-200 pt-5">
                <Label>Interviewvoorkeur</Label>
                <RadioGroup
                  value={meetingType}
                  onValueChange={(v) => setMeetingType(v as MeetingType)}
                  className="space-y-3"
                >
                  <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 cursor-pointer hover:bg-slate-50">
                    <RadioGroupItem value="online" id="online" />
                    <div>
                      <p className="font-medium">Voorkeur voor interview online</p>
                      <p className="text-sm text-slate-500">
                        Het interview vindt plaats via Microsoft Teams. U ontvangt een link na de match.
                      </p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 cursor-pointer hover:bg-slate-50">
                    <RadioGroupItem value="onsite" id="onsite" />
                    <div>
                      <p className="font-medium">Voorkeur voor interview op locatie</p>
                      <p className="text-sm text-slate-500">
                        De studentengroep komt naar uw bedrijfslocatie voor het interview.
                      </p>
                    </div>
                  </label>
                </RadioGroup>
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
          {step < steps.length ? (
            <Button onClick={goToNextStep}>
              Volgende <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Aanmelding versturen...' : 'Aanmelding versturen'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

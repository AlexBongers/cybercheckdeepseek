'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AvailabilityPicker, type TimeSlot } from '@/components/availability-picker'
import { Shield, ArrowLeft, ArrowRight, Check } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import type { MeetingType } from '@/types/database'

export default function EntrepreneurSignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1: Company details
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyKvk, setCompanyKvk] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')

  // Step 2: Availability
  const [slots, setSlots] = useState<TimeSlot[]>([])

  // Step 3: Meeting preference
  const [meetingType, setMeetingType] = useState<MeetingType>('online')

  async function handleSubmit() {
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      toast.error('Account aanmaken mislukt')
      setLoading(false)
      return
    }

    const userId = data.user.id

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      role: 'entrepreneur',
      full_name: fullName,
      email,
      company_name: companyName,
      company_kvk: companyKvk,
      phone,
      address,
    })

    if (profileError) {
      toast.error(profileError.message)
      setLoading(false)
      return
    }

    // Create availability slots
    if (slots.length > 0) {
      const slotRows = slots.map((s) => ({
        owner_type: 'entrepreneur' as const,
        owner_id: userId,
        day_of_week: s.dayOfWeek,
        start_time: s.startTime,
        end_time: s.endTime,
        meeting_type: meetingType,
        recurring: true,
      }))

      const { error: slotError } = await supabase.from('availability_slots').insert(slotRows)
      if (slotError) {
        toast.error('Fout bij opslaan beschikbaarheid: ' + slotError.message)
      }
    }

    toast.success('Account aangemaakt! Je wordt doorgestuurd naar je dashboard.')
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <Shield className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-slate-900">Cybercheck</span>
        </Link>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-12">
        {/* Progress bar */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  s <= step ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {s < step ? <Check className="h-4 w-4" /> : s}
              </div>
              {s < 3 && <div className={`h-0.5 w-12 ${s < step ? 'bg-blue-600' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {step === 1 && 'Bedrijfsgegevens'}
              {step === 2 && 'Beschikbaarheid'}
              {step === 3 && 'Voorkeur'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Vul je bedrijfs- en contactgegevens in.'}
              {step === 2 && 'Geef aan wanneer je beschikbaar bent voor een interview van 45 minuten.'}
              {step === 3 && 'Kies hoe je het interview wilt afnemen.'}
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
                  <Label htmlFor="password">Wachtwoord</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Minimaal 8 karakters"
                  />
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="kvk">KVK-nummer</Label>
                    <Input
                      id="kvk"
                      value={companyKvk}
                      onChange={(e) => setCompanyKvk(e.target.value)}
                      placeholder="12345678"
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
                </div>
                <div>
                  <Label htmlFor="address">Adres (optioneel)</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Straatnaam 123, 1234 AB Amsterdam"
                  />
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
                <Label>Type interview</Label>
                <RadioGroup
                  value={meetingType}
                  onValueChange={(v) => setMeetingType(v as MeetingType)}
                  className="space-y-3"
                >
                  <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 cursor-pointer hover:bg-slate-50">
                    <RadioGroupItem value="online" id="online" />
                    <div>
                      <p className="font-medium">Online (Microsoft Teams)</p>
                      <p className="text-sm text-slate-500">
                        Het interview vindt plaats via Microsoft Teams. Je ontvangt een link na de match.
                      </p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 cursor-pointer hover:bg-slate-50">
                    <RadioGroupItem value="onsite" id="onsite" />
                    <div>
                      <p className="font-medium">Op locatie</p>
                      <p className="text-sm text-slate-500">
                        De studentengroep komt naar jouw bedrijfslocatie voor het interview.
                      </p>
                    </div>
                  </label>
                </RadioGroup>
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
            <Button onClick={() => setStep(step + 1)}>
              Volgende <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Account aanmaken...' : 'Account aanmaken'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

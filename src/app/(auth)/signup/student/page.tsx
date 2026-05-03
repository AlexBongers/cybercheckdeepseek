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
import { Shield, ArrowLeft, ArrowRight, Check, Users } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function StudentSignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  // Step 1: Account & group
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [groupAction, setGroupAction] = useState<'create' | 'join'>('create')
  const [groupName, setGroupName] = useState('')
  const [inviteCode, setInviteCode] = useState('')

  // Step 2: Availability
  const [slots, setSlots] = useState<TimeSlot[]>([])

  // Step 3: Confirm
  const [userId, setUserId] = useState('')

  async function handleCreateGroup() {
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

    const uid = data.user.id
    setUserId(uid)

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: uid,
      role: 'student',
      full_name: fullName,
      email,
    })

    if (profileError) {
      toast.error(profileError.message)
      setLoading(false)
      return
    }

    // Create group with invite code
    const { data: groupData, error: groupError } = await supabase
      .from('student_groups')
      .insert({
        name: groupName || `Groep ${fullName}`,
        member_ids: [uid],
      })
      .select('invite_code')
      .single()

    if (groupError) {
      toast.error(groupError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    toast.success(`Groep aangemaakt! Je uitnodigingscode is: ${groupData.invite_code}`)
    setStep(2)
  }

  async function handleJoinGroup() {
    setLoading(true)

    // Verify invite code exists
    const { data: group, error: groupError } = await supabase
      .from('student_groups')
      .select('id, member_ids, name')
      .eq('invite_code', inviteCode.toUpperCase())
      .single()

    if (groupError || !group) {
      toast.error('Ongeldige uitnodigingscode')
      setLoading(false)
      return
    }

    if (group.member_ids.length >= 3) {
      toast.error('Deze groep is al vol (max 3 leden)')
      setLoading(false)
      return
    }

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

    const uid = data.user.id
    setUserId(uid)

    // Create profile
    const { error: profileError } = await supabase.from('profiles').insert({
      id: uid,
      role: 'student',
      full_name: fullName,
      email,
    })

    if (profileError) {
      toast.error(profileError.message)
      setLoading(false)
      return
    }

    // Add to group
    const { error: updateError } = await supabase
      .from('student_groups')
      .update({
        member_ids: [...group.member_ids, uid],
      })
      .eq('id', group.id)

    if (updateError) {
      toast.error(updateError.message)
      setLoading(false)
      return
    }

    setLoading(false)
    toast.success(`Je bent toegevoegd aan ${group.name}!`)
    setStep(2)
  }

  async function handleSaveAvailability() {
    setLoading(true)

    if (slots.length > 0) {
      // Find the user's group
      const { data: group } = await supabase
        .from('student_groups')
        .select('id')
        .contains('member_ids', [userId])
        .single()

      if (group) {
        const slotRows = slots.map((s) => ({
          owner_type: 'student_group' as const,
          owner_id: group.id,
          day_of_week: s.dayOfWeek,
          start_time: s.startTime,
          end_time: s.endTime,
          recurring: true,
        }))

        const { error: slotError } = await supabase.from('availability_slots').insert(slotRows)
        if (slotError) {
          toast.error('Fout bij opslaan beschikbaarheid: ' + slotError.message)
          setLoading(false)
          return
        }
      }
    }

    toast.success('Beschikbaarheid opgeslagen! Je wordt doorgestuurd naar je dashboard.')
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
              {step === 1 && 'Account & Groep'}
              {step === 2 && 'Beschikbaarheid'}
              {step === 3 && 'Bevestigen'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Maak je account aan en maak of join een studentengroep.'}
              {step === 2 && 'Geef aan wanneer jullie groep beschikbaar is.'}
              {step === 3 && 'Controleer je gegevens en rond de registratie af.'}
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
                      placeholder="Lisa de Vries"
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
                      placeholder="lisa@student.hva.nl"
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

                <div className="pt-2">
                  <Label>Groepsoptie</Label>
                  <RadioGroup
                    value={groupAction}
                    onValueChange={(v) => setGroupAction(v as 'create' | 'join')}
                    className="flex gap-4 mt-2"
                  >
                    <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 cursor-pointer hover:bg-slate-50 flex-1">
                      <RadioGroupItem value="create" id="create" />
                      <Users className="h-4 w-4 text-slate-500" />
                      <span className="font-medium text-sm">Nieuwe groep maken</span>
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 cursor-pointer hover:bg-slate-50 flex-1">
                      <RadioGroupItem value="join" id="join" />
                      <Users className="h-4 w-4 text-slate-500" />
                      <span className="font-medium text-sm">Groep joinen</span>
                    </label>
                  </RadioGroup>
                </div>

                {groupAction === 'create' ? (
                  <>
                    <div>
                      <Label htmlFor="groupName">Groepsnaam</Label>
                      <Input
                        id="groupName"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="Team CyberSec-1"
                      />
                    </div>
                    <Button onClick={handleCreateGroup} disabled={loading} className="w-full">
                      {loading ? 'Groep aanmaken...' : 'Groep aanmaken & doorgaan'}
                    </Button>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="inviteCode">Uitnodigingscode</Label>
                      <Input
                        id="inviteCode"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        placeholder="ABC123"
                        className="font-mono text-center text-lg tracking-widest"
                        maxLength={6}
                      />
                    </div>
                    <Button onClick={handleJoinGroup} disabled={loading} className="w-full">
                      {loading ? 'Groep joinen...' : 'Groep joinen & doorgaan'}
                    </Button>
                  </>
                )}
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
                <div className="rounded-lg bg-slate-100 p-4 space-y-2">
                  <p><strong>Naam:</strong> {fullName}</p>
                  <p><strong>E-mail:</strong> {email}</p>
                  <p><strong>Groepsnaam:</strong> {groupName || inviteCode}</p>
                  <p><strong>Beschikbare slots:</strong> {slots.length} tijdblok(ken)</p>
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
          {step < 2 ? (
            <Button onClick={() => setStep(step + 1)} disabled>
              Volgende <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : step === 2 ? (
            <Button onClick={() => {
              if (slots.length === 0) {
                toast.error('Selecteer minimaal één tijdblok')
                return
              }
              setStep(3)
            }}>
              Volgende <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSaveAvailability} disabled={loading}>
              {loading ? 'Opslaan...' : 'Registratie afronden'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MatchCard } from '@/components/match-card'
import { CalendarCheck, Clock, Users, Building2 } from 'lucide-react'
import type { Match, Profile, StudentGroup } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile, error: profileErr } = await serviceClient
    .from('profiles')
    .select()
    .eq('id', user.id)
    .maybeSingle()

  if (profileErr || !profile) {
    console.error('Profile fetch error:', profileErr)
    redirect('/login')
  }

  let matches: Array<Match & {
    entrepreneur?: Profile | null
    student_group?: StudentGroup | null
  }> = []

  if (profile.role === 'entrepreneur') {
    const { data } = await serviceClient
      .from('matches')
      .select('*, student_group:student_group_id(*)')
      .eq('entrepreneur_id', user.id)
      .order('created_at', { ascending: false })
    matches = data || []
  } else if (profile.role === 'student') {
    const { data: groups } = await serviceClient
      .from('student_groups')
      .select('id')
      .contains('member_ids', [user.id])

    if (groups && groups.length > 0) {
      const groupIds = groups.map((g) => g.id)
      const { data } = await serviceClient
        .from('matches')
        .select('*, entrepreneur:entrepreneur_id(*)')
        .in('student_group_id', groupIds)
        .order('created_at', { ascending: false })
      matches = data || []
    }
  }

  const pending = matches.filter((m) => m.status === 'pending')
  const confirmed = matches.filter((m) => m.status === 'confirmed')
  const completed = matches.filter((m) => m.status === 'completed')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welkom, {profile.full_name}
        </h1>
        <p className="text-slate-500 mt-1">
          {profile.role === 'entrepreneur' && 'Beheer je interviews en volg de status van je matches.'}
          {profile.role === 'student' && 'Bekijk jullie aankomende interviews en match details.'}
          {profile.role === 'admin' && 'Je bent ingelogd als beheerder. Gebruik het zijmenu om naar het beheerpaneel te gaan.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Aankomend</CardTitle>
            <CalendarCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pending.length + confirmed.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Afgerond</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{completed.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Rol</CardTitle>
            {profile.role === 'entrepreneur' ? (
              <Building2 className="h-4 w-4 text-slate-600" />
            ) : (
              <Users className="h-4 w-4 text-slate-600" />
            )}
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize">{profile.role === 'admin' ? 'Beheerder' : profile.role}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Alle ({matches.length})</TabsTrigger>
          <TabsTrigger value="pending">In afwachting ({pending.length})</TabsTrigger>
          <TabsTrigger value="confirmed">Bevestigd ({confirmed.length})</TabsTrigger>
          <TabsTrigger value="completed">Afgerond ({completed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
          {matches.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarCheck className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-4 text-slate-500">Nog geen matches gevonden</p>
                <p className="text-sm text-slate-400">
                  {profile.role === 'entrepreneur'
                    ? 'Je wordt automatisch gematcht zodra er een studentengroep beschikbaar is.'
                    : profile.role === 'student'
                    ? 'Zorg dat je groepsbeschikbaarheid is ingevuld om matches te ontvangen.'
                    : 'Gebruik het beheerpaneel om matches te starten.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {matches.map((match) => (
                <MatchCard key={match.id} match={match} userRole={profile.role} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {pending.map((match) => (
              <MatchCard key={match.id} match={match} userRole={profile.role} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="confirmed" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {confirmed.map((match) => (
              <MatchCard key={match.id} match={match} userRole={profile.role} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {completed.map((match) => (
              <MatchCard key={match.id} match={match} userRole={profile.role} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

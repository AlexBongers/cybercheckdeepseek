import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MatchCard } from '@/components/match-card'
import { CalendarCheck, Clock, Users, Building2 } from 'lucide-react'
import { getSessionUserId } from '@/lib/session'
import { getMatchDetails, getProfileById, listGroupsForMember, listMatchesForEntrepreneur, listMatchesForGroups } from '@/lib/db'
import type { Match, Profile, StudentGroup } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const userId = await getSessionUserId()

  if (!userId) redirect('/login')

  const profile = await getProfileById(userId)

  if (!profile) {
    redirect('/login')
  }

  let matches: Array<Match & {
    entrepreneur?: Profile | null
    student_group?: StudentGroup | null
  }> = []

  if (profile.role === 'entrepreneur') {
    matches = await Promise.all((await listMatchesForEntrepreneur(userId)).map(getMatchDetails))
  } else if (profile.role === 'student') {
    const groupIds = (await listGroupsForMember(userId)).map((group) => group.id)
    matches = await Promise.all((await listMatchesForGroups(groupIds)).map(getMatchDetails))
  }

  const pending = matches.filter((m) => m.status === 'pending')
  const confirmed = matches.filter((m) => m.status === 'confirmed')
  const completed = matches.filter((m) => m.status === 'completed')

  return (
    <div className="space-y-6">
      <div className="border-l-4 border-[#c8102e] bg-white px-5 py-4 shadow-sm">
        <p className="text-xs font-extrabold uppercase text-[#c8102e]">HU Cybercheck</p>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-950">
          Welkom, {profile.full_name}
        </h1>
        <p className="text-slate-600 mt-1">
          {profile.role === 'entrepreneur' && 'Beheer je interviews en volg de status van je matches.'}
          {profile.role === 'student' && 'Bekijk jullie aankomende interviews en match details.'}
          {profile.role === 'admin' && 'Je bent ingelogd als beheerder. Gebruik het zijmenu om naar het beheerpaneel te gaan.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="border-t-4 border-t-[#c8102e]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-extrabold uppercase text-slate-500">Aankomend</CardTitle>
            <CalendarCheck className="h-4 w-4 text-[#c8102e]" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold">{pending.length + confirmed.length}</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-[#ffd100]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-extrabold uppercase text-slate-500">Afgerond</CardTitle>
            <Clock className="h-4 w-4 text-slate-950" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold">{completed.length}</p>
          </CardContent>
        </Card>
        <Card className="border-t-4 border-t-slate-950">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-extrabold uppercase text-slate-500">Rol</CardTitle>
            {profile.role === 'entrepreneur' ? (
              <Building2 className="h-4 w-4 text-slate-600" />
            ) : (
              <Users className="h-4 w-4 text-slate-600" />
            )}
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold capitalize">{profile.role === 'admin' ? 'Beheerder' : profile.role}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Alle ({matches.length})</TabsTrigger>
          <TabsTrigger value="pending">Voorlopig ({pending.length})</TabsTrigger>
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
                    ? 'De beheerder koppelt je aan een studentengroep zodra er een passende beschikbaarheid is.'
                    : profile.role === 'student'
                    ? 'Zorg dat jullie groepsbeschikbaarheid is ingevuld; de beheerder maakt daarna de koppeling.'
                    : 'Gebruik het beheerpaneel om studentgroepen en ondernemers te koppelen.'}
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

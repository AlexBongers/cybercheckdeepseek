import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Building2, CheckCircle2, Clock, Link2 } from 'lucide-react'
import type { Profile, StudentGroup, Match, MatchStatus } from '@/types/database'
import { getSessionUserId } from '@/lib/session'
import {
  getMatchDetails,
  getProfileById,
  getStudentGroupMembers,
  listEntrepreneurs,
  listGroupMatchCandidates,
  listMatches,
  listStudentGroups,
} from '@/lib/db'
import { matchGroupToEntrepreneurs, updateMatchStatusFromAdmin } from './actions'

export const dynamic = 'force-dynamic'

const statusCopy: Record<MatchStatus, { label: string; className: string }> = {
  pending: {
    label: 'Voorlopig gekoppeld',
    className: 'bg-[#fff3bf] text-slate-950',
  },
  confirmed: {
    label: 'Bevestigd',
    className: 'bg-[#c8102e] text-white',
  },
  completed: {
    label: 'Afgerond',
    className: 'border-slate-300 bg-white text-slate-700',
  },
  cancelled: {
    label: 'Losgekoppeld',
    className: 'bg-destructive/10 text-destructive',
  },
  rescheduled: {
    label: 'Verplaatst',
    className: 'bg-secondary text-secondary-foreground',
  },
}

function StatusAction({
  matchId,
  status,
  children,
  variant = 'outline',
}: {
  matchId: string
  status: MatchStatus
  children: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive'
}) {
  return (
    <form action={updateMatchStatusFromAdmin}>
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="status" value={status} />
      <Button type="submit" size="xs" variant={variant}>
        {children}
      </Button>
    </form>
  )
}

export default async function AdminPage() {
  const userId = await getSessionUserId()

  if (!userId) redirect('/login')

  const profile = await getProfileById(userId)

  if (profile?.role !== 'admin') redirect('/dashboard')

  const allEntrepreneurs = await listEntrepreneurs() as Profile[]
  const allGroups = await listStudentGroups() as StudentGroup[]
  const allMatches = await Promise.all((await listMatches()).map(getMatchDetails)) as Array<Match & {
    entrepreneur: Profile | null
    student_group: StudentGroup | null
  }>
  const activeMatches = allMatches.filter((match) => match.status !== 'cancelled')
  const groupMatchPanels = (await Promise.all(allGroups.map(async (group) => ({
    group,
    members: await getStudentGroupMembers(group),
    candidates: await listGroupMatchCandidates(group.id),
    currentMatches: activeMatches.filter((match) => match.student_group_id === group.id),
  })))).filter(({ currentMatches }) => currentMatches.length === 0)
  const groupMembers = new Map(await Promise.all(allGroups.map(async (group) => [group.id, await getStudentGroupMembers(group)] as const)))

  const pendingMatches = activeMatches.filter((m) => m.status === 'pending')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-l-4 border-[#c8102e] bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase text-[#c8102e]">HU Cybercheck</p>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-950">Beheeromgeving</h1>
          <p className="text-slate-600 mt-1">Overzicht van alle ondernemers, studentengroepen en matches.</p>
        </div>
        <p className="max-w-md text-sm font-medium text-slate-600">
          Matches worden handmatig gekoppeld op basis van overlappende beschikbaarheid.
        </p>
      </div>

      <div className="border border-slate-200 bg-white shadow-sm">
        <div className="grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center bg-[#c8102e] text-white">
              <Building2 className="size-4" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase text-slate-500">Ondernemers</p>
              <p className="text-2xl font-extrabold text-slate-950">{allEntrepreneurs.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center bg-[#ffd100] text-slate-950">
              <Users className="size-4" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase text-slate-500">Studentengroepen</p>
              <p className="text-2xl font-extrabold text-slate-950">{allGroups.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center bg-slate-950 text-white">
              <CheckCircle2 className="size-4" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase text-slate-500">Matches</p>
              <p className="text-2xl font-extrabold text-slate-950">{activeMatches.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="flex size-9 shrink-0 items-center justify-center bg-[#c8102e] text-white">
              <Clock className="size-4" />
            </span>
            <div>
              <p className="text-xs font-extrabold uppercase text-slate-500">Te bevestigen</p>
              <p className="text-2xl font-extrabold text-slate-950">{pendingMatches.length}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="matches">
        <TabsList>
          <TabsTrigger value="matches">Matches ({activeMatches.length})</TabsTrigger>
          <TabsTrigger value="manual">Handmatig matchen</TabsTrigger>
          <TabsTrigger value="entrepreneurs">Ondernemers ({allEntrepreneurs.length})</TabsTrigger>
          <TabsTrigger value="students">Studentengroepen ({allGroups.length})</TabsTrigger>
        </TabsList>

        {/* Matches tab */}
        <TabsContent value="matches" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ondernemer</TableHead>
                    <TableHead>Studentengroep</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Tijd</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeMatches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                        Nog geen matches. Gebruik &quot;Handmatig matchen&quot; om ondernemers aan studentgroepen te koppelen.
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeMatches.map((match) => (
                      <TableRow key={match.id}>
                        <TableCell className="font-medium">
                          {match.entrepreneur?.company_name || match.entrepreneur?.full_name || 'Onbekend'}
                        </TableCell>
                        <TableCell>{match.student_group?.name || 'Onbekend'}</TableCell>
                        <TableCell>
                          {new Date(match.scheduled_date).toLocaleDateString('nl-NL')}
                        </TableCell>
                        <TableCell>
                          {match.start_time.slice(0, 5)} - {match.end_time.slice(0, 5)}
                        </TableCell>
                        <TableCell>
                          {match.meeting_type === 'online' ? 'Online' : 'Op locatie'}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusCopy[match.status]?.className}>
                            {statusCopy[match.status]?.label ?? match.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap justify-end gap-2">
                            {match.status === 'pending' && (
                              <StatusAction matchId={match.id} status="confirmed">
                                Bevestigen
                              </StatusAction>
                            )}
                            {match.status === 'confirmed' && (
                              <>
                                <StatusAction matchId={match.id} status="completed">
                                  Afronden
                                </StatusAction>
                                <StatusAction matchId={match.id} status="pending" variant="secondary">
                                  Terugzetten
                                </StatusAction>
                              </>
                            )}
                            {match.status === 'completed' && (
                              <StatusAction matchId={match.id} status="confirmed" variant="secondary">
                                Heropenen
                              </StatusAction>
                            )}
                            <StatusAction matchId={match.id} status="cancelled" variant="destructive">
                              Loskoppelen
                            </StatusAction>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="mt-4">
          <div className="space-y-4">
            {groupMatchPanels.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-slate-500">
                  Alle studentgroepen hebben al een actieve match. Gebruik &quot;Loskoppelen&quot; bij Matches als u een groep opnieuw wilt matchen.
                </CardContent>
              </Card>
            ) : (
              groupMatchPanels.map(({ group, members, candidates }) => (
                <Card key={group.id} className="border-slate-950/15">
                  <CardHeader>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-xl font-extrabold">
                          <Users className="size-5 text-[#c8102e]" />
                          {group.name}
                        </CardTitle>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                          {members.length > 0
                            ? members.map((member) => `${member.full_name} (${member.email})`).join(' · ')
                            : 'Geen leden gevonden'}
                        </p>
                      </div>
                      <Badge variant="secondary">Nog te matchen</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {candidates.length === 0 ? (
                      <div className="border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                        Geen nieuwe ondernemers met overlappende beschikbaarheid gevonden.
                      </div>
                    ) : (
                      <form action={matchGroupToEntrepreneurs} className="space-y-4">
                        <input type="hidden" name="groupId" value={group.id} />
                        <p className="text-sm text-slate-600">
                          Het systeem vinkt de beste voorzet alvast aan. U kunt deze accepteren of handmatig een andere ondernemer selecteren.
                        </p>
                        <div className="overflow-x-auto border border-slate-200">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12">Kies</TableHead>
                                <TableHead>Ondernemer</TableHead>
                                <TableHead>Voorstel</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Contact</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {candidates.map((candidate, index) => (
                                <TableRow
                                  key={candidate.entrepreneur_id}
                                  className={index === 0 ? 'bg-[#fff8d8]' : undefined}
                                >
                                  <TableCell>
                                    <input
                                      type="checkbox"
                                      name="entrepreneurIds"
                                      value={candidate.entrepreneur_id}
                                      defaultChecked={index === 0}
                                      className="size-4 accent-[#c8102e]"
                                      aria-label={`${candidate.company_name || candidate.entrepreneur_name} selecteren`}
                                    />
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span>{candidate.company_name || candidate.entrepreneur_name}</span>
                                      {index === 0 && (
                                        <Badge className="bg-[#ffd100] text-slate-950 hover:bg-[#ffd100]">
                                          Systeemvoorstel
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {new Date(candidate.scheduled_date).toLocaleDateString('nl-NL')}{' '}
                                    {candidate.start_time.slice(0, 5)} - {candidate.end_time.slice(0, 5)}
                                  </TableCell>
                                  <TableCell>{candidate.meeting_type === 'online' ? 'Online' : 'Op locatie'}</TableCell>
                                  <TableCell className="text-sm text-slate-600">{candidate.email}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        <Button type="submit">
                          <Link2 className="mr-2 size-4" />
                          Geselecteerde ondernemers koppelen
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Entrepreneurs tab */}
        <TabsContent value="entrepreneurs" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Naam</TableHead>
                    <TableHead>Bedrijf</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefoon</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allEntrepreneurs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                        Nog geen ondernemers geregistreerd.
                      </TableCell>
                    </TableRow>
                  ) : (
                    allEntrepreneurs.map((e) => {
                      const hasMatch = activeMatches.some((m) => m.entrepreneur_id === e.id)
                      return (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium">{e.full_name}</TableCell>
                          <TableCell>{e.company_name || '-'}</TableCell>
                          <TableCell>{e.email}</TableCell>
                          <TableCell>{e.phone || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={hasMatch ? 'default' : 'secondary'}>
                              {hasMatch ? 'Gematcht' : 'Onbematcht'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Student groups tab */}
        <TabsContent value="students" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Groepsnaam</TableHead>
                    <TableHead>Leden</TableHead>
                    <TableHead>Uitnodigingscode</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allGroups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                        Nog geen studentengroepen geregistreerd.
                      </TableCell>
                    </TableRow>
                  ) : (
                    allGroups.map((g) => {
                      const hasMatch = activeMatches.some((m) => m.student_group_id === g.id)
                      const members = groupMembers.get(g.id) ?? []
                      return (
                        <TableRow key={g.id}>
                          <TableCell className="font-medium">{g.name}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium">{members.length} student{members.length === 1 ? '' : 'en'}</p>
                              <p className="max-w-xl text-xs leading-5 text-slate-500">
                                {members.map((member) => `${member.full_name} (${member.email})`).join(' · ') || '-'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="rounded bg-slate-100 px-2 py-1 text-sm font-mono">
                              {g.invite_code}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant={hasMatch ? 'default' : 'secondary'}>
                              {hasMatch ? 'Gematcht' : 'Onbematcht'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

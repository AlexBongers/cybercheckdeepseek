import { createClient, createServiceClient } from '@/lib/supabase/server'
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
import { runMatchingEngine } from '@/lib/match-engine'
import { Users, Building2, Zap, CheckCircle2, Clock } from 'lucide-react'
import type { Profile, StudentGroup, Match } from '@/types/database'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const serviceClient = await createServiceClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') redirect('/dashboard')

  // Fetch all data
  const { data: entrepreneurs } = await serviceClient
    .from('profiles')
    .select()
    .eq('role', 'entrepreneur')
    .order('created_at', { ascending: false })

  const { data: studentGroups } = await serviceClient
    .from('student_groups')
    .select()
    .order('created_at', { ascending: false })

  const { data: matches } = await serviceClient
    .from('matches')
    .select('*, entrepreneur:entrepreneur_id(full_name, company_name), student_group:student_group_id(name)')
    .order('created_at', { ascending: false })

  const allEntrepreneurs = (entrepreneurs || []) as Profile[]
  const allGroups = (studentGroups || []) as StudentGroup[]
  const allMatches = (matches || []) as Array<Match & {
    entrepreneur: Profile | null
    student_group: StudentGroup | null
  }>

  const pendingMatches = allMatches.filter((m) => m.status === 'pending')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Overzicht van alle ondernemers, studentengroepen en matches.</p>
        </div>
        <form
          action={async () => {
            'use server'
            await runMatchingEngine()
          }}
        >
          <Button type="submit">
            <Zap className="mr-2 h-4 w-4" /> Matching starten
          </Button>
        </form>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Ondernemers</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{allEntrepreneurs.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Studentengroepen</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{allGroups.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Matches</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-violet-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{allMatches.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">In afwachting</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingMatches.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="matches">
        <TabsList>
          <TabsTrigger value="matches">Matches ({allMatches.length})</TabsTrigger>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allMatches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                        Nog geen matches. Klik op &quot;Matching starten&quot; om de engine te draaien.
                      </TableCell>
                    </TableRow>
                  ) : (
                    allMatches.map((match) => (
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
                          <Badge
                            variant={
                              match.status === 'confirmed'
                                ? 'default'
                                : match.status === 'pending'
                                ? 'secondary'
                                : match.status === 'completed'
                                ? 'outline'
                                : 'destructive'
                            }
                          >
                            {match.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
                      const hasMatch = allMatches.some(
                        (m) => m.entrepreneur_id === e.id && m.status !== 'cancelled'
                      )
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
                      const hasMatch = allMatches.some(
                        (m) => m.student_group_id === g.id && m.status !== 'cancelled'
                      )
                      return (
                        <TableRow key={g.id}>
                          <TableCell className="font-medium">{g.name}</TableCell>
                          <TableCell>{g.member_ids.length} / 3</TableCell>
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

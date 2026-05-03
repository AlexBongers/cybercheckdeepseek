import type { Match, Profile, StudentGroup } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, Video, Building2 } from 'lucide-react'

interface MatchCardProps {
  match: Match & {
    entrepreneur?: Profile | null
    student_group?: StudentGroup | null
  }
  userRole: string
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  confirmed: 'default',
  completed: 'outline',
  cancelled: 'destructive',
  rescheduled: 'secondary',
}

const statusLabel: Record<string, string> = {
  pending: 'In afwachting',
  confirmed: 'Bevestigd',
  completed: 'Afgerond',
  cancelled: 'Geannuleerd',
  rescheduled: 'Verplaatst',
}

export function MatchCard({ match, userRole }: MatchCardProps) {
  const date = new Date(match.scheduled_date).toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const otherParty =
    userRole === 'entrepreneur'
      ? match.student_group?.name
      : match.entrepreneur?.company_name || match.entrepreneur?.full_name

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">
            {userRole === 'entrepreneur' ? 'Interview met ' : 'Interview met '}
            {otherParty || 'Onbekend'}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            <span>{date}</span>
          </div>
        </div>
        <Badge variant={statusVariant[match.status] || 'default'}>
          {statusLabel[match.status] || match.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>
              {match.start_time.slice(0, 5)} - {match.end_time.slice(0, 5)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {match.meeting_type === 'online' ? (
              <>
                <Video className="h-3.5 w-3.5 text-slate-400" />
                <span>Online (Teams)</span>
              </>
            ) : (
              <>
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>Op locatie</span>
              </>
            )}
          </div>
          {userRole === 'student' && match.entrepreneur && (
            <div className="col-span-2 flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              <span>{match.entrepreneur.company_name || match.entrepreneur.full_name}</span>
            </div>
          )}
          {match.meeting_link && (
            <div className="col-span-2 mt-2">
              <a
                href={match.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                Open Teams vergadering →
              </a>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

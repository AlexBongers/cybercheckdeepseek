export type UserRole = 'entrepreneur' | 'student' | 'admin'
export type OwnerType = 'entrepreneur' | 'student_group'
export type MeetingType = 'onsite' | 'online'
export type MatchStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled'
export type NotificationType = 'match_found' | 'reminder' | 'cancellation'

export interface Profile {
  id: string
  role: UserRole
  full_name: string
  email: string
  company_name?: string
  phone?: string
  address?: string
  created_at: string
}

export interface StudentGroup {
  id: string
  name: string
  member_ids: string[]
  invite_code: string
  created_at: string
}

export interface AvailabilitySlot {
  id: string
  owner_type: OwnerType
  owner_id: string
  day_of_week: number
  date_override?: string
  start_time: string
  end_time: string
  meeting_type?: MeetingType
  recurring: boolean
  created_at: string
}

export interface Match {
  id: string
  entrepreneur_id: string
  student_group_id: string
  scheduled_date: string
  start_time: string
  end_time: string
  meeting_type: MeetingType
  meeting_link?: string
  status: MatchStatus
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  match_id?: string
  type: NotificationType
  email_sent: boolean
  created_at: string
}

export interface MatchWithDetails extends Match {
  entrepreneur: Profile
  student_group: StudentGroup
}

export interface NewAvailabilitySlot {
  day_of_week: number
  date_override?: string
  start_time: string
  end_time: string
  meeting_type?: MeetingType
  recurring: boolean
}

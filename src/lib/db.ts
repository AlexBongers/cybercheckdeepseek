import { env } from 'cloudflare:workers'
import { randomUUID } from 'crypto'
import type { AvailabilitySlot, Match, MatchStatus, MeetingType, Profile, StudentGroup, UserRole } from '@/types/database'

type Row = Record<string, unknown>

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('entrepreneur', 'student', 'admin')),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    company_name TEXT,
    phone TEXT,
    address TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS student_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    member_ids TEXT NOT NULL DEFAULT '[]',
    invite_code TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS availability_slots (
    id TEXT PRIMARY KEY,
    owner_type TEXT NOT NULL CHECK (owner_type IN ('entrepreneur', 'student_group')),
    owner_id TEXT NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    date_override TEXT,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    meeting_type TEXT CHECK (meeting_type IN ('onsite', 'online') OR meeting_type IS NULL),
    recurring INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_time > start_time)
  )`,
  `CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    entrepreneur_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    student_group_id TEXT NOT NULL REFERENCES student_groups(id) ON DELETE CASCADE,
    scheduled_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    meeting_type TEXT NOT NULL CHECK (meeting_type IN ('onsite', 'online')),
    meeting_link TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_time > start_time)
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    match_id TEXT REFERENCES matches(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    email_sent INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  'CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email)',
  'CREATE INDEX IF NOT EXISTS idx_matches_entrepreneur ON matches(entrepreneur_id, status)',
  'CREATE INDEX IF NOT EXISTS idx_matches_group ON matches(student_group_id, status)',
  'CREATE INDEX IF NOT EXISTS idx_availability_owner ON availability_slots(owner_type, owner_id)',
]

let schemaReady: Promise<void> | null = null

async function getDb(): Promise<D1Database> {
  if (!env.DB) throw new Error('De productie-database is nog niet gekoppeld.')
  if (!schemaReady) {
    schemaReady = env.DB.batch(schemaStatements.map((statement) => env.DB.prepare(statement))).then(async () => {
      if (env.ADMIN_EMAIL && env.ADMIN_PASSWORD) {
        const email = String(env.ADMIN_EMAIL).toLowerCase()
        await env.DB.prepare(
          `INSERT INTO profiles (id, role, full_name, email, password_hash)
           SELECT ?, 'admin', 'Beheerder', ?, ?
           WHERE NOT EXISTS (SELECT 1 FROM profiles WHERE email = ?)`,
        ).bind(randomUUID(), email, await hashPassword(String(env.ADMIN_PASSWORD)), email).run()
      }
    })
  }
  await schemaReady
  return env.DB
}

async function all<T extends Row>(sql: string, ...params: unknown[]) {
  const db = await getDb()
  const result = await db.prepare(sql).bind(...params).all<T>()
  return result.results
}

async function first<T extends Row>(sql: string, ...params: unknown[]) {
  const db = await getDb()
  return db.prepare(sql).bind(...params).first<T>()
}

async function run(sql: string, ...params: unknown[]) {
  const db = await getDb()
  return db.prepare(sql).bind(...params).run()
}

async function hashPassword(password: string) {
  const bytes = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) return value as string[]
  if (typeof value !== 'string') return []
  try {
    return JSON.parse(value) as string[]
  } catch {
    return []
  }
}

function profileFromRow(row: Row): Profile {
  return {
    id: String(row.id),
    role: row.role as UserRole,
    full_name: String(row.full_name),
    email: String(row.email),
    company_name: row.company_name ? String(row.company_name) : undefined,
    phone: row.phone ? String(row.phone) : undefined,
    address: row.address ? String(row.address) : undefined,
    created_at: String(row.created_at),
  }
}

function groupFromRow(row: Row): StudentGroup {
  return {
    id: String(row.id),
    name: String(row.name),
    member_ids: parseJsonArray(row.member_ids),
    invite_code: String(row.invite_code),
    created_at: String(row.created_at),
  }
}

function matchFromRow(row: Row): Match {
  return {
    id: String(row.id),
    entrepreneur_id: String(row.entrepreneur_id),
    student_group_id: String(row.student_group_id),
    scheduled_date: String(row.scheduled_date),
    start_time: String(row.start_time),
    end_time: String(row.end_time),
    meeting_type: row.meeting_type as MeetingType,
    meeting_link: row.meeting_link ? String(row.meeting_link) : undefined,
    status: row.status as MatchStatus,
    created_at: String(row.created_at),
  }
}

export async function createProfile(input: {
  role: UserRole
  full_name: string
  email: string
  password: string
  company_name?: string
  phone?: string
  address?: string
}) {
  const id = randomUUID()
  await run(
    `INSERT INTO profiles (id, role, full_name, email, password_hash, company_name, phone, address)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.role,
    input.full_name,
    input.email.toLowerCase(),
    await hashPassword(input.password),
    input.company_name ?? null,
    input.phone ?? null,
    input.address ?? null,
  )
  return getProfileById(id)
}

export async function getOrCreateStudentProfile(input: { firstName: string; lastName: string; email: string }) {
  const fullName = `${input.firstName.trim()} ${input.lastName.trim()}`.trim()
  const existing = await getProfileByEmail(input.email)
  if (existing) {
    if (existing.role !== 'student') throw new Error(`${input.email} is al geregistreerd als ${existing.role}.`)
    return existing
  }
  return createProfile({ role: 'student', full_name: fullName, email: input.email, password: randomUUID() })
}

export async function upsertProfile(input: {
  id?: string
  role: UserRole
  full_name: string
  email: string
  password: string
  company_name?: string
  phone?: string
  address?: string
}) {
  await run(
    `INSERT INTO profiles (id, role, full_name, email, password_hash, company_name, phone, address)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET role = excluded.role, full_name = excluded.full_name,
       password_hash = excluded.password_hash, company_name = excluded.company_name,
       phone = excluded.phone, address = excluded.address`,
    input.id ?? randomUUID(),
    input.role,
    input.full_name,
    input.email.toLowerCase(),
    await hashPassword(input.password),
    input.company_name ?? null,
    input.phone ?? null,
    input.address ?? null,
  )
  return getProfileByEmail(input.email)
}

export async function verifyLogin(email: string, password: string) {
  const row = await first<Row>('SELECT * FROM profiles WHERE email = ? AND password_hash = ?', email.toLowerCase(), await hashPassword(password))
  return row ? profileFromRow(row) : null
}

export async function getProfileById(id: string) {
  const row = await first<Row>('SELECT * FROM profiles WHERE id = ?', id)
  return row ? profileFromRow(row) : null
}

export async function getProfileByEmail(email: string) {
  const row = await first<Row>('SELECT * FROM profiles WHERE email = ?', email.toLowerCase())
  return row ? profileFromRow(row) : null
}

export async function listEntrepreneurs() {
  const rows = await all<Row>(`SELECT * FROM profiles WHERE role = 'entrepreneur' ORDER BY created_at DESC`)
  return rows.map(profileFromRow)
}

export async function createStudentGroup(name: string, memberIds: string[], inviteCode?: string) {
  const id = randomUUID()
  const code = inviteCode ?? randomUUID().slice(0, 6).toUpperCase()
  await run('INSERT INTO student_groups (id, name, member_ids, invite_code) VALUES (?, ?, ?, ?)', id, name, JSON.stringify(memberIds), code)
  return getStudentGroupById(id)
}

export async function upsertStudentGroup(name: string, memberIds: string[], inviteCode: string) {
  await run(
    `INSERT INTO student_groups (id, name, member_ids, invite_code) VALUES (?, ?, ?, ?)
     ON CONFLICT(invite_code) DO UPDATE SET name = excluded.name, member_ids = excluded.member_ids`,
    randomUUID(), name, JSON.stringify(memberIds), inviteCode,
  )
  return getStudentGroupByInvite(inviteCode)
}

export async function getStudentGroupById(id: string) {
  const row = await first<Row>('SELECT * FROM student_groups WHERE id = ?', id)
  return row ? groupFromRow(row) : null
}

export async function getStudentGroupByInvite(inviteCode: string) {
  const row = await first<Row>('SELECT * FROM student_groups WHERE invite_code = ?', inviteCode.trim().toUpperCase())
  return row ? groupFromRow(row) : null
}

export async function listStudentGroups() {
  const rows = await all<Row>('SELECT * FROM student_groups ORDER BY created_at DESC')
  return rows.map(groupFromRow)
}

export async function listGroupsForMember(userId: string) {
  return (await listStudentGroups()).filter((group) => group.member_ids.includes(userId))
}

export async function getStudentGroupMembers(group: StudentGroup) {
  if (group.member_ids.length === 0) return []
  const placeholders = group.member_ids.map(() => '?').join(',')
  const rows = await all<Row>(`SELECT * FROM profiles WHERE id IN (${placeholders}) ORDER BY full_name ASC`, ...group.member_ids)
  return rows.map(profileFromRow)
}

export async function createAvailabilitySlots(slots: Array<Omit<AvailabilitySlot, 'id' | 'created_at'>>) {
  const db = await getDb()
  await db.batch(slots.map((slot) => db.prepare(
    `INSERT INTO availability_slots
      (id, owner_type, owner_id, day_of_week, date_override, start_time, end_time, meeting_type, recurring)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(randomUUID(), slot.owner_type, slot.owner_id, slot.day_of_week, slot.date_override ?? null, slot.start_time, slot.end_time, slot.meeting_type ?? null, slot.recurring ? 1 : 0)))
}

export async function deleteAvailabilityForOwners(ownerIds: string[]) {
  if (ownerIds.length === 0) return
  const placeholders = ownerIds.map(() => '?').join(',')
  await run(`DELETE FROM availability_slots WHERE owner_id IN (${placeholders})`, ...ownerIds)
}

export async function listMatches() {
  const rows = await all<Row>('SELECT * FROM matches ORDER BY created_at DESC')
  return rows.map(matchFromRow)
}

export async function listMatchesForEntrepreneur(userId: string) {
  const rows = await all<Row>('SELECT * FROM matches WHERE entrepreneur_id = ? ORDER BY created_at DESC', userId)
  return rows.map(matchFromRow)
}

export async function listMatchesForGroups(groupIds: string[]) {
  if (groupIds.length === 0) return []
  const placeholders = groupIds.map(() => '?').join(',')
  const rows = await all<Row>(`SELECT * FROM matches WHERE student_group_id IN (${placeholders}) ORDER BY created_at DESC`, ...groupIds)
  return rows.map(matchFromRow)
}

export async function createMatch(input: Omit<Match, 'id' | 'created_at'>) {
  const id = randomUUID()
  await run(
    `INSERT INTO matches
      (id, entrepreneur_id, student_group_id, scheduled_date, start_time, end_time, meeting_type, meeting_link, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id, input.entrepreneur_id, input.student_group_id, input.scheduled_date, input.start_time, input.end_time,
    input.meeting_type, input.meeting_link ?? null, input.status,
  )
  return id
}

export async function updateMatchStatus(matchId: string, status: MatchStatus) {
  const result = await run('UPDATE matches SET status = ? WHERE id = ?', status, matchId)
  return result.meta.changes > 0
}

export async function deleteMatchesForEntrepreneurs(entrepreneurIds: string[]) {
  if (entrepreneurIds.length === 0) return
  const placeholders = entrepreneurIds.map(() => '?').join(',')
  await run(`DELETE FROM matches WHERE entrepreneur_id IN (${placeholders})`, ...entrepreneurIds)
}

export async function createNotification(userId: string, matchId: string, type = 'match_found', emailSent = true) {
  await run('INSERT INTO notifications (id, user_id, match_id, type, email_sent) VALUES (?, ?, ?, ?, ?)', randomUUID(), userId, matchId, type, emailSent ? 1 : 0)
}

export async function getMatchDetails(match: Match) {
  return {
    ...match,
    entrepreneur: await getProfileById(match.entrepreneur_id),
    student_group: await getStudentGroupById(match.student_group_id),
  }
}

export async function listGroupMatchCandidates(groupId: string) {
  const rows = await all<{
    entrepreneur_id: string
    entrepreneur_name: string
    company_name: string | null
    email: string
    phone: string | null
    scheduled_date: string
    start_time: string
    end_time: string
    meeting_type: MeetingType
  }>(`
    SELECT p.id AS entrepreneur_id, p.full_name AS entrepreneur_name, p.company_name, p.email, p.phone,
      CASE WHEN CAST(strftime('%w', 'now') AS INTEGER) <= g.day_of_week
        THEN date('now', '+' || (g.day_of_week - CAST(strftime('%w', 'now') AS INTEGER)) || ' days')
        ELSE date('now', '+' || (7 - CAST(strftime('%w', 'now') AS INTEGER) + g.day_of_week) || ' days') END AS scheduled_date,
      CASE WHEN e.start_time > g.start_time THEN e.start_time ELSE g.start_time END AS start_time,
      time(CASE WHEN e.start_time > g.start_time THEN e.start_time ELSE g.start_time END, '+45 minutes') AS end_time,
      e.meeting_type
    FROM availability_slots g
    JOIN availability_slots e ON e.owner_type = 'entrepreneur' AND e.day_of_week = g.day_of_week
    JOIN profiles p ON p.id = e.owner_id AND p.role = 'entrepreneur'
    WHERE g.owner_type = 'student_group' AND g.owner_id = ?
      AND e.start_time <= time(g.end_time, '-45 minutes')
      AND e.end_time >= time(g.start_time, '+45 minutes')
      AND NOT EXISTS (
        SELECT 1 FROM matches m WHERE m.student_group_id = ? AND m.entrepreneur_id = p.id
          AND m.status IN ('pending', 'confirmed')
      )
    ORDER BY scheduled_date ASC, start_time ASC, p.company_name ASC
  `, groupId, groupId)
  const seen = new Set<string>()
  return rows.filter((row) => !seen.has(row.entrepreneur_id) && seen.add(row.entrepreneur_id))
}

export async function createMatchesForGroup(groupId: string, entrepreneurIds: string[]) {
  const requested = new Set(entrepreneurIds)
  const candidates = (await listGroupMatchCandidates(groupId)).filter((candidate) => requested.has(candidate.entrepreneur_id))
  for (const candidate of candidates) {
    await createMatch({
      entrepreneur_id: candidate.entrepreneur_id,
      student_group_id: groupId,
      scheduled_date: candidate.scheduled_date,
      start_time: candidate.start_time,
      end_time: candidate.end_time,
      meeting_type: candidate.meeting_type,
      status: 'pending',
    })
  }
  return candidates.length
}

export async function findOverlappingGroups(entrepreneurId: string) {
  return all<{
    group_id: string
    group_name: string
    scheduled_date: string
    start_time: string
    end_time: string
    meeting_type: MeetingType
    current_match_count: number
  }>(`
    SELECT g.id AS group_id, g.name AS group_name,
      CASE WHEN CAST(strftime('%w', 'now') AS INTEGER) <= a.day_of_week
        THEN date('now', '+' || (a.day_of_week - CAST(strftime('%w', 'now') AS INTEGER)) || ' days')
        ELSE date('now', '+' || (7 - CAST(strftime('%w', 'now') AS INTEGER) + a.day_of_week) || ' days') END AS scheduled_date,
      CASE WHEN e.start_time > a.start_time THEN e.start_time ELSE a.start_time END AS start_time,
      time(CASE WHEN e.start_time > a.start_time THEN e.start_time ELSE a.start_time END, '+45 minutes') AS end_time,
      e.meeting_type, (SELECT COUNT(*) FROM matches m2 WHERE m2.student_group_id = g.id) AS current_match_count
    FROM availability_slots e
    JOIN availability_slots a ON a.owner_type = 'student_group' AND a.day_of_week = e.day_of_week
    JOIN student_groups g ON g.id = a.owner_id
    WHERE e.owner_id = ? AND e.owner_type = 'entrepreneur'
      AND e.start_time <= time(a.end_time, '-45 minutes')
      AND e.end_time >= time(a.start_time, '+45 minutes')
      AND NOT EXISTS (
        SELECT 1 FROM matches m WHERE m.student_group_id = g.id AND m.entrepreneur_id = e.owner_id
          AND m.status IN ('pending', 'confirmed')
      )
    ORDER BY current_match_count ASC
  `, entrepreneurId)
}

export async function listUnmatchedEntrepreneurs() {
  const rows = await all<Row>(`
    SELECT DISTINCT p.* FROM profiles p
    JOIN availability_slots a ON a.owner_id = p.id AND a.owner_type = 'entrepreneur'
    WHERE p.role = 'entrepreneur' AND NOT EXISTS (
      SELECT 1 FROM matches m WHERE m.entrepreneur_id = p.id AND m.status IN ('pending', 'confirmed')
    )
  `)
  return rows.map(profileFromRow)
}

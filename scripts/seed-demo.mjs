import { createHash, randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'

const dataDir = path.join(process.cwd(), 'data')
const dbPath = process.env.SQLITE_DB_PATH || path.join(dataDir, 'cybercheck.db')
const password = process.env.DEMO_PASSWORD
if (!password) {
  throw new Error('Set DEMO_PASSWORD to a temporary local demo password before running the seed script.')
}

mkdirSync(dataDir, { recursive: true })
const db = new Database(dbPath)
db.exec('PRAGMA foreign_keys = ON;')

function hashPassword(value) {
  return createHash('sha256').update(value).digest('hex')
}

db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('entrepreneur', 'student', 'admin')),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    company_name TEXT,
    phone TEXT,
    address TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS student_groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    member_ids TEXT NOT NULL DEFAULT '[]',
    invite_code TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS availability_slots (
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
  );

  CREATE TABLE IF NOT EXISTS matches (
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
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    match_id TEXT REFERENCES matches(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    email_sent INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`)

const profileColumns = db.prepare('PRAGMA table_info(profiles)').all()
if (profileColumns.some((column) => column.name === 'company_kvk')) {
  db.exec('ALTER TABLE profiles DROP COLUMN company_kvk;')
}

function upsertProfile(profile) {
  const existing = db.prepare('SELECT id FROM profiles WHERE email = ?').get(profile.email)
  const id = existing?.id || randomUUID()
  db.prepare(`
    INSERT INTO profiles (id, role, full_name, email, password_hash, company_name, phone, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET
      role = excluded.role,
      full_name = excluded.full_name,
      password_hash = excluded.password_hash,
      company_name = excluded.company_name,
      phone = excluded.phone,
      address = excluded.address
  `).run(
    id,
    profile.role,
    profile.full_name,
    profile.email,
    hashPassword(password),
    profile.company_name ?? null,
    profile.phone ?? null,
    profile.address ?? null
  )
  return db.prepare('SELECT * FROM profiles WHERE email = ?').get(profile.email)
}

function upsertGroup(name, memberIds, inviteCode) {
  const existing = db.prepare('SELECT id FROM student_groups WHERE invite_code = ?').get(inviteCode)
  const id = existing?.id || randomUUID()
  db.prepare(`
    INSERT INTO student_groups (id, name, member_ids, invite_code)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(invite_code) DO UPDATE SET name = excluded.name, member_ids = excluded.member_ids
  `).run(id, name, JSON.stringify(memberIds), inviteCode)
  return db.prepare('SELECT * FROM student_groups WHERE invite_code = ?').get(inviteCode)
}

const users = {
  admin: upsertProfile({ role: 'admin', full_name: 'Alex Coordinator', email: 'admin@cybercheck.test' }),
  entrepreneur1: upsertProfile({ role: 'entrepreneur', full_name: 'Sanne de Boer', email: 'sanne@demo-cybercheck.nl', company_name: 'Jansen IT Solutions', phone: '06-11112222', address: 'Wibautstraat 10, 1091 GM Amsterdam' }),
  entrepreneur2: upsertProfile({ role: 'entrepreneur', full_name: 'David Bakker', email: 'david@demo-cybercheck.nl', company_name: 'Bakker Logistics', phone: '06-22223333', address: 'Havenweg 42, 1013 AR Amsterdam' }),
  entrepreneur3: upsertProfile({ role: 'entrepreneur', full_name: 'Mila Vermeer', email: 'mila@demo-cybercheck.nl', company_name: 'Noord Finance', phone: '06-33334444', address: 'Asterweg 19, 1031 HL Amsterdam' }),
  student1: upsertProfile({ role: 'student', full_name: 'Lisa de Vries', email: 'lisa@demo-cybercheck.nl' }),
  student2: upsertProfile({ role: 'student', full_name: 'Noah Smit', email: 'noah@demo-cybercheck.nl' }),
  student3: upsertProfile({ role: 'student', full_name: 'Amir El Idrissi', email: 'amir@demo-cybercheck.nl' }),
  student4: upsertProfile({ role: 'student', full_name: 'Eva Jansen', email: 'eva@demo-cybercheck.nl' }),
  student5: upsertProfile({ role: 'student', full_name: 'Tom van Dijk', email: 'tom@demo-cybercheck.nl' }),
  student6: upsertProfile({ role: 'student', full_name: 'Sara Meijer', email: 'sara@demo-cybercheck.nl' }),
}

const cyberGroup = upsertGroup('Team CyberSec-1', [users.student1.id, users.student2.id, users.student3.id], 'CYB101')
const auditGroup = upsertGroup('Audit Squad', [users.student4.id, users.student5.id, users.student6.id], 'AUD202')

db.prepare('DELETE FROM matches WHERE entrepreneur_id IN (?, ?, ?)').run(users.entrepreneur1.id, users.entrepreneur2.id, users.entrepreneur3.id)
db.prepare('DELETE FROM availability_slots WHERE owner_id IN (?, ?, ?, ?, ?)').run(users.entrepreneur1.id, users.entrepreneur2.id, users.entrepreneur3.id, cyberGroup.id, auditGroup.id)

const insertSlot = db.prepare(`
  INSERT INTO availability_slots (id, owner_type, owner_id, day_of_week, start_time, end_time, meeting_type, recurring)
  VALUES (?, ?, ?, ?, ?, ?, ?, 1)
`)
for (const slot of [
  ['entrepreneur', users.entrepreneur1.id, 2, '09:00', '12:00', 'online'],
  ['entrepreneur', users.entrepreneur2.id, 3, '13:00', '16:00', 'onsite'],
  ['entrepreneur', users.entrepreneur3.id, 4, '10:00', '12:00', 'online'],
  ['student_group', cyberGroup.id, 2, '10:00', '12:00', null],
  ['student_group', cyberGroup.id, 4, '10:00', '12:00', null],
  ['student_group', auditGroup.id, 3, '14:00', '16:00', null],
]) {
  insertSlot.run(randomUUID(), ...slot)
}

const insertMatch = db.prepare(`
  INSERT INTO matches (id, entrepreneur_id, student_group_id, scheduled_date, start_time, end_time, meeting_type, meeting_link, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
const match1 = randomUUID()
const match2 = randomUUID()
insertMatch.run(match1, users.entrepreneur1.id, cyberGroup.id, '2026-06-02', '10:00', '10:45', 'online', 'https://teams.microsoft.com/l/meetup-join/demo-cybercheck-1', 'pending')
insertMatch.run(match2, users.entrepreneur2.id, auditGroup.id, '2026-06-03', '14:00', '14:45', 'onsite', null, 'confirmed')

const insertNotification = db.prepare('INSERT INTO notifications (id, user_id, match_id, type, email_sent) VALUES (?, ?, ?, ?, 1)')
insertNotification.run(randomUUID(), users.entrepreneur1.id, match1, 'match_found')
insertNotification.run(randomUUID(), users.student1.id, match1, 'match_found')
insertNotification.run(randomUUID(), users.entrepreneur2.id, match2, 'match_found')
insertNotification.run(randomUUID(), users.student4.id, match2, 'match_found')

console.log(`Demo database seeded: ${dbPath}`)
console.log('Demo accounts seeded. The password was supplied through DEMO_PASSWORD and is not printed.')
console.log('Admin: admin@cybercheck.test')
console.log('Entrepreneur: sanne@demo-cybercheck.nl')
console.log('Student: lisa@demo-cybercheck.nl')

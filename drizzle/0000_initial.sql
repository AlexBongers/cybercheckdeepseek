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

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_matches_entrepreneur ON matches(entrepreneur_id, status);
CREATE INDEX IF NOT EXISTS idx_matches_group ON matches(student_group_id, status);
CREATE INDEX IF NOT EXISTS idx_availability_owner ON availability_slots(owner_type, owner_id);

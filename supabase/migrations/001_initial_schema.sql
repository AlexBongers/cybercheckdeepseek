-- Cybercheck Initial Schema
-- Run this in Supabase SQL Editor or via `supabase db push`

-- Enums
CREATE TYPE user_role AS ENUM ('entrepreneur', 'student', 'admin');
CREATE TYPE owner_type AS ENUM ('entrepreneur', 'student_group');
CREATE TYPE meeting_type AS ENUM ('onsite', 'online');
CREATE TYPE match_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'rescheduled');
CREATE TYPE notification_type AS ENUM ('match_found', 'reminder', 'cancellation');

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'student',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_name TEXT,
  company_kvk TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Student groups
CREATE TABLE student_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  member_ids UUID[] NOT NULL DEFAULT '{}',
  invite_code TEXT UNIQUE NOT NULL DEFAULT upper(substring(gen_random_uuid()::text from 1 for 6)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT max_members CHECK (array_length(member_ids, 1) <= 3)
);

-- Availability slots
CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type owner_type NOT NULL,
  owner_id UUID NOT NULL,
  day_of_week INT2 NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  date_override DATE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  meeting_type meeting_type,
  recurring BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_interval CHECK (end_time > start_time)
);

CREATE INDEX idx_availability_owner ON availability_slots(owner_type, owner_id);
CREATE INDEX idx_availability_day ON availability_slots(day_of_week);

-- Matches
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entrepreneur_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_group_id UUID NOT NULL REFERENCES student_groups(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  meeting_type meeting_type NOT NULL,
  meeting_link TEXT,
  status match_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_match_interval CHECK (end_time > start_time)
);

CREATE INDEX idx_matches_entrepreneur ON matches(entrepreneur_id, status);
CREATE INDEX idx_matches_group ON matches(student_group_id, status);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Row Level Security: Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admin can read all profiles"
  ON profiles FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS: Student Groups
ALTER TABLE student_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read groups"
  ON student_groups FOR SELECT
  USING (true);

CREATE POLICY "Students can create groups"
  ON student_groups FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student'
  ));

CREATE POLICY "Group members can update group"
  ON student_groups FOR UPDATE
  USING (auth.uid() = ANY(member_ids));

CREATE POLICY "Admin can manage groups"
  ON student_groups FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS: Availability Slots
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own availability"
  ON availability_slots FOR ALL
  USING (
    (owner_type = 'entrepreneur' AND owner_id = auth.uid())
    OR
    (owner_type = 'student_group' AND EXISTS (
      SELECT 1 FROM student_groups WHERE id = owner_id AND auth.uid() = ANY(member_ids)
    ))
    OR
    (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  );

CREATE POLICY "Anyone can read availability"
  ON availability_slots FOR SELECT
  USING (true);

-- RLS: Matches
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Entrepreneurs can read own matches"
  ON matches FOR SELECT
  USING (entrepreneur_id = auth.uid());

CREATE POLICY "Students can read group matches"
  ON matches FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM student_groups
    WHERE id = matches.student_group_id
    AND auth.uid() = ANY(member_ids)
  ));

CREATE POLICY "Admin can manage matches"
  ON matches FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- RLS: Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Function: Get unmatched entrepreneurs with availability
CREATE OR REPLACE FUNCTION get_unmatched_entrepreneurs()
RETURNS SETOF profiles
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT DISTINCT p.*
  FROM profiles p
  JOIN availability_slots a ON a.owner_id = p.id AND a.owner_type = 'entrepreneur'
  WHERE p.role = 'entrepreneur'
    AND NOT EXISTS (
      SELECT 1 FROM matches m
      WHERE m.entrepreneur_id = p.id
        AND m.status IN ('pending', 'confirmed')
    );
$$;

-- Function: Find overlapping student groups for an entrepreneur
CREATE OR REPLACE FUNCTION find_overlapping_groups(
  p_entrepreneur_id UUID,
  p_min_duration_minutes INT DEFAULT 45
)
RETURNS TABLE(
  group_id UUID,
  group_name TEXT,
  scheduled_date DATE,
  start_time TIME,
  end_time TIME,
  meeting_type meeting_type,
  current_match_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    g.id AS group_id,
    g.name AS group_name,
    COALESCE(a.date_override, CURRENT_DATE + (a.day_of_week - EXTRACT(DOW FROM CURRENT_DATE)::INT)::INT) AS scheduled_date,
    GREATEST(e.start_time, a.start_time) AS start_time,
    GREATEST(e.start_time, a.start_time) + (p_min_duration_minutes || ' minutes')::INTERVAL AS end_time,
    e.meeting_type,
    (SELECT COUNT(*) FROM matches m2 WHERE m2.student_group_id = g.id) AS current_match_count
  FROM availability_slots e
  JOIN availability_slots a ON a.owner_type = 'student_group'
    AND a.day_of_week = e.day_of_week
  JOIN student_groups g ON g.id = a.owner_id
  WHERE e.owner_id = p_entrepreneur_id
    AND e.owner_type = 'entrepreneur'
    AND e.start_time <= a.end_time - (p_min_duration_minutes || ' minutes')::INTERVAL
    AND e.end_time >= a.start_time + (p_min_duration_minutes || ' minutes')::INTERVAL
    AND NOT EXISTS (
      SELECT 1 FROM matches m
      WHERE m.student_group_id = g.id
        AND m.status IN ('pending', 'confirmed')
    )
  ORDER BY (
    SELECT COUNT(*) FROM matches m2 WHERE m2.student_group_id = g.id
  ) ASC;
$$;

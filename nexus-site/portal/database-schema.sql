-- ============================================================
-- NEXUS ROBOTICS INTERNAL PORTAL - DATABASE SCHEMA
-- ============================================================
-- Run this in your Supabase SQL Editor to set up the database
-- for the internal member portal and attendance system.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. DEPARTMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  short_name TEXT NOT NULL UNIQUE
);

-- Insert departments
INSERT INTO departments (id, name, short_name) VALUES
('mech', 'Mechanical', 'MECH'),
('elec', 'Electronics', 'ELEC'),
('prog', 'Programming', 'PROG'),
('auto', 'Automation', 'AUTO'),
('mgmt', 'Management', 'MGMT')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. ROLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  priority INTEGER DEFAULT 0
);

-- Insert roles
INSERT INTO roles (id, name, display_name, priority) VALUES
('admin', 'admin', 'Administrator', 100),
('captain', 'captain', 'Captain', 90),
('vice_captain', 'vice_captain', 'Vice Captain', 80),
('head', 'head', 'Department Head', 70),
('co_head', 'co_head', 'Co-Head', 60),
('treasurer', 'treasurer', 'Treasurer', 50),
('member', 'member', 'Member', 0)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. MEMBERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  pin TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_members_pin ON members(pin);
CREATE INDEX IF NOT EXISTS idx_members_name ON members(name);
CREATE INDEX IF NOT EXISTS idx_members_active ON members(is_active);

-- ============================================================
-- 4. MEMBER DEPARTMENTS JUNCTION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS member_departments (
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  PRIMARY KEY (member_id, department_id)
);

-- ============================================================
-- 5. MEMBER ROLES JUNCTION TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS member_roles (
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (member_id, role_id)
);

-- ============================================================
-- 6. ADMIN USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 7. ATTENDANCE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('IN', 'OUT')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for attendance queries
CREATE INDEX IF NOT EXISTS idx_attendance_member ON attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_member_timestamp ON attendance(member_id, timestamp DESC);

-- ============================================================
-- 8. ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Public can read departments and roles (needed for UI)
CREATE POLICY "Public read departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Public read roles" ON roles FOR SELECT USING (true);

-- Allow all operations on members (for portal functionality)
CREATE POLICY "Allow all on members" ON members FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations on admin_users
CREATE POLICY "Allow all on admin_users" ON admin_users FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations on attendance
CREATE POLICY "Allow all on attendance" ON attendance FOR ALL USING (true) WITH CHECK (true);

-- Allow all operations on junction tables
CREATE POLICY "Allow all on member_departments" ON member_departments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on member_roles" ON member_roles FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 9. DEFAULT ADMIN USER
-- ============================================================
-- WARNING: Change this password after first login!
INSERT INTO admin_users (id, username, password_hash, name)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin',
  'admin123',
  'System Administrator'
)
ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- 10. SAMPLE MEMBER CREATION QUERY
-- ============================================================
-- Use this format to create new members:

/*
-- Create a member
INSERT INTO members (name, email, pin)
VALUES ('John Doe', 'john@example.com', '1234');

-- Get the member ID
SELECT id FROM members WHERE name = 'John Doe';

-- Assign departments (replace MEMBER_ID with actual UUID)
INSERT INTO member_departments (member_id, department_id)
VALUES
  ('MEMBER_ID', 'mech'),
  ('MEMBER_ID', 'elec');

-- Assign role
INSERT INTO member_roles (member_id, role_id)
VALUES ('MEMBER_ID', 'member');
*/

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Verify departments
SELECT 'Departments:' as type, name as item FROM departments;

-- Verify roles
SELECT 'Roles:' as type, display_name as item FROM roles ORDER BY priority DESC;

-- Verify admin user
SELECT 'Admin users:' as type, username as item FROM admin_users;

-- ============================================================
-- SETUP COMPLETE
-- ============================================================
-- The database is now ready for the internal portal.
-- Update your Supabase credentials in the environment configuration.

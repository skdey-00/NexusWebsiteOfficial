-- ===== MAJOR DATABASE RESTRUCTURE =====
-- Supports multiple departments and roles per member

-- 1. Create new departments table
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  short_name TEXT NOT NULL UNIQUE
);

-- 2. Create new roles table
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  priority INTEGER DEFAULT 0  -- Higher priority shown first
);

-- 3. Create junction tables for many-to-many relationships
CREATE TABLE IF NOT EXISTS member_departments (
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  PRIMARY KEY (member_id, department_id)
);

CREATE TABLE IF NOT EXISTS member_roles (
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (member_id, role_id)
);

-- 4. Insert the new departments
INSERT INTO departments (id, name, short_name) VALUES
('mech', 'Mechanical', 'MECH'),
('auto', 'Automation', 'AUTO'),
('embedded', 'Embedded', 'EMBEDDED'),
('elec', 'Electronics', 'ELEC')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert the new roles (including CTO)
INSERT INTO roles (id, name, display_name, priority) VALUES
('cto', 'CTO', 'CTO', 100),
('captain', 'Captain', 'Captain', 90),
('vice_captain', 'Vice Captain', 'Vice Captain', 80),
('head', 'Department Head', 'Dept. Head', 70),
('co_head', 'Co-Head', 'Co-Head', 60),
('treasurer', 'Treasurer', 'Treasurer', 50),
('member', 'Member', 'Member', 0)
ON CONFLICT (id) DO NOTHING;

-- 6. Update members table to remove old department and role columns
-- (We'll migrate data first, then drop old columns)

-- 7. Add new columns to members table if they don't exist
DO $$
BEGIN
  -- Check if we need to migrate existing members
  IF EXISTS (SELECT 1 FROM members LIMIT 1) THEN
  THEN
    -- Migrate existing members to new structure
    INSERT INTO member_departments (member_id, department_id)
    SELECT m.id, d.id
    FROM members m
    CROSS JOIN departments d
    WHERE LOWER(m.department) = LOWER(d.short_name)
    OR LOWER(m.department) = LOWER(d.name)
    ON CONFLICT DO NOTHING;

    -- Migrate roles
    INSERT INTO member_roles (member_id, role_id)
    SELECT m.id, r.id
    FROM members m
    CROSS JOIN roles r
    WHERE LOWER(m.role) = LOWER(r.name)
    OR LOWER(m.role) = LOWER(r.display_name)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Verify the setup
SELECT 'Departments:' as type, name as item FROM departments
UNION ALL
SELECT 'Roles:' as type, display_name as item FROM roles
ORDER BY type, priority DESC;

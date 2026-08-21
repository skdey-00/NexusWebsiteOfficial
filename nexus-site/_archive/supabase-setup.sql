-- Run this in your Supabase SQL Editor: https://mowkmkvejtjwwnhvartz.supabase.co

-- Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_log ENABLE ROW LEVEL SECURITY;

-- Create policies (allow public access for demo - tighten for production)
CREATE POLICY "Allow all access" ON members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON admin_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access" ON scan_log FOR ALL USING (true) WITH CHECK (true);

-- Insert sample admin user (change password later!)
INSERT INTO admin_users (id, username, password_hash, name)
VALUES ('admin-001', 'admin', 'admin1234', 'Admin User')
ON CONFLICT (id) DO NOTHING;

-- You can now add members like this:
-- INSERT INTO members (name, department, pin, role, is_active)
-- VALUES ('Mayank Verma', 'Embedded Coding', '4821', 'head', true);

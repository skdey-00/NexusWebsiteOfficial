-- Run this in your Supabase SQL Editor to ensure proper RLS policies

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all access" ON members;
DROP POLICY IF EXISTS "Allow all access" ON admin_users;
DROP POLICY IF EXISTS "Allow all access" ON scan_log;

-- Create proper RLS policies for public access
CREATE POLICY "Allow public read access" ON members FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON members FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON members FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON admin_users FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON admin_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON admin_users FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON admin_users FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON scan_log FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON scan_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON scan_log FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON scan_log FOR DELETE USING (true);

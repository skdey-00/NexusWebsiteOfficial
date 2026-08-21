# Admin Setup Guide

## Database Schema for Admin System

Run this SQL in your Supabase SQL Editor to set up the admin system:

```sql
-- Create admin users table
CREATE TABLE admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update members table to include photo URL and other details
ALTER TABLE members ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';
ALTER TABLE members ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS year TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS about TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create departments table for reference
CREATE TABLE IF NOT EXISTS departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    short_name TEXT NOT NULL UNIQUE,
    icon_class TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default departments
INSERT INTO departments (name, short_name, icon_class, description) VALUES
    ('Mechanical', 'mechanical', 'fa-wrench', 'Design and fabricate robot structures and mechanisms'),
    ('Electronics', 'electronics', 'fa-bolt', 'Develop electronic systems and PCBs'),
    ('Embedded Coding', 'programming', 'fa-microchip', 'Program the brains behind every robot'),
    ('Image Processing & Matlab', 'image-processing', 'fa-eye', 'Vision systems and MATLAB development'),
    ('Creative & Management', 'management', 'fa-lightbulb', 'Handle sponsorships, PR, and team coordination')
ON CONFLICT (short_name) DO NOTHING;

-- Update RLS policies
CREATE POLICY "Admins can do everything" ON admin_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admins can update members" ON members FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Admins can insert members" ON members FOR INSERT WITH CHECK (true) WITH CHECK (true);
CREATE POLICY "Admins can delete members" ON members FOR DELETE USING (true);
CREATE POLICY "Admins can view departments" ON departments FOR SELECT USING (true);

-- Create default admin user (password: admin123 - CHANGE THIS!)
-- In production, use proper password hashing
INSERT INTO admin_users (username, password_hash, name) VALUES
    ('admin', 'admin123', 'Admin User')
ON CONFLICT (username) DO NOTHING;
```

## Create Storage Bucket for Member Photos

1. Go to **Storage** tab in Supabase Dashboard
2. Click **Create a new bucket**
3. Name it: `member-photos`
4. Make it **public** (so photos can be displayed on website)

```sql
-- Alternatively, create bucket via SQL:
INSERT INTO storage.buckets (id, name, public) VALUES
    ('member-photos', 'member-photos', true)
ON CONFLICT (name) DO NOTHING;

-- Allow public read access
CREATE POLICY "Allow public read" ON storage.objects FOR SELECT USING (true) WITH CHECK (true);
```

## Quick Setup Commands

```bash
# 1. Create the admin user in Supabase
# Go to SQL Editor and run the above SQL

# 2. Create storage bucket for member photos
# Go to Storage → Create new bucket → "member-photos"

# 3. Test admin login
# Username: admin
# Password: admin123

# 4. Access admin dashboard
# Navigate to /admin-dashboard.html after login
```

## Security Notes

⚠️ **IMPORTANT**: The default admin password is `admin123` - change it immediately!

To update admin password:
```sql
UPDATE admin_users SET password_hash = 'your-new-hash' WHERE username = 'admin';
```

For production, implement proper password hashing using bcrypt in Edge Functions.

# QR Attendance System - Setup Guide

Complete setup instructions for the Robocon QR Attendance System using Supabase.

## 📋 Prerequisites

- Node.js and npm installed
- Supabase account (free tier works)
- GitHub account (for deployment)
- Vercel account (for hosting)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Sign up/login with GitHub
   - Click "New Project"
   - Name: `robocon-attendance`
   - Set a secure database password
   - Choose closest region (Mumbai/Singapore)
   - Wait for provisioning (~2 minutes)

2. **Create Database Tables**

   Go to SQL Editor (left sidebar) and run:

   ```sql
   -- Members table
   CREATE TABLE members (
       id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       name        TEXT NOT NULL,
       department  TEXT NOT NULL,
       pin         TEXT NOT NULL,
       created_at  TIMESTAMPTZ DEFAULT NOW()
   );

   -- Scan log table
   CREATE TABLE scan_log (
       id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
       member_id   UUID REFERENCES members(id) ON DELETE CASCADE,
       scan_type   TEXT NOT NULL CHECK (scan_type IN ('entry', 'exit')),
       scanned_at  TIMESTAMPTZ DEFAULT NOW()
   );

   -- Index for fast lookups
   CREATE INDEX idx_scan_member_time ON scan_log(member_id, scanned_at DESC);

   -- Enable Row Level Security
   ALTER TABLE members ENABLE ROW LEVEL SECURITY;
   ALTER TABLE scan_log ENABLE ROW LEVEL SECURITY;

   -- Allow operations via anon key
   CREATE POLICY "Allow all on members" ON members FOR ALL USING (true) WITH CHECK (true);
   CREATE POLICY "Allow all on scan_log" ON scan_log FOR ALL USING (true) WITH CHECK (true);
   ```

3. **Add Team Members**

   ```sql
   INSERT INTO members (name, department, pin) VALUES
       ('Mayank Verma',    'Embedded Coding', '4821'),
       ('Aryan Nair',      'Mechanical',      '7395'),
       ('Rutambhar Gada',  'Mechanical',      '1258'),
       ('Shubham Mehta',   'Mechanical',      '9034'),
       ('Daksh Mishra',    'Embedded Coding', '5612'),
       ('Sanmeet Dey',     'Mechanical',      '3347'),
       ('Tashi Shrivastava','IP & MATLAB',    '8821'),
       ('Rohini Vemula',   'IP & MATLAB',     '3456'),
       ('Avani Mantri',    'IP & MATLAB',     '7890'),
       ('Avika Bhagwat',   'IP & MATLAB',     '2345');
   ```

4. **Get API Credentials**

   - Go to Settings (gear icon) → API
   - Copy **Project URL** and **anon public** key
   - You'll use these in the next step

### 3. Configure Environment Variables

Create `.env.local` file in the project root:

```bash
# Copy from .env.example
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run Development Server

```bash
npm run dev
```

The attendance system will be available at:
- Portal: http://localhost:5173/portal.html
- Scan: http://localhost:5173/scan-new.html
- Dashboard: http://localhost:5173/dashboard-new.html

## 📱 Usage Flow

### First Time (One-Time Setup)

1. **Member Login**
   - Open portal.html on their phone
   - Enter their name
   - Enter their 4-digit PIN
   - Browser remembers them (localStorage)

### Daily Usage

1. **Entry Scan**
   - Member points phone camera at QR code
   - Opens scan.html
   - Shows green "ENTRY" confirmation
   - Close tab, walk into lab

2. **Exit Scan**
   - Same QR code
   - Shows orange "EXIT" confirmation
   - Session duration displayed
   - Close tab, leave lab

### Admin Dashboard

1. **View Current Members**
   - Open dashboard.html
   - See "Currently In Lab" section
   - Auto-refreshes every 30 seconds

2. **View Activity Log**
   - Filter by Today/This Week/All
   - Export to CSV for reports

## 🌐 Deployment

### Deploy to Vercel

1. **Push to GitHub**

   ```bash
   git add .
   git commit -m "Add QR attendance system"
   git push origin master
   ```

2. **Connect to Vercel**

   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repo
   - Configure:

3. **Add Environment Variables**

   In Vercel project settings, add:

   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key

4. **Deploy**

   - Vercel auto-deploys on push
   - Your attendance URL: `https://your-site.vercel.app/portal.html`

### Generate QR Code

After deployment, create and print the QR code:

**Option 1: Online Generator**
1. Go to https://www.qrcode-monkey.com/
2. Enter: `https://your-site.vercel.app/scan-new.html`
3. Download and print (min 8x8 cm)

**Option 2: Python Script**
```bash
pip install qrcode
python -c "
import qrcode
qr = qrcode.QRCode(version=1, box_size=10, border=4)
qr.add_data('https://your-site.vercel.app/scan-new.html')
qr.make(fit=True)
qr.make_image(fill_color='black', back_color='white').save('lab-qr.png')
"
```

## 📁 File Structure

```
Robocon Site/
├── portal.html          ← PIN-based member login
├── scan-new.html         ← Auto entry/exit toggle
├── dashboard-new.html    ← Attendance viewer
├── src/
│   ├── lib/
│   │   └── supabase-client.ts   ← Supabase API client
│   ├── portal.ts         ← Login logic
│   ├── scan-new.ts       ← Toggle logic
│   └── dashboard-new.ts  ← Dashboard logic
├── .env.example          ← Environment variables template
└── .env.local            ← Your actual credentials (gitignore)
```

## 🔧 Troubleshooting

### "Supabase not configured" error
- Check your `.env.local` file exists and has valid credentials
- Restart development server after adding credentials

### "Invalid name or PIN" error
- Check member exists in Supabase `members` table
- Verify PIN matches exactly (4 digits)
- Name matching is case-insensitive but must be similar

### QR code not working
- Ensure QR code points to `scan-new.html` (not `scan.html`)
- Check deployed URL is correct
- Test URL in browser first

### Dashboard shows no data
- Check Supabase connection is working
- Verify `scan_log` table has data
- Check browser console for errors

## 🔒 Security Notes

- PIN-based authentication is suitable for lab attendance
- For production, consider:
  - Adding rate limiting
  - Using Supabase Auth with proper passwords
  - Adding admin authentication for dashboard
  - HTTPS enforcement (automatic on Vercel)

## 📊 Database Management

### View/Edit Data Directly

1. Go to Supabase Dashboard
2. Select your project
3. Use "Table Editor" to view members and scan logs

### Reset Member Data

```sql
-- Clear all scan logs
DELETE FROM scan_log;

-- Reset members (keep table structure)
DELETE FROM members WHERE id IN (
    SELECT id FROM members WHERE name = 'Specific Member'
);
```

## 🎯 Next Steps

1. **Print and Install QR Code**
   - Print at least 8x8 cm
   - Laminate for durability
   - Place at lab entrance

2. **Test with Members**
   - Have each member log in once
   - Test entry/exit flow
   - Verify dashboard shows real-time data

3. **Set Up Monitoring**
   - Check dashboard regularly
   - Export weekly/monthly reports
   - Monitor for any issues

## 🆘 Support

For issues or questions:
- Check browser console for errors
- Verify Supabase credentials
- Check Supabase dashboard logs
- Review this guide's troubleshooting section

---

**Total Cost:** Free (Supabase free tier + Vercel free tier)

**Member Experience:** 3 seconds per scan (point, tap, confirm)

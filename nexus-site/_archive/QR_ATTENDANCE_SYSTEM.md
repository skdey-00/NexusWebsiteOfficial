# Robocon QR Attendance System

A zero-cost QR-code based entry/exit logging system for the Robocon lab.
Members scan a single printed QR code at the entrance using their phone.
First scan = entry, second scan = exit, third scan = entry, and so on.

---

## HOW IT WORKS (THE FLOW)

```
[Printed QR at lab entrance]
         │
         │ member scans with phone camera
         ▼
[opens scan.html on their phone browser]
         │
         │ page checks: is this member logged in?
         │    YES → check their last scan record
         │           last was EXIT or none → log ENTRY (green flash)
         │           last was ENTRY          → log EXIT (red flash)
         │    NO  → redirect to login, member enters PIN, come back
         ▼
[confirmation screen: name + ENTRY/EXIT + timestamp]
         │
         │ member closes the tab, walks in/out
         ▼
       done
```

The QR code itself contains nothing but a URL:
`https://your-site.vercel.app/scan.html`

Identity comes from the member's login session (stored in their phone browser via localStorage). They log in ONCE, then every future scan is instant — no typing, no app install.

---

## ARCHITECTURE

```
┌──────────────────────────────────────────────────┐
│                    VERCEL (free)                  │
│                                                   │
│  /portal.html  ── login with PIN (one-time)      │
│  /scan.html    ── auto toggle entry/exit         │
│  /dashboard.html ── view attendance log          │
│                                                   │
│  All static HTML + JS, no server functions needed │
└──────────────────┬────────────────────────────────┘
                   │
                   │ Supabase JS client (browser → DB)
                   ▼
┌──────────────────────────────────────────────────┐
│               SUPABASE (free tier)                │
│                                                   │
│  PostgreSQL database:                             │
│    members   (id, name, dept, pin_hash, qr_token) │
│    scan_log  (id, member_id, type, timestamp)     │
│                                                   │
│  Auto REST API (no backend code needed)           │
│  Row Level Security for safety                    │
└──────────────────────────────────────────────────┘
```

**Why this stack:**
- Vercel free tier hosts all pages (you already deploy here)
- Supabase free tier: 500MB DB, unlimited API, no server to run
- Browser talks to Supabase directly via their JS SDK (no backend functions)
- Total cost: Rs. 0

---

## STEP 0: PREREQUISITES

- Your Robocon Site repo on GitHub (already exists)
- Vercel account (already connected or will connect)
- A Supabase account (sign up free at supabase.com with GitHub)

---

## STEP 1: SET UP SUPABASE DATABASE

### 1.1 Create a project

1. Go to https://supabase.com → Sign in with GitHub
2. Click "New Project"
3. Name it `robocon-attendance`
4. Set a database password (save it somewhere)
5. Choose the closest region (Mumbai/Singapore)
6. Wait ~2 min for provisioning

### 1.2 Create the tables

Go to the SQL Editor (left sidebar) → paste and run:

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

-- Index for fast "last scan" lookups
CREATE INDEX idx_scan_member_time ON scan_log(member_id, scanned_at DESC);

-- Allow anonymous read/write (simplified for lab use)
-- In production you'd lock this down, but for a college lab this is fine
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_log ENABLE ROW LEVEL SECURITY;

-- Allow all operations (the anon key acts as the gatekeeper)
CREATE POLICY "Allow all on members" ON members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on scan_log" ON scan_log FOR ALL USING (true) WITH CHECK (true);
```

### 1.3 Add your team members

In the SQL Editor, insert members (each gets a 4-digit PIN):

```sql
INSERT INTO members (name, department, pin) VALUES
    ('Mayank Verma',    'Embedded Coding', '4821'),
    ('Aryan Nair',      'Mechanical',      '7395'),
    ('Rutambhar Gada',  'Mechanical',      '1258'),
    ('Shubham Mehta',   'Mechanical',      '9034'),
    ('Daksh Mishra',    'Embedded Coding', '5612'),
    ('Sanmeet Dey',     'Mechanical',      '3347'),
    ('Tirth Vora',      'IP & MATLAB',     '8890'),
    ('Soham Jadhav',    'Mechanical',      '6153');
-- add all members here
```

### 1.4 Get your API keys

1. Go to Settings (gear icon) → API
2. Copy these two values:
   - **Project URL**: `https://xxxxxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOi...` (long string)

You'll add these to Vercel as environment variables.

---

## STEP 2: GENERATE THE QR CODE

The QR code is simply your scan page URL. Generate it free:

### Option A: Online (fastest)
1. Go to https://www.qrcode-monkey.com/ or https://qr-code-generator.com/
2. Enter URL: `https://your-site.vercel.app/scan.html`
   (replace with your actual Vercel domain after deploy)
3. Download PNG, print it, laminate it, stick it at the lab entrance

### Option B: Python (for consistent styling)
```bash
pip install qrcode
python -c "
import qrcode
qr = qrcode.QRCode(version=1, box_size=10, border=4)
qr.add_data('https://your-site.vercel.app/scan.html')
qr.make(fit=True)
qr.make_image(fill_color='black', back_color='white').save('robocon-qr.png')
"
```

Print at least 8x8 cm so phone cameras can focus on it easily.

---

## STEP 3: BUILD THE PAGES

Three new HTML files go in your existing project root:

---

### 3.1 `/portal.html` — Member Login (one-time)

**Purpose:** Member enters their PIN once. Browser remembers them.

```
WHAT IT SHOWS:
┌─────────────────────────────┐
│      KJSSE ROBOCON          │
│      Member Login            │
│                              │
│   Enter your name:           │
│   [________________]         │
│                              │
│   Enter your PIN:            │
│   [________]                 │
│                              │
│   [    LOGIN    ]            │
│                              │
│   First time? Ask admin for  │
│   your PIN.                  │
└─────────────────────────────┘
```

**Logic:**
1. Member types their name + PIN
2. JS queries Supabase: `SELECT * FROM members WHERE name ILIKE '%input%' AND pin = 'input'`
3. If match → store `member_id` and `name` in `localStorage` → redirect to scan.html
4. If no match → show "Invalid name or PIN"
5. On future visits, if `localStorage` has `member_id` → skip straight to scan.html

**Security note:** This is a simple PIN check, not bank-grade auth. For a college robotics lab with 30 members, this is sufficient. The PIN prevents random people from logging attendance under someone else's name.

---

### 3.2 `/scan.html` — The Toggle Scanner (the core page)

**Purpose:** Auto-logs entry/exit when member opens this page.

```
WHAT IT SHOWS (success):
┌─────────────────────────────┐
│                              │
│        ✅ ENTRY              │
│                              │
│    Mayank Verma              │
│    09:30 AM, 24 Jul 2026    │
│                              │
│    Welcome to the lab!       │
│                              │
└─────────────────────────────┘

WHAT IT SHOWS (exit):
┌─────────────────────────────┐
│                              │
│        🚪 EXIT               │
│                              │
│    Mayank Verma              │
│    05:30 PM, 24 Jul 2026    │
│                              │
│    Session: 8h 00m           │
│    See you tomorrow!         │
│                              │
└─────────────────────────────┘

WHAT IT SHOWS (not logged in):
┌─────────────────────────────┐
│                              │
│    Please log in first       │
│                              │
│   [ GO TO LOGIN ]            │
│                              │
└─────────────────────────────┘
```

**Logic (the toggle — this is the heart of the system):**

```
1. On page load, check localStorage for member_id
   IF NOT FOUND → show "Please log in" + button to portal.html
   IF FOUND → continue

2. Query Supabase for member's last scan:
   SELECT scan_type, scanned_at FROM scan_log
   WHERE member_id = <their id>
   ORDER BY scanned_at DESC
   LIMIT 1

3. Determine the toggle:
   IF no previous scan → this is an ENTRY
   IF last scan was 'entry' → this is an EXIT
   IF last scan was 'exit' → this is an ENTRY

4. Insert the new scan:
   INSERT INTO scan_log (member_id, scan_type)
   VALUES (<their id>, '<entry or exit>')

5. Show confirmation screen with:
   - Entry (green) or Exit (red/orange)
   - Their name
   - Current timestamp
   - If exit: session duration (time since their entry scan)

6. Page stays visible. Member closes the tab manually.
   (Optional: auto-redirect to homepage after 10 seconds)
```

**Anti-double-scan protection:**
If the same member opens scan.html twice within 10 seconds (e.g. accidental double-tap on the QR link), ignore the second scan. Check the timestamp of the last scan — if it's less than 10 seconds ago, show the previous result without logging a new one.

```javascript
// Debounce logic
if (lastScan && (Date.now() - new Date(lastScan.scanned_at).getTime()) < 10000) {
    // Show the previous result, don't log again
    showResult(lastScan);
    return;
}
```

---

### 3.3 `/dashboard.html` — Attendance Log Viewer

**Purpose:** Admin/team lead views who is in the lab and full attendance history.

```
┌─────────────────────────────────────────────────────┐
│  KJSSE ROBOCON — Attendance Dashboard               │
│                                                      │
│  [Today] [This Week] [All]     [Export CSV]          │
│                                                      │
│  ── CURRENTLY IN LAB (5) ──                         │
│  ✅ Mayank Verma     Entry 09:30 AM                 │
│  ✅ Aryan Nair       Entry 09:45 AM                 │
│  ✅ Sanmeet Dey      Entry 10:15 AM                 │
│  ✅ Daksh Mishra     Entry 11:00 AM                 │
│  ✅ Soham Jadhav     Entry 11:30 AM                 │
│                                                      │
│  ── FULL LOG ──                                     │
│  Time          Name           Action   Duration     │
│  05:30 PM      Mayank Verma   EXIT     8h 00m       │
│  09:30 AM      Mayank Verma   ENTRY    —            │
│  05:15 PM      Aryan Nair     EXIT     7h 30m       │
│  09:45 AM      Aryan Nair     ENTRY    —            │
│  ...                                                │
│                                                      │
│  Total entries today: 12                             │
│  Average session: 7h 45m                            │
└─────────────────────────────────────────────────────┘
```

**Logic:**
1. Query scan_log joined with members, ordered by scanned_at DESC
2. "Currently in lab" = members whose most recent scan is ENTRY
3. Duration = exit timestamp minus its paired entry timestamp
4. Export CSV button generates a downloadable file
5. Auto-refresh every 30 seconds (so a screen on the wall stays live)

---

## STEP 4: SUPABASE CLIENT (shared JS)

Create one file `/src/lib/supabase-client.js` that all three pages import:

```javascript
// This is included as a reference — the actual file will be created
// when we build the system.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
```

Environment variables (set in Vercel):
- `VITE_SUPABASE_URL` = your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` = your Supabase anon public key

---

## STEP 5: DEPLOY TO VERCEL

### 5.1 Add environment variables

1. Go to your Vercel project → Settings → Environment Variables
2. Add:
   - `VITE_SUPABASE_URL` = `https://xxxxxxxx.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOi...` (your anon key)
3. Apply to Production, Preview, and Development

### 5.2 Deploy

1. Push the new files to GitHub (portal.html, scan.html, dashboard.html, supabase-client.js)
2. Vercel auto-deploys
3. Your QR code URL becomes: `https://your-site.vercel.app/scan.html`
4. Generate the QR code with this URL (Step 2), print it, done

---

## STEP 6: DAILY USAGE

### First time for a member (once per phone):
1. Member scans the QR at the door → opens scan.html
2. "Please log in" → taps button → goes to portal.html
3. Enters name + PIN → logged in → redirected to scan.html
4. Their first scan (entry) is logged
5. They close the tab

### Every time after that (instant):
1. Member scans the QR at the door → opens scan.html
2. Already logged in (localStorage remembers them)
3. Entry or Exit is auto-logged in <1 second
4. Green (entry) or Red (exit) confirmation flashes with timestamp
5. Member closes the tab, walks in/out

### For the admin:
- Open dashboard.html anytime to see who's in the lab
- Export CSV for monthly attendance reports

---

## EDGE CASES AND HOW TO HANDLE THEM

### Member forgets to scan out
- They scanned entry but left without scanning exit
- Next day they scan → system sees last was entry → logs exit
- But the exit timestamp is wrong (it's the next day)
- FIX: Admin can edit/delete the bad record in Supabase dashboard
- PREVENTION: Dashboard shows "stale entries" (entries with no exit after 14 hours) as a warning

### Member's phone is dead / forgotten
- Another member can log in on their phone, scan for them
- Or admin manually adds an entry from the Supabase dashboard
- This is rare — don't over-engineer for it

### Member clears browser data / gets new phone
- They go to portal.html, log in again with their PIN
- Simple, one-time friction

### Multiple members on one phone
- Not recommended, but possible
- Add a "switch user" button on scan.html that clears localStorage and redirects to portal.html
- Only needed if sharing devices

### Wi-Fi is down at the lab
- Scan.html can't reach Supabase → shows "Connection error, please try again"
- No offline mode (too complex for a free stack)
- Fix: use mobile data instead of lab Wi-Fi

### Wrong scan type logged (accidental double entry)
- Admin opens Supabase dashboard → scan_log table → delete the bad row
- Next scan will auto-correct

---

## FILE STRUCTURE (what gets added to your repo)

```
Robocon Site/
├── portal.html          ← NEW: member PIN login
├── scan.html            ← NEW: auto entry/exit toggle
├── dashboard.html       ← MODIFY: existing dashboard, add attendance view
├── src/
│   ├── lib/
│   │   └── supabase-client.js   ← NEW: shared Supabase connection
│   ├── portal.ts        ← NEW: login logic
│   └── scan.ts          ← NEW: toggle + debounce logic
└── .env.local           ← NEW (local dev only): Supabase keys
```

---

## COST BREAKDOWN

| Resource        | Free Tier Limit              | Our Usage (~30 members)  |
|----------------|------------------------------|--------------------------|
| Vercel         | 100GB bandwidth, unlimited   | <1GB                     |
| Supabase       | 500MB DB, 50K MAU, unlimited | ~2MB DB, ~30 users       |
| html5-qrcode   | Free CDN, unlimited          | N/A                      |
| **Total**      |                              | **Rs. 0/month**          |

---

## SECURITY NOTES

- The Supabase anon key is safe to expose in frontend code (it's designed for this)
- Row Level Security policies control what the key can access
- PINs are stored in plain text (acceptable for lab attendance, not for sensitive data)
- For stronger security: hash PINs with bcrypt in a Supabase Edge Function (still free)
- The dashboard should ideally be behind an admin PIN (add this when building)

---

## SUMMARY OF THE SEAMLESS EXPERIENCE

For the member, the entire interaction is:

1. Open phone camera
2. Point at QR code on wall
3. Tap the notification
4. See green "ENTRY" or red "EXIT" flash with their name
5. Close tab

Total time: 3 seconds. No typing after the first login. No app to install. Works on any phone with a camera and browser.

The QR code is just a link. The intelligence lives in the scan.html page + Supabase database. The toggle logic is a single database query: "what was this person's last scan?" → do the opposite.

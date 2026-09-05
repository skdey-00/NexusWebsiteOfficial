# NEXUS Robotics — Team Website

Official website of **NEXUS Robotics**, the robotics team of K J Somaiya School of Engineering, Mumbai (est. 2010). Five divisions, one machine — building for the ABU Robocon arena.

This repository contains the production multi-page site (team info, departments, robots, events, sponsors, contact) plus an **internal member portal** with a PIN-based attendance system backed by Supabase.

---

## Repository Layout

```
.
├── nexus-site/          ← THE MAIN PROJECT — active website (start here)
├── Robocon Site/        ← Legacy site. Lives in its OWN repo
│                           (github.com/skdey-00/RoboconWebsite) and is only
│                           referenced here as a git pointer. On a fresh clone
│                           this folder is EMPTY — that is expected. It is NOT
│                           part of the build. Ignore it unless told otherwise.
├── LICENSE
└── README.md
```

Everything below refers to `nexus-site/`.

---

## Tech Stack

| Layer      | Technology |
|------------|------------|
| Build      | Vite 5, TypeScript (strict) |
| Animation  | GSAP + ScrollTrigger, anime.js |
| Scroll     | Lenis (inertial smooth scrolling, GSAP-ticker driven) |
| 3D         | Three.js (robot viewer, DRACO-compressed GLB models) |
| Backend    | Supabase (PostgreSQL + auth for the internal portal) |
| Images     | sharp (one-off optimization scripts) |

Package manager: **pnpm** (`pnpm-lock.yaml` is the source of truth).

---

## Getting Started

Prerequisites: **Node.js 18+** and **pnpm** (`npm i -g pnpm`).

```bash
cd nexus-site
pnpm install
pnpm dev          # dev server → http://127.0.0.1:5173
```

Other scripts:

```bash
pnpm build        # type-check (tsc) + production build → dist/
pnpm preview      # serve the production build locally
pnpm type-check   # tsc --noEmit only
pnpm run optimize-images   # bulk image optimization (scripts/optimize-images.cjs)
```

> **Windows note:** the dev server intentionally binds `127.0.0.1:5173` with `strictPort: true` (see `vite.config.ts`). If port 5173 is taken the server fails loudly rather than drifting to another port — free the port instead of editing the config blindly.

---

## Environment Variables

Only the **internal portal** needs credentials. The public site builds and runs fine without them (portal features disable themselves with a console warning).

Create `nexus-site/.env.local`:

```ini
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

Both keys are the public (anon) Supabase credentials — they are safe to ship to the browser; security is enforced by RLS policies in the database.

---

## Database (Supabase)

The full schema lives in [`nexus-site/database-complete.sql`](nexus-site/database-complete.sql). Run it once against a fresh Supabase project (SQL Editor). It creates:

- `departments`, `roles` — team structure
- `members`, `member_departments`, `member_roles` — roster and login (name + PIN)
- `admin_users` — portal administrators
- `attendance` — IN/OUT events (the core of the attendance system)

---

## Site Pages

| Page | File | Notes |
|------|------|-------|
| Home | `index.html` | Hero, journey timeline, 3D robot viewer |
| About | `about.html` | Team story and divisions |
| Nexus Now | `nexus-now.html` | Current campaigns — **KYNEX '26** event (Robo Sumo + Line Follower) |
| Robots | `robots.html` | Bot showcase with Three.js viewer |
| Departments | `mechanical.html`, `electronics.html`, `programming.html`, `automation.html`, `management.html` | One per division |
| Team | `team.html` | Current roster (data-driven) |
| Sponsors | `sponsors.html` | Partner logos / tiers |
| Contact | `contact.html` | Form → handled in `src/utils/form-handler.ts` |
| Legacy | `image-processing.html` | Meta-refresh stub → `automation.html` (old URLs keep working) |

All entry points are registered in `vite.config.ts` → `build.rollupOptions.input`. **New page checklist:** create the HTML file, add an input entry, wire its `init` module into `src/main.ts` if it needs scripting.

---

## Internal Portal

| Page | Purpose |
|------|---------|
| `portal/login.html` | Member login (name + PIN) |
| `portal/scan.html` | Attendance kiosk — check IN / OUT |
| `portal/member.html` | Member dashboard (personal attendance history) |
| `portal/admin.html` | Admin dashboard (live sessions, stats, roster, exports) |

Core logic: `src/lib/supabase.ts` (client + all DB queries), `src/lib/portal-auth.ts` (session handling), page controllers in `src/portal-*.ts`.

---

## Where Things Live (content editing)

```
nexus-site/
├── public/               # Static assets served as-is
│   ├── Images/           # Photos
│   ├── models/           # GLB models for the 3D viewer
│   ├── draco/            # DRACO decoder (do not delete)
│   └── KYNEX-26 Material/# Event posters + rulebook PDFs
├── src/
│   ├── data/             # ★ ALL page content lives here (TypeScript)
│   │   ├── team-data.ts          # roster
│   │   ├── journey-data.ts       # timeline milestones
│   │   ├── partners-data.ts      # sponsors
│   │   ├── nexus-now-data.ts     # KYNEX event config (dates, prizes, links)
│   │   ├── system-capabilities.ts
│   │   └── toolchain-data.ts
│   ├── config/navigation.ts      # navbar links (single place to edit menus)
│   ├── components/               # shared navbar / mobile nav
│   ├── animations/               # GSAP modules
│   ├── lib/                      # Supabase + portal helpers
│   └── main.ts                   # shared entry: Lenis, navbar, page inits
├── scripts/              # image optimization + network verify helpers
├── database-complete.sql # full Supabase schema
└── _archive/             # old code kept for reference — NOT part of the build
```

**To update content, edit the files in `src/data/` — do not hand-edit built pages.** After changing images, run `pnpm run optimize-images` to keep payload sizes sane.

---

## Deployment

`pnpm build` produces a fully static `dist/`. Any static host works (Vercel, Netlify, GitHub Pages, nginx). Remember to set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` as build-time environment variables on the host, and make sure the deployed domain is added to Supabase → Auth → URL configuration if you use any auth redirects.

---

## Handover Notes / Gotchas

- **`Robocon Site/` folder is empty after cloning** — it is a git pointer (no `.gitmodules` on purpose). The legacy site's real history is at `github.com/skdey-00/RoboconWebsite`.
- **`_archive/` and `_backup-*/` folders** are historical only; nothing imports from them. Safe to ignore, delete only if storage is a concern.
- The KYNEX '26 event data (dates, prize pool, registration link, rulebook links) is centralized in `src/data/nexus-now-data.ts` plus a few inline strings in `nexus-now.html` — search both when updating the next event.
- QR/attendance duplicate-tap protection: repeated events within 10 s are deduped (`src/lib/supabase.ts`).
- Admin credentials are rows in `admin_users` (hashed). Seed them manually after running the schema; there is no public sign-up by design.

---

## License

See [LICENSE](LICENSE).

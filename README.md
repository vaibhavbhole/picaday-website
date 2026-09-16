# PicADay website

Next.js (App Router) client for **PicADay-Staging**. Design and product rules follow the Flutter app; writes go through Postgres RPCs only.

## Stack

- Next.js + React + Tailwind, deployed on Vercel
- `@supabase/ssr` cookie sessions against PicADay-Staging
- **Reads:** `supabase.from(...).select(...)` under RLS
- **Writes:** `supabase.rpc(...)` plus Storage uploads to `post-media`

Do not put the service-role key in this repo. Schema changes belong in `picaday-db`.

## Setup

1. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or publishable key).
2. `npm install`
3. `npm run dev`

After deploying, add the Vercel URL to Staging Auth redirect URLs:

- `https://<your-domain>/auth/callback`
- `https://<your-domain>/reset-password`

New web RPCs (`update_own_profile`, `create_content_report`) live in `picaday-db` migration `20260910180000_web_profile_and_reports.sql`. Deploy that to Staging before profile edit and report will succeed.

## Data rules

- One post per user per agenda; 1–20 images, 4:5 JPEG
- Vote once per active hourly bucket (`cast_vote`)
- Completed-hour feeds are read-only (posts whose `created_at` falls in that bucket window)
- Username: `^[a-z0-9_]{3,24}$`; login accepts email or username (`email_for_username`)

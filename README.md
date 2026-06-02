# SPACEART

A premium creative marketplace for African art, culture, and creative services — built for South African creatives.

## Tech Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Supabase** — Auth (Google OAuth, Magic Link, Email/Password), PostgreSQL, Storage, RLS
- **TanStack React Query** — client data layer with optimistic updates
- **Tailwind CSS v4** + shadcn/ui + Framer Motion
- **Zod** — runtime validation for server actions

## Environment Variables

Copy `.env.example` to **`.env.local` at the project root** (same folder as `package.json` and `next.config.ts`):

```bash
cp .env.example .env.local
```

> **Important:** Next.js only loads `.env*` files from the app root. A file at `supabase/.env.local` is **not** read by the app — put all `NEXT_PUBLIC_*` variables in the root `.env.local`. After changing env files, restart `npm run dev`.

**Required for Supabase integration:**

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Optional (legacy bootstrap / storage scripts only — admin approvals use your session + RLS RPCs):**

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Site URL strategy (required for reliable sharing/SEO in production):**

```env
# Local development
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Vercel production (set in Vercel project env vars)
# NEXT_PUBLIC_SITE_URL=https://spaceart-two.vercel.app

# For future custom domain migration, update NEXT_PUBLIC_SITE_URL only.
# All share/canonical/metadata URLs resolve from this single value.
NEXT_PUBLIC_USE_DEMO_CONTENT=false
```

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Run migrations in order via **SQL Editor** or Supabase CLI:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_seed_data.sql`
   - `supabase/migrations/004_storage_onboarding.sql`
   - `supabase/migrations/005_schema_and_storage_repair.sql` (if uploads return 503 or buckets are missing)
   - `supabase/migrations/008_rbac_moderation.sql` (RBAC roles, audit columns, admin RPCs)
3. **Authentication → Providers:**
   - Enable **Email** (Magic Link + optional password)
   - Enable **Google** OAuth
   - Add redirect URL: `http://localhost:3000/auth/callback`
4. **Storage:** buckets `avatars` and `listings` are created by migrations `004` / `005` / `007`.
   - If `POST /api/upload` returns **503** with `BUCKET_NOT_FOUND`, run `005_schema_and_storage_repair.sql` (or `007_storage_policy_repair.sql`) in the SQL Editor.
   - Optional CLI (requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`): `npm run storage:setup` then `npm run storage:verify`
   - **Graceful degradation:** sign-up, onboarding, and dashboard access work without storage. Avatar uploads are optional; failed uploads use a placeholder and do not block profile creation.
5. Promote your first admin (run in SQL Editor — see `supabase/scripts/promote-first-admin.sql`):

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

Roles: `user` (default), `moderator` (read moderation queues), `admin` (approve creators/listings, verify creatives).

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Architecture

```
src/
├── infrastructure/supabase/   # Clients, types, middleware, storage, queries
├── domains/                   # Auth, creatives, listings, profiles, search
├── shared/hooks/              # React Query hooks (useProfile, useListings, …)
├── shared/providers/          # QueryProvider
└── app/                       # App Router routes
```

Legacy `infrastructure/database/*` re-exports from `infrastructure/supabase/*` for compatibility.

## Auth Flow

1. Sign up / sign in (Magic Link, Google, or password)
2. OAuth/Magic Link → `/auth/callback` → session cookies
3. New users → `/dashboard/onboarding` (4-step wizard; profile photo optional)
4. Profile submitted → `pending` → admin approves at `/admin/creators`
5. Listings submitted → `pending_review` → admin approves at `/admin/listings`

Admin routes: `/admin`, `/admin/creators`, `/admin/listings` (staff: admin or moderator; approve actions: admin only).

Upload resolution lives in `src/shared/lib/avatar-url.ts` (`resolveAvatarUrl`). Client uploads use `tryStorageUpload` in `src/shared/hooks/use-storage-upload.ts` so `/api/upload` failures are logged but non-blocking.

## License

Private — SPACEART © 2026

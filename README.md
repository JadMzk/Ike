# Ike

Dynamic task prioritization — not a classic Eisenhower matrix. Each task lives on a 2D landscape where **importance** and **urgency** evolve over time, and priority emerges from how they interact with effort and motivation.

**Stack:** FastAPI · Supabase Postgres · Expo SDK 54 · React Native · TypeScript

## Features

- Google Sign-In via Supabase Auth
- Create and manage tasks with importance, urgency, and effort
- Priority landscape (animated 2D plan)
- Adaptive category resistance (learned from completion patterns, hidden from UI)
- Daily motivation check-in (local only)

## Project structure

```text
app/                 FastAPI backend
frontend/            Expo mobile app
supabase/migrations/ SQL migrations (profiles, tasks, allowlist, resistance)
docs/                Setup guides
tests/               Backend unit tests
```

## Quick start

### 1. Database & auth

1. Create a [Supabase](https://supabase.com) project.
2. Run migrations in order:
   - `supabase/migrations/001_auth_profiles.sql`
   - `supabase/migrations/002_user_category_resistance.sql`
3. Enable Google OAuth — full steps in [docs/AUTH_SETUP.md](docs/AUTH_SETUP.md).

### 2. Backend

```bash
cp .env.example .env   # fill DATABASE_URL, SUPABASE_URL, SUPABASE_JWT_SECRET
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://127.0.0.1:8000/docs

### 3. Frontend

```bash
cd frontend
cp .env.example .env   # fill Supabase + API URL
npm install
npx expo start
```

Scan the QR code with **Expo Go (SDK 54)** or press `i` / `a` for simulators.

On a physical device, set `EXPO_PUBLIC_API_BASE_URL` to your machine's LAN IP (e.g. `http://192.168.1.42:8000`), or leave it unset — the app auto-detects the Metro host in dev.

### 4. Optional: Android APK (EAS)

See [frontend/README.md](frontend/README.md#eas-build-android-apk). Run `npx eas init` to link your own Expo project before building.

## Environment variables

| Location | Key variables |
|----------|----------------|
| `.env` (root) | `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_JWT_SECRET` |
| `frontend/.env` | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_API_BASE_URL` |

Never commit `.env` files. Use the `.env.example` templates.

### Optional sign-in allowlist

By default, any Google account that authenticates via your Supabase project can use the app. To restrict sign-in:

- Set `ALLOWED_EMAILS=you@gmail.com,friend@gmail.com` in backend `.env`, and/or
- Insert rows into the `allowed_emails` table (see migration `001`).

## Security

- Keep secrets in `.env` only — they are gitignored.
- The Supabase **anon/publishable** key is designed for client-side use; protect data with Row Level Security (RLS) on Supabase.
- If you previously committed secrets or shared a private fork, rotate your Supabase database password and JWT secret.

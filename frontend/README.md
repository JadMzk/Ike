# Ike — Frontend (Expo + TypeScript)

Mobile UI for the dynamic task-prioritization API in `../app`.

**Auth:** Google Sign-In via Supabase. See [../docs/AUTH_SETUP.md](../docs/AUTH_SETUP.md).

## Setup

```bash
cd frontend
cp .env.example .env   # fill Supabase + API URL
npm install
npx expo start
```

Press `a` / `i` or scan QR with Expo Go. Sign in with Google on the login screen.

## Environment

| Variable | Purpose |
|----------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/publishable key |
| `EXPO_PUBLIC_API_BASE_URL` | FastAPI (`uvicorn` on your Mac) |

`VITE_*` aliases are supported in `src/services/supabase.ts` if you add a Vite web app later.

## Layout

```
App.tsx
src/
  services/     supabase.ts, auth.ts
  hooks/        useAuth.tsx (AuthProvider + AuthGate)
  screens/      LoginScreen, HomeScreen, …
  components/   LoginButton, ProtectedRoute (re-export)
  api/          client.ts, authApi.ts, taskApi.ts
```

Legacy `UserContext` / password flows have been removed.

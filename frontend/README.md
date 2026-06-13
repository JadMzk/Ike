# Ike — Frontend (Expo SDK 54 + TypeScript)

Mobile UI for the dynamic task-prioritization API in `../app`.

**Stack:** Expo SDK 54 · React Native 0.81 · React 19.1

**Auth:** Google Sign-In via Supabase. See [../docs/AUTH_SETUP.md](../docs/AUTH_SETUP.md).

## Setup

```bash
cd frontend
cp .env.example .env   # fill Supabase + API URL
npm install
npx expo start
```

Press `a` / `i` or scan QR with **Expo Go (SDK 54)**. Sign in with Google on the login screen.

After upgrading SDK versions, clear Metro cache: `npx expo start -c`.

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

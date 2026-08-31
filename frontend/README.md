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
| `EXPO_PUBLIC_API_BASE_URL` | FastAPI (`http://YOUR_LAN_IP:8000` or deployed URL) |

If unset in dev, the app auto-detects your Metro host for the API URL. `VITE_*` aliases are supported in `src/services/supabase.ts` if you add a Vite web app later.

## EAS Build (Android APK)

Config is in `eas.json` + `android.package` / `ios.bundleIdentifier` in `app.json`.

```bash
# 1. Log in (browser) — once
npx eas login

# 2. Link this app to an Expo project (writes projectId into app.json)
npx eas init

# 3. Push env vars for cloud builds
npx eas env:set preview --name EXPO_PUBLIC_SUPABASE_URL --value "https://YOUR_REF.supabase.co"
npx eas env:set preview --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value "your_key" --visibility sensitive
npx eas env:set preview --name EXPO_PUBLIC_API_BASE_URL --value "https://your-api.example.com"

# 4. Build a downloadable APK
npm run build:android:preview
```

When the build finishes, Expo gives a **download link** for the APK.

Add `ike://auth/callback` in Supabase → Authentication → URL Configuration (standalone builds do not use `exp://`).

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

Legacy password signup flows have been removed.

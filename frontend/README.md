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
| `EXPO_PUBLIC_API_BASE_URL` | FastAPI (local LAN or `https://ike.up.railway.app`) |

`VITE_*` aliases are supported in `src/services/supabase.ts` if you add a Vite web app later.

## EAS Build (Android APK for beta)

Config is in `eas.json` + `android.package` / `ios.bundleIdentifier` in `app.json`.

```bash
# 1. Log in (browser) — once
npx eas login

# 2. Link this app to an Expo project (writes projectId into app.json)
npx eas init

# 3. Push Supabase env for cloud builds (API URL is already in eas.json preview/production)
npx eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://YOUR_REF.supabase.co" --environment preview --visibility plaintext
npx eas env:create --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value "your_key" --environment preview --visibility sensitive
# Optional: same vars for production if you build that profile too
npx eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://YOUR_REF.supabase.co" --environment production --visibility plaintext
npx eas env:create --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value "your_key" --environment production --visibility sensitive

# 4. Build a downloadable APK
npm run build:android:preview
```

When the build finishes, Expo gives a **download link** for the APK. Share it with beta testers (they must allow install from unknown sources).

Also add `ike://auth/callback` in Supabase → Authentication → URL Configuration (standalone builds do not use `exp://`).

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

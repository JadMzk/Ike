# Ike — Frontend (Expo + TypeScript)

Mobile UI for the dynamic task-prioritization API in `../app`.

## Setup

```bash
cd frontend
npm install
npm start
```

Then press `i` (iOS sim), `a` (Android), or scan the QR code with Expo Go.

## Pointing at the FastAPI backend

The base URL is read in this order:

1. `EXPO_PUBLIC_API_BASE_URL` env var (build-time)
2. `extra.apiBaseUrl` in `app.json` (defaults to `http://127.0.0.1:8000`)
3. Hard fallback `http://127.0.0.1:8000`

### Real device on the same Wi-Fi

`127.0.0.1` resolves to the *device*, not your laptop. Replace it with your
machine's LAN IP, e.g.:

```json
// app.json
"extra": { "apiBaseUrl": "http://192.168.1.42:8000" }
```

Find your IP with `ipconfig getifaddr en0` (macOS) or `ifconfig`.

Make sure FastAPI listens on all interfaces:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## MVP user switcher

The home screen has a chip selector to switch between `user_id = 1` and
`user_id = 2`. Tasks and the priority plan reload automatically.

> TODO(auth): once login is wired in, remove `UserSelector` in
> `src/screens/HomeScreen.tsx` and source the user from the auth context
> in `src/context/UserContext.tsx`.

## Project layout

```
App.tsx                      # navigation root
src/
  api/        client.ts, taskApi.ts, userApi.ts
  components/ PriorityPlan.tsx, TaskCard.tsx, PriorityBadge.tsx
  context/    UserContext.tsx
  navigation/ types.ts
  screens/    HomeScreen, CreateTaskScreen, PriorityPlanScreen, TaskDetailScreen
  types/      task.ts, user.ts
  utils/      priority.ts
```

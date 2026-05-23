import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = 8000;
const FALLBACK_BASE_URL = `http://127.0.0.1:${API_PORT}`;

const extra =
  (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined) ?? {};

/**
 * Metro / Expo Go advertises the dev machine as hostUri (e.g. 192.168.x.x:8081).
 * Reuse that host for the FastAPI port so the API URL tracks your LAN IP automatically.
 */
function hostFromExpoDevServer(): string | null {
  const raw =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | null)?.debuggerHost;

  if (!raw) return null;

  const withoutScheme = raw.replace(/^exp:\/\//, '');
  const host = withoutScheme.split(':')[0]?.trim();
  if (!host || host === 'localhost' || host === '127.0.0.1') {
    return null;
  }
  return host;
}

function resolveApiBaseUrl(): string {
  const explicit =
    process.env.EXPO_PUBLIC_API_BASE_URL ?? extra.apiBaseUrl ?? null;
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  if (__DEV__) {
    const lanHost = hostFromExpoDevServer();
    if (lanHost) {
      return `http://${lanHost}:${API_PORT}`;
    }

    // Android emulator → host machine
    if (Platform.OS === 'android') {
      return `http://10.0.2.2:${API_PORT}`;
    }

    // iOS simulator on the same Mac as uvicorn
    return FALLBACK_BASE_URL;
  }

  return FALLBACK_BASE_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

let accessToken: string | null = null;

/** Attach Supabase access token to FastAPI requests (set from AuthProvider). */
export function setApiAccessToken(token: string | null): void {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

if (__DEV__) {
  console.log('[api] baseURL =', API_BASE_URL);
}

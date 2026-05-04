import axios from 'axios';
import Constants from 'expo-constants';

/**
 * Resolve the FastAPI base URL.
 *
 * Priority:
 *   1. `extra.apiBaseUrl` from app.json (override per build).
 *   2. Fallback to localhost (works in iOS simulator and web).
 *
 * IMPORTANT — testing on a real phone:
 * 127.0.0.1 / localhost point at the *device*, not your laptop.
 * Edit `extra.apiBaseUrl` in app.json (or set EXPO_PUBLIC_API_BASE_URL)
 * to your computer's LAN IP, e.g. "http://192.168.1.42:8000".
 *
 * TODO(auth): wire an interceptor to attach an Authorization header once
 * the backend exposes login / JWT endpoints.
 */
const FALLBACK_BASE_URL = 'http://127.0.0.1:8000';

const extra =
  (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined) ?? {};

export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? extra.apiBaseUrl ?? FALLBACK_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

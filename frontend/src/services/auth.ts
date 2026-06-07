/**
 * Google OAuth via Supabase Auth (no custom JWT/session code).
 *
 * Expo Go requires an `exp://` redirect that matches Metro's host — NOT `ike://`.
 * Custom scheme `ike://` is used only in dev/production builds (not Expo Go).
 */
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

const APP_SCHEME = 'ike';

/** Must match Supabase Dashboard → Auth → URL Configuration → Redirect URLs */
export function getOAuthRedirectUri(): string {
  const inExpoGo = Constants.appOwnership === 'expo';

  if (inExpoGo) {
    return makeRedirectUri({
      path: 'auth/callback',
      preferLocalhost: Platform.OS === 'ios',
    });
  }

  return makeRedirectUri({
    scheme: APP_SCHEME,
    path: 'auth/callback',
  });
}

function redirectBase(redirectTo: string): string {
  return redirectTo.split('?')[0].split('#')[0];
}

function isAuthCallbackUrl(url: string, redirectTo: string): boolean {
  const base = redirectBase(redirectTo);
  return url.startsWith(base);
}

/** Dev-only: log JWT signing algorithm from an access token (no full token logged). */
function logAccessTokenAlg(accessToken: string): void {
  if (!__DEV__) return;
  try {
    const part = accessToken.split('.')[0];
    if (!part) return;
    const padded = part.replace(/-/g, '+').replace(/_/g, '/');
    const header = JSON.parse(atob(padded)) as { alg?: string };
    console.log('[auth] JWT alg =', header.alg ?? '(unknown)');
  } catch {
    console.log('[auth] JWT alg = (could not decode header)');
  }
}

/** Dev-only: log callback shape without leaking tokens. */
function logCallbackDebug(source: string, url: string): void {
  if (!__DEV__) return;
  const redacted = url
    .replace(/access_token=[^&#]*/gi, 'access_token=[REDACTED]')
    .replace(/refresh_token=[^&#]*/gi, 'refresh_token=[REDACTED]')
    .replace(/code=[^&#]*/gi, 'code=[REDACTED]');
  console.log('[auth] callback', source, {
    hasQuery: url.includes('?'),
    hasHash: url.includes('#'),
    preview: redacted.slice(0, 160),
  });
}

async function hasActiveSession(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return data.session != null;
}

/** Parse OAuth callback URL and establish a Supabase session (tokens or PKCE code). */
async function createSessionFromCallbackUrl(url: string): Promise<void> {
  const { params, errorCode } = QueryParams.getQueryParams(url);

  if (params.error) {
    throw new Error(params.error_description ?? params.error);
  }
  if (errorCode) {
    throw new Error(errorCode);
  }

  const access_token = params.access_token;
  const refresh_token = params.refresh_token;

  if (access_token) {
    logAccessTokenAlg(access_token);
    const { error } = await supabase.auth.setSession({
      access_token,
      refresh_token: refresh_token ?? '',
    });
    if (error) throw error;
    return;
  }

  const code = params.code;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return;
  }

  if (await hasActiveSession()) {
    return;
  }

  throw new Error('OAuth callback did not include session tokens or auth code');
}

export async function signInWithGoogle(): Promise<void> {
  const redirectTo = getOAuthRedirectUri();

  if (__DEV__) {
    console.log('[auth] OAuth redirectTo =', redirectTo);
  }

  let linkingCallbackUrl: string | null = null;

  const linkingSub = Linking.addEventListener('url', ({ url }) => {
    if (isAuthCallbackUrl(url, redirectTo)) {
      linkingCallbackUrl = url;
      logCallbackDebug('Linking', url);
    }
  });

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (error) throw error;
    if (!data?.url) throw new Error('No OAuth URL returned from Supabase');

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new Error('Sign-in was cancelled');
    }

    if (result.type !== 'success') {
      throw new Error('Sign-in failed — unexpected browser result');
    }

    logCallbackDebug('WebBrowser', result.url);

    // Session may already be persisted (PKCE / AsyncStorage) before URL parsing.
    if (await hasActiveSession()) {
      return;
    }

    // Linking often receives the full URL including #access_token=… on Expo Go.
    const callbackUrl = linkingCallbackUrl ?? result.url;

    if (__DEV__) {
      console.log(
        '[auth] parsing callback from',
        linkingCallbackUrl ? 'Linking' : 'WebBrowser',
      );
    }

    await createSessionFromCallbackUrl(callbackUrl);

    if (!(await hasActiveSession())) {
      throw new Error('Sign-in completed but no session was created');
    }
  } finally {
    linkingSub.remove();
  }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

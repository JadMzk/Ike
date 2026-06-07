import type { Session } from '@supabase/supabase-js';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { authApi } from '../api/authApi';
import { setApiAccessToken } from '../api/client';
import { signInWithGoogle, signOut } from '../services/auth';
import { supabase } from '../services/supabase';
import type { Profile } from '../types/profile';

const BETA_MESSAGE = 'Ike is currently in private beta.';

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  profileId: string | null;
  loading: boolean;
  betaBlocked: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function syncBackendProfile(): Promise<Profile> {
  const response = await authApi.sync();
  return response.profile;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [betaBlocked, setBetaBlocked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const applySession = useCallback(async (next: Session | null) => {
    setSession(next);
    setBetaBlocked(false);
    setAuthError(null);

    if (!next) {
      setProfile(null);
      setApiAccessToken(null);
      return;
    }

    setApiAccessToken(next.access_token);

    try {
      const synced = await syncBackendProfile();
      setProfile(synced);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } };
      if (axiosErr.response?.status === 403) {
        setBetaBlocked(true);
        setAuthError(axiosErr.response.data?.detail ?? BETA_MESSAGE);
        await signOut();
        setSession(null);
        setProfile(null);
        setApiAccessToken(null);
        return;
      }
      if (__DEV__) {
        console.log('[auth] /auth/sync failed', {
          status: axiosErr.response?.status,
          detail: axiosErr.response?.data?.detail,
        });
      }
      setAuthError('Could not connect your account. Try again.');
      await signOut();
      setSession(null);
      setProfile(null);
      setApiAccessToken(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      await applySession(data.session);
      if (mounted) setLoading(false);
    })();

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        await applySession(nextSession);
      },
    );

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [applySession]);

  const handleSignIn = useCallback(async () => {
    setAuthError(null);
    setBetaBlocked(false);
    try {
      await signInWithGoogle();
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        await applySession(data.session);
      } else {
        throw new Error('No session after sign-in');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign-in failed';
      setAuthError(message);
    }
  }, [applySession]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setSession(null);
    setProfile(null);
    setBetaBlocked(false);
    setAuthError(null);
    setApiAccessToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      profileId: profile?.id ?? null,
      loading,
      betaBlocked,
      authError,
      signInWithGoogle: handleSignIn,
      signOut: handleSignOut,
    }),
    [
      session,
      profile,
      loading,
      betaBlocked,
      authError,
      handleSignIn,
      handleSignOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

/** Gate: shows spinner while restoring session, login when signed out. */
export function AuthGate({
  login,
  children,
}: {
  login: React.ReactNode;
  children: React.ReactNode;
}) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={gateStyles.centered}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  if (!session || !profile) {
    return <>{login}</>;
  }

  return <>{children}</>;
}

const gateStyles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
});

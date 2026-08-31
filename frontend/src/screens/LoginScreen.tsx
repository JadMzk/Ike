import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoginButton } from '../components/LoginButton';
import { useAuth } from '../hooks/useAuth';
import { getOAuthRedirectUri } from '../services/auth';

export default function LoginScreen() {
  const { signInWithGoogle, authError, accessDenied } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Ike</Text>
        <Text style={styles.subtitle}>
          Your living task landscape — importance, urgency, and effort in one
          view.
        </Text>

        <LoginButton onPress={signInWithGoogle} />

        {accessDenied || authError ? (
          <Text style={styles.error}>
            {authError ??
              'Sign-in is not allowed for this account on this server.'}
          </Text>
        ) : null}

        {__DEV__ ? (
          <Text style={styles.hint}>
            Add to Supabase → Auth → Redirect URLs:{'\n'}
            {getOAuthRedirectUri()}
            {'\n\n'}
            (Expo Go uses exp:// — add ike://auth/callback for production builds)
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: { fontSize: 40, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  error: {
    marginTop: 20,
    color: '#b91c1c',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 300,
  },
  hint: {
    marginTop: 24,
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

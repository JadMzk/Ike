import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

interface Props {
  onPress: () => Promise<void>;
  disabled?: boolean;
}

export function LoginButton({ onPress, disabled }: Props) {
  const [busy, setBusy] = useState(false);

  const handlePress = async () => {
    setBusy(true);
    try {
      await onPress();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        styles.button,
        (pressed || busy || disabled) && styles.buttonPressed,
      ]}
    >
      {busy ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.label}>Continue with Google</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 260,
  },
  buttonPressed: { opacity: 0.85 },
  label: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

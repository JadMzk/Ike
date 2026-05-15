import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useMotivation } from '../context/MotivationContext';

interface Props {
  visible: boolean;
}

export function MotivationPrompt({ visible }: Props) {
  const { setMotivationScore, skipCheckIn } = useMotivation();
  const [selected, setSelected] = useState(5);

  const onConfirm = () => {
    setMotivationScore(selected);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>How much do you feel like doing today?</Text>
          <Text style={styles.subtitle}>Scale 1 (low) → 10 (high)</Text>

          <View style={styles.scaleRow}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
              const active = n === selected;
              return (
                <Pressable
                  key={n}
                  onPress={() => setSelected(n)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {n}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable onPress={onConfirm} style={styles.primaryBtn}>
            <Text style={styles.primaryText}>Continue</Text>
          </Pressable>
          <Pressable onPress={skipCheckIn} style={styles.secondaryBtn}>
            <Text style={styles.secondaryText}>Skip for now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 16 },
  scaleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  chipText: { fontWeight: '600', color: '#0f172a' },
  chipTextActive: { color: '#fff' },
  primaryBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { marginTop: 10, alignItems: 'center', paddingVertical: 8 },
  secondaryText: { color: '#64748b' },
});

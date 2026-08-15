import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useMotivation } from '../context/MotivationContext';
import { ScoreSlider } from './ScoreSlider';

interface Props {
  visible: boolean;
}

function moodLabel(score: number): string {
  if (score <= 3) return 'Low energy';
  if (score <= 6) return 'Doing okay';
  return 'Feeling motivated';
}

export function MotivationPrompt({ visible }: Props) {
  const { setMotivationScore, skipCheckIn } = useMotivation();
  const [selected, setSelected] = useState(5);

  const onConfirm = () => {
    setMotivationScore(Math.round(selected));
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>How are you feeling today?</Text>
          <Text style={styles.subtitle}>
            This helps Ike match tasks to your energy — nothing is shared.
          </Text>

          <ScoreSlider
            value={selected}
            onChange={setSelected}
            valueLabel={moodLabel(selected)}
            min={1}
            max={10}
            step={1}
            minLabel="Low energy"
            maxLabel="Motivated"
          />

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
  primaryBtn: {
    marginTop: 16,
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondaryBtn: { marginTop: 10, alignItems: 'center', paddingVertical: 8 },
  secondaryText: { color: '#64748b' },
});

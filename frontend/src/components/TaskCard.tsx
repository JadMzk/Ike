import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Task } from '../types/task';
import { PriorityBadge } from './PriorityBadge';

interface Props {
  task: Task;
  onPress?: () => void;
}

export function TaskCard({ task, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.name} numberOfLines={1}>
          {task.name}
        </Text>
        <PriorityBadge level={task.priority_level} />
      </View>

      <View style={styles.metaRow}>
        <Metric label="Importance" value={task.importance_score} />
        <Metric label="Urgency" value={task.current_urgency} />
        <Metric label="Score" value={task.priority_score} />
      </View>
    </Pressable>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value.toFixed(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pressed: { opacity: 0.7 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  name: { flex: 1, fontSize: 16, fontWeight: '600', color: '#0f172a' },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: { alignItems: 'flex-start' },
  metricLabel: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
});

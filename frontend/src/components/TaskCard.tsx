import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Task } from '../types/task';
import { effortLabel, urgencyLabel } from '../utils/labels';
import { PriorityBadge } from './PriorityBadge';

interface Props {
  task: Task;
  onPress?: () => void;
  /** Highlight as one of the top focus tasks. */
  focus?: boolean;
}

export function TaskCard({ task, onPress, focus }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        focus && styles.cardFocus,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={styles.name} numberOfLines={1}>
          {task.name}
        </Text>
        <View style={styles.badges}>
          {focus ? (
            <View style={styles.focusBadge}>
              <Text style={styles.focusText}>FOCUS</Text>
            </View>
          ) : null}
          <PriorityBadge level={task.priority_level} />
        </View>
      </View>

      <Text style={styles.category}>{task.category}</Text>

      <Text style={styles.summary}>
        {urgencyLabel(task.current_urgency)} · {effortLabel(task.current_effort)}
      </Text>
    </Pressable>
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
  cardFocus: {
    borderWidth: 1.5,
    borderColor: '#0f172a',
  },
  pressed: { opacity: 0.7 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 10,
  },
  name: { flex: 1, fontSize: 16, fontWeight: '600', color: '#0f172a' },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  focusBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  focusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  category: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'capitalize',
    marginBottom: 6,
  },
  summary: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { PriorityLevel } from '../types/task';
import { PRIORITY_COLORS } from '../utils/priority';

interface Props {
  level: PriorityLevel;
}

export function PriorityBadge({ level }: Props) {
  return (
    <View style={[styles.badge, { backgroundColor: PRIORITY_COLORS[level] }]}>
      <Text style={styles.text}>{level.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  text: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { taskApi } from '../api/taskApi';
import { PriorityBadge } from '../components/PriorityBadge';
import type { ScreenProps } from '../navigation/types';
import type { Task } from '../types/task';

export default function TaskDetailScreen({
  navigation,
  route,
}: ScreenProps<'TaskDetail'>) {
  const { taskId } = route.params;
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await taskApi.getById(taskId);
      setTask(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Could not load task', message);
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    load();
  }, [load]);

  const onDelete = () => {
    Alert.alert('Delete task?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await taskApi.remove(taskId);
            navigation.goBack();
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            Alert.alert('Could not delete', message);
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  if (loading || !task) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ActivityIndicator style={{ marginTop: 64 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.name}>{task.name}</Text>
        <PriorityBadge level={task.priority_level} />

        <View style={styles.card}>
          <Row label="Importance" value={task.importance_score.toFixed(2)} />
          <Row label="Initial urgency" value={task.initial_urgency_score.toFixed(2)} />
          <Row label="Current urgency" value={task.current_urgency.toFixed(2)} />
          <Row label="Growth rate / day" value={task.urgency_growth_rate.toFixed(2)} />
          <Row label="Priority score" value={task.priority_score.toFixed(2)} highlight />
          <Row
            label="Created at"
            value={new Date(task.created_at).toLocaleString()}
          />
        </View>

        <Pressable
          onPress={onDelete}
          disabled={deleting}
          style={({ pressed }) => [
            styles.deleteBtn,
            (pressed || deleting) && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.deleteText}>
            {deleting ? 'Deleting…' : 'Delete task'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 16, paddingBottom: 32 },
  name: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  card: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  rowLabel: { fontSize: 14, color: '#64748b' },
  rowValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  rowValueHighlight: { color: '#ef4444', fontSize: 16 },
  deleteBtn: {
    marginTop: 24,
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

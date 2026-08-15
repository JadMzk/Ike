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
import {
  effortLabel,
  importanceLabel,
  urgencyLabel,
} from '../utils/labels';

export default function TaskDetailScreen({
  navigation,
  route,
}: ScreenProps<'TaskDetail'>) {
  const { taskId } = route.params;
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

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
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  const onMarkDone = async () => {
    setCompleting(true);
    try {
      await taskApi.markDone(taskId);
      Alert.alert('Nice work!', 'Task completed 🎉', [
        { text: 'Great', onPress: () => navigation.goBack() },
      ]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Could not complete task', message);
    } finally {
      setCompleting(false);
    }
  };

  const onDelete = () => {
    Alert.alert(
      'Delete permanently?',
      'This removes the task entirely. Use "Mark as done" instead if you want to keep it in your history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete permanently',
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
      ],
    );
  };

  if (loading || !task) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ActivityIndicator style={{ marginTop: 64 }} />
      </SafeAreaView>
    );
  }

  const alreadyDone = task.completed;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.name}>{task.name}</Text>
        <View style={styles.metaRow}>
          <PriorityBadge level={task.priority_level} />
          <Text style={styles.category}>{task.category}</Text>
        </View>

        <Pressable
          onPress={onMarkDone}
          disabled={completing || alreadyDone}
          style={({ pressed }) => [
            styles.doneBtn,
            alreadyDone && styles.doneBtnDisabled,
            (pressed || completing) && !alreadyDone && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.doneText}>
            {alreadyDone
              ? 'Already completed ✓'
              : completing
                ? 'Saving…'
                : 'Mark as done'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('EditTask', { taskId })}
          style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.editBtnText}>Edit task</Text>
        </Pressable>

        <View style={styles.compactCard}>
          <CompactStat label="Urgency" value={urgencyLabel(task.current_urgency)} />
          <CompactStat label="Effort" value={effortLabel(task.current_effort)} />
          <CompactStat
            label="Priority"
            value={task.priority_level.toUpperCase()}
            highlight
          />
        </View>

        <Pressable
          onPress={() => setShowDetails((v) => !v)}
          style={styles.detailsToggle}
        >
          <Text style={styles.detailsToggleText}>
            {showDetails ? 'Hide details' : 'Show details'}
          </Text>
        </Pressable>

        {showDetails ? (
          <View style={styles.card}>
            <Row
              label="Importance"
              value={`${importanceLabel(task.importance_score)} (${task.importance_score.toFixed(1)})`}
            />
            <Row
              label="Initial urgency"
              value={task.initial_urgency_score.toFixed(1)}
            />
            <Row
              label="Current urgency"
              value={task.current_urgency.toFixed(1)}
            />
            <Row
              label="Initial effort"
              value={task.initial_effort.toFixed(1)}
            />
            <Row
              label="Current effort"
              value={task.current_effort.toFixed(1)}
            />
            <Row
              label="Priority score"
              value={task.priority_score.toFixed(1)}
              highlight
            />
            <Row
              label="Created"
              value={new Date(task.created_at).toLocaleString()}
            />
            {task.completed_at ? (
              <Row
                label="Completed"
                value={new Date(task.completed_at).toLocaleString()}
              />
            ) : null}
          </View>
        ) : null}

        <Pressable
          onPress={onDelete}
          disabled={deleting}
          style={({ pressed }) => [
            styles.deleteLink,
            (pressed || deleting) && { opacity: 0.6 },
          ]}
        >
          <Text style={styles.deleteLinkText}>
            {deleting ? 'Deleting…' : 'Delete permanently'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function CompactStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.compactStat}>
      <Text style={styles.compactLabel}>{label}</Text>
      <Text style={[styles.compactValue, highlight && styles.compactHighlight]}>
        {value}
      </Text>
    </View>
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
  name: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 10 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  category: {
    fontSize: 13,
    color: '#64748b',
    textTransform: 'capitalize',
    fontWeight: '600',
  },

  doneBtn: {
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnDisabled: { backgroundColor: '#94a3b8' },
  doneText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  editBtn: {
    marginTop: 10,
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  editBtnText: { color: '#0f172a', fontWeight: '700', fontSize: 15 },

  compactCard: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  compactStat: { flex: 1, alignItems: 'flex-start' },
  compactLabel: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  compactValue: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  compactHighlight: { color: '#ef4444' },

  detailsToggle: { marginTop: 16, paddingVertical: 6 },
  detailsToggleText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  card: {
    marginTop: 8,
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
    gap: 12,
  },
  rowLabel: { fontSize: 14, color: '#64748b' },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    flexShrink: 1,
    textAlign: 'right',
  },
  rowValueHighlight: { color: '#ef4444' },

  deleteLink: { alignSelf: 'center', marginTop: 24, padding: 8 },
  deleteLinkText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});

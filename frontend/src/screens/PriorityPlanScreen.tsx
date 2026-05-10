import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { taskApi } from '../api/taskApi';
import { PriorityPlan } from '../components/PriorityPlan';
import { ProjectionControl } from '../components/ProjectionControl';
import { useSelectedUser } from '../context/UserContext';
import type { ScreenProps } from '../navigation/types';
import type { Task, TaskCoordinates } from '../types/task';
import { projectedCoordinates } from '../utils/projection';

const RECOMMENDATION_LIMIT = 5;

export default function PriorityPlanScreen({
  navigation,
}: ScreenProps<'PriorityPlan'>) {
  const { selectedUserId } = useSelectedUser();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projectionDays, setProjectionDays] = useState(0);

  // Bumped on each fetch so memoised "now" stays stable for one snapshot.
  const [snapshotEpoch, setSnapshotEpoch] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      // Active tasks only — the backend already filters out completed ones.
      const data = await taskApi.listByUser(selectedUserId);
      setTasks(data);
      setSnapshotEpoch(Date.now());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Could not load plan', message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedUserId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  // Compute coords + recommendations client-side from the active task list,
  // so the same fetch powers Today / +7d / +30d / Custom views.
  const now = useMemo(() => new Date(snapshotEpoch), [snapshotEpoch]);

  const coordinates: TaskCoordinates[] = useMemo(
    () => tasks.map((t) => projectedCoordinates(t, projectionDays, now)),
    [tasks, projectionDays, now],
  );

  const recommendations = useMemo(
    () =>
      [...coordinates]
        .sort((a, b) => b.priority_score - a.priority_score)
        .slice(0, RECOMMENDATION_LIMIT),
    [coordinates],
  );

  const horizonLabel =
    projectionDays === 0 ? 'Today' : `In ${projectionDays} day${projectionDays === 1 ? '' : 's'}`;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Priority plan</Text>
        <Text style={styles.subtitle}>
          User {selectedUserId} · {coordinates.length} active task
          {coordinates.length === 1 ? '' : 's'} · {horizonLabel}
        </Text>

        <ProjectionControl value={projectionDays} onChange={setProjectionDays} />

        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} />
        ) : (
          <>
            <PriorityPlan
              tasks={coordinates}
              onTaskPress={(taskId) =>
                navigation.navigate('TaskDetail', { taskId })
              }
            />

            {recommendations.length > 0 ? (
              <View style={styles.reco}>
                <Text style={styles.recoTitle}>Top focus · {horizonLabel}</Text>
                {recommendations.map((t, idx) => (
                  <Text key={t.task_id} style={styles.recoItem}>
                    {idx + 1}. {t.name}{' '}
                    <Text style={styles.recoMeta}>
                      (priority {t.priority_score.toFixed(1)})
                    </Text>
                  </Text>
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  reco: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
  },
  recoTitle: { fontWeight: '700', marginBottom: 8, color: '#0f172a' },
  recoItem: { fontSize: 14, color: '#0f172a', paddingVertical: 2 },
  recoMeta: { color: '#64748b', fontSize: 12 },
});

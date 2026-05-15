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
import { PriorityLandscape } from '../components/PriorityLandscape';
import { ProjectionControl } from '../components/ProjectionControl';
import { useMotivation } from '../context/MotivationContext';
import { useSelectedUser } from '../context/UserContext';
import type { ScreenProps } from '../navigation/types';
import type { Task, TaskCoordinates } from '../types/task';
import {
  adaptRecommendationsToMotivation,
  motivationMessage,
  QUADRANT_LABELS,
} from '../utils/landscape';
import { projectedCoordinates } from '../utils/projection';

export default function PriorityLandscapeScreen({
  navigation,
}: ScreenProps<'PriorityLandscape'>) {
  const { selectedUserId } = useSelectedUser();
  const { motivationScore } = useMotivation();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projectionDays, setProjectionDays] = useState(0);
  const [snapshotEpoch, setSnapshotEpoch] = useState(() => Date.now());

  const load = useCallback(async () => {
    try {
      const data = await taskApi.listByUser(selectedUserId);
      setTasks(data);
      setSnapshotEpoch(Date.now());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Could not load landscape', message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedUserId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      load();
    });
    return unsubscribe;
  }, [navigation, load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const now = useMemo(() => new Date(snapshotEpoch), [snapshotEpoch]);

  const coordinates: TaskCoordinates[] = useMemo(
    () => tasks.map((t) => projectedCoordinates(t, projectionDays, now)),
    [tasks, projectionDays, now],
  );

  const recommendations = useMemo(
    () => adaptRecommendationsToMotivation(coordinates, motivationScore),
    [coordinates, motivationScore],
  );

  const banner = motivationMessage(motivationScore);

  const horizonLabel =
    projectionDays === 0
      ? 'Today'
      : `In ${projectionDays} day${projectionDays === 1 ? '' : 's'}`;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Dynamic task landscape</Text>
        <Text style={styles.subtitle}>
          User {selectedUserId} · {coordinates.length} active task
          {coordinates.length === 1 ? '' : 's'} · {horizonLabel}
        </Text>

        {banner ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{banner}</Text>
          </View>
        ) : null}

        <ProjectionControl value={projectionDays} onChange={setProjectionDays} />

        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} />
        ) : coordinates.length === 0 ? (
          <Text style={styles.empty}>No active tasks — create one to see the landscape.</Text>
        ) : (
          <>
            <PriorityLandscape
              tasks={coordinates}
              motivationScore={motivationScore}
              onTaskPress={(taskId) =>
                navigation.navigate('TaskDetail', { taskId })
              }
            />

            {recommendations.length > 0 ? (
              <View style={styles.reco}>
                <Text style={styles.recoTitle}>Recommended focus · {horizonLabel}</Text>
                {recommendations.map((t, idx) => (
                  <Text key={t.task_id} style={styles.recoItem}>
                    {idx + 1}. {t.name}{' '}
                    <Text style={styles.recoMeta}>
                      ({QUADRANT_LABELS[t.quadrant]} · priority{' '}
                      {t.priority_score.toFixed(1)})
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
  subtitle: { fontSize: 13, color: '#64748b', marginBottom: 12 },
  banner: {
    backgroundColor: '#e0e7ff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  bannerText: { color: '#312e81', fontWeight: '600', fontSize: 14 },
  empty: { marginTop: 24, textAlign: 'center', color: '#64748b' },
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

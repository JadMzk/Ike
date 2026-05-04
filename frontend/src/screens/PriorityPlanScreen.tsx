import React, { useCallback, useEffect, useState } from 'react';
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
import { useSelectedUser } from '../context/UserContext';
import type { ScreenProps } from '../navigation/types';
import type { PriorityPlan as PriorityPlanData, TaskCoordinates } from '../types/task';

export default function PriorityPlanScreen({
  navigation,
}: ScreenProps<'PriorityPlan'>) {
  const { selectedUserId } = useSelectedUser();
  const [plan, setPlan] = useState<PriorityPlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await taskApi.getPriorityPlan(selectedUserId);
      setPlan(data);
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

  const allTasks: TaskCoordinates[] = plan
    ? Object.values(plan.quadrants).flat()
    : [];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={styles.title}>Priority plan</Text>
        <Text style={styles.subtitle}>
          User {selectedUserId} · {allTasks.length} task{allTasks.length === 1 ? '' : 's'}
        </Text>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} />
        ) : (
          <>
            <PriorityPlan
              tasks={allTasks}
              onTaskPress={(taskId) =>
                navigation.navigate('TaskDetail', { taskId })
              }
            />

            {plan && plan.recommendations.length > 0 ? (
              <View style={styles.reco}>
                <Text style={styles.recoTitle}>Top recommendations</Text>
                {plan.recommendations.map((t, idx) => (
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

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { taskApi } from '../api/taskApi';
import { MotivationPrompt } from '../components/MotivationPrompt';
import { TaskCard } from '../components/TaskCard';
import { useMotivation } from '../context/MotivationContext';
import { useAuth } from '../hooks/useAuth';
import type { ScreenProps } from '../navigation/types';
import type { Task } from '../types/task';

const TOP_N = 3;

export default function HomeScreen({ navigation }: ScreenProps<'Home'>) {
  const { signOut } = useAuth();
  const { hasCheckedInToday } = useMotivation();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await taskApi.listMine();
      setTasks(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Could not load tasks', message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const sortedByPriority = [...tasks].sort(
    (a, b) => b.priority_score - a.priority_score,
  );
  const topTasks = sortedByPriority.slice(0, TOP_N);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Ike</Text>
            <Text style={styles.subtitle}>Dynamic task landscape</Text>
          </View>
          <Pressable onPress={() => signOut()} style={styles.signOut}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>

        <View style={styles.actionsRow}>
          <ActionButton
            label="+ New task"
            onPress={() => navigation.navigate('CreateTask')}
            primary
          />
          <ActionButton
            label="Task landscape"
            onPress={() => navigation.navigate('PriorityLandscape')}
          />
        </View>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} />
        ) : (
          <>
            <Section title={`Top ${TOP_N} priorities`}>
              {topTasks.length === 0 ? (
                <EmptyState text="No tasks yet — create your first one." />
              ) : (
                topTasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onPress={() => navigation.navigate('TaskDetail', { taskId: t.id })}
                  />
                ))
              )}
            </Section>

            <Section title={`All tasks (${tasks.length})`}>
              {sortedByPriority.length === 0 ? (
                <EmptyState text="Pull down to refresh." />
              ) : (
                sortedByPriority.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onPress={() => navigation.navigate('TaskDetail', { taskId: t.id })}
                  />
                ))
              )}
            </Section>
          </>
        )}
      </ScrollView>

      <MotivationPrompt visible={!hasCheckedInToday} />
    </SafeAreaView>
  );
}

function ActionButton({
  label,
  onPress,
  primary,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        primary ? styles.actionPrimary : styles.actionSecondary,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={[styles.actionText, primary && { color: '#fff' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 16, paddingBottom: 48 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: { fontSize: 32, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  signOut: { paddingVertical: 6, paddingHorizontal: 4 },
  signOutText: { fontSize: 13, color: '#64748b', fontWeight: '600' },

  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionPrimary: { backgroundColor: '#0f172a' },
  actionSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  actionText: { fontWeight: '700', color: '#0f172a' },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  empty: { padding: 16, alignItems: 'center' },
  emptyText: { color: '#64748b' },
});

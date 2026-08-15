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

const FOCUS_N = 3;

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
  const focusIds = new Set(sortedByPriority.slice(0, FOCUS_N).map((t) => t.id));
  const isEmpty = !loading && sortedByPriority.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, isEmpty && styles.contentEmpty]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Ike</Text>
            <Text style={styles.subtitle}>What matters next</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('PriorityLandscape')}
            style={({ pressed }) => [styles.mapBtn, pressed && { opacity: 0.75 }]}
          >
            <Text style={styles.mapBtnText}>Map</Text>
          </Pressable>
          <Pressable onPress={() => signOut()} style={styles.signOut}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => navigation.navigate('CreateTask')}
          style={({ pressed }) => [
            styles.createBtn,
            pressed && { opacity: 0.85 },
          ]}
        >
          <Text style={styles.createBtnText}>+ New task</Text>
        </Pressable>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 32 }} />
        ) : isEmpty ? (
          <View style={styles.emptyBlock}>
            <Text style={styles.emptyTitle}>Nothing on your plate yet</Text>
            <Text style={styles.emptyBody}>
              Add a task and Ike will surface what to focus on first.
            </Text>
            <Pressable
              onPress={() => navigation.navigate('CreateTask')}
              style={({ pressed }) => [
                styles.emptyCta,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.emptyCtaText}>Create your first task</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your tasks</Text>
            {sortedByPriority.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                focus={focusIds.has(t.id)}
                onPress={() => navigation.navigate('TaskDetail', { taskId: t.id })}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <MotivationPrompt visible={!hasCheckedInToday} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 16, paddingBottom: 48 },
  contentEmpty: { flexGrow: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 8,
  },
  title: { fontSize: 32, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  mapBtn: {
    marginTop: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  mapBtnText: { fontSize: 13, fontWeight: '700', color: '#0f172a' },
  signOut: { marginTop: 4, paddingVertical: 6, paddingHorizontal: 4 },
  signOutText: { fontSize: 13, color: '#64748b', fontWeight: '600' },

  createBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },

  emptyBlock: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyCta: {
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyCtaText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

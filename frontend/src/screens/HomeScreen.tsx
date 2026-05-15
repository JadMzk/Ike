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
import { useSelectedUser } from '../context/UserContext';
import type { ScreenProps } from '../navigation/types';
import type { Task } from '../types/task';

const TOP_N = 3;

export default function HomeScreen({ navigation }: ScreenProps<'Home'>) {
  const { selectedUserId, availableUserIds, setSelectedUserId } = useSelectedUser();
  const { hasCheckedInToday } = useMotivation();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await taskApi.listByUser(selectedUserId);
      setTasks(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Could not load tasks', message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedUserId]);

  // Reload tasks whenever the screen is focused or the selected user changes.
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [selectedUserId, load]);

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
        <Text style={styles.title}>Ike</Text>
        <Text style={styles.subtitle}>Dynamic task landscape</Text>

        <UserSelector
          users={availableUserIds}
          selected={selectedUserId}
          onSelect={setSelectedUserId}
        />

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

// MVP user selector — replace with real auth once available.
// TODO(auth): drop this component once login is wired in.
function UserSelector({
  users,
  selected,
  onSelect,
}: {
  users: number[];
  selected: number;
  onSelect: (id: number) => void;
}) {
  return (
    <View style={styles.selectorWrapper}>
      <Text style={styles.selectorLabel}>Viewing as</Text>
      <View style={styles.selector}>
        {users.map((id) => {
          const isActive = id === selected;
          return (
            <Pressable
              key={id}
              onPress={() => onSelect(id)}
              style={[styles.selectorChip, isActive && styles.selectorChipActive]}
            >
              <Text
                style={[
                  styles.selectorChipText,
                  isActive && styles.selectorChipTextActive,
                ]}
              >
                User {id}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
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
  title: { fontSize: 32, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 16 },

  selectorWrapper: { marginBottom: 16 },
  selectorLabel: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  selector: { flexDirection: 'row', gap: 8 },
  selectorChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  selectorChipActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  selectorChipText: { color: '#0f172a', fontWeight: '600' },
  selectorChipTextActive: { color: '#fff' },

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

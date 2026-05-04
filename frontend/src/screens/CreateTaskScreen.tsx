import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { taskApi } from '../api/taskApi';
import { useSelectedUser } from '../context/UserContext';
import type { ScreenProps } from '../navigation/types';

const DEFAULT_GROWTH = 0.5;

export default function CreateTaskScreen({ navigation }: ScreenProps<'CreateTask'>) {
  const { selectedUserId } = useSelectedUser();

  const [name, setName] = useState('');
  const [importance, setImportance] = useState('5');
  const [urgency, setUrgency] = useState('5');
  const [growth, setGrowth] = useState(String(DEFAULT_GROWTH));
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    const importanceNum = parseFloat(importance);
    const urgencyNum = parseFloat(urgency);
    const growthNum = parseFloat(growth);

    if (!name.trim()) {
      Alert.alert('Missing name', 'Please give the task a name.');
      return;
    }
    if (
      Number.isNaN(importanceNum) ||
      importanceNum < 0 ||
      importanceNum > 10
    ) {
      Alert.alert('Invalid importance', 'Importance must be between 0 and 10.');
      return;
    }
    if (Number.isNaN(urgencyNum) || urgencyNum < 0 || urgencyNum > 10) {
      Alert.alert('Invalid urgency', 'Urgency must be between 0 and 10.');
      return;
    }
    if (Number.isNaN(growthNum) || growthNum < 0) {
      Alert.alert('Invalid growth rate', 'Growth rate must be ≥ 0.');
      return;
    }

    setSubmitting(true);
    try {
      await taskApi.create(selectedUserId, {
        name: name.trim(),
        importance_score: importanceNum,
        initial_urgency_score: urgencyNum,
        urgency_growth_rate: growthNum,
      });
      navigation.goBack();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert('Could not create task', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>New task</Text>
          <Text style={styles.subtitle}>For user {selectedUserId}</Text>

          <Field label="Name">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Prepare quarterly review"
              placeholderTextColor="#94a3b8"
              style={styles.input}
            />
          </Field>

          <Field label="Importance (0–10)">
            <TextInput
              value={importance}
              onChangeText={setImportance}
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </Field>

          <Field label="Initial urgency (0–10)">
            <TextInput
              value={urgency}
              onChangeText={setUrgency}
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </Field>

          <Field label="Urgency growth rate (per day)">
            <TextInput
              value={growth}
              onChangeText={setGrowth}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <Text style={styles.hint}>
              Defaults to 0.5 — urgency grows this many points per day.
            </Text>
          </Field>

          <Pressable
            onPress={onSubmit}
            disabled={submitting}
            style={({ pressed }) => [
              styles.submit,
              (pressed || submitting) && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.submitText}>
              {submitting ? 'Creating…' : 'Create task'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginBottom: 16 },
  field: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 12,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  hint: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  submit: {
    marginTop: 18,
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

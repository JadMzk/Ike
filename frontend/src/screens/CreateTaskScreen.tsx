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
import { ScoreSlider } from '../components/ScoreSlider';
import type { ScreenProps } from '../navigation/types';
import { TASK_CATEGORIES } from '../types/task';
import {
  DEFAULT_URGENCY_GROWTH,
  effortLabel,
  importanceLabel,
  urgencyLabel,
} from '../utils/labels';

const IMPORTANCE_PRESETS = [
  { label: 'Low', value: 3 },
  { label: 'Med', value: 6 },
  { label: 'High', value: 9 },
];

const URGENCY_PRESETS = [
  { label: 'Later', value: 2 },
  { label: 'Soon', value: 5 },
  { label: 'Today', value: 8 },
];

const DEFAULT_EFFORT = 5;

export default function CreateTaskScreen({ navigation }: ScreenProps<'CreateTask'>) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('personal');
  const [importance, setImportance] = useState(6);
  const [urgency, setUrgency] = useState(5);
  const [effort, setEffort] = useState(DEFAULT_EFFORT);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please give the task a name.');
      return;
    }

    setSubmitting(true);
    try {
      await taskApi.create({
        name: name.trim(),
        category,
        importance_score: importance,
        initial_urgency_score: urgency,
        urgency_growth_rate: DEFAULT_URGENCY_GROWTH,
        initial_effort: effort,
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
          <Text style={styles.subtitle}>Name it, then set how it feels</Text>

          <Field label="Name">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Prepare quarterly review"
              placeholderTextColor="#94a3b8"
              style={styles.input}
            />
          </Field>

          <Field label="Category">
            <View style={styles.categoryRow}>
              {TASK_CATEGORIES.map((cat) => {
                const active = category === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        active && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          <Field label="Importance">
            <ScoreSlider
              value={importance}
              onChange={setImportance}
              valueLabel={importanceLabel(importance)}
              presets={IMPORTANCE_PRESETS}
              minLabel="Nice to have"
              maxLabel="Critical"
            />
          </Field>

          <Field label="Urgency">
            <ScoreSlider
              value={urgency}
              onChange={setUrgency}
              valueLabel={urgencyLabel(urgency)}
              presets={URGENCY_PRESETS}
              minLabel="Later"
              maxLabel="Today"
            />
          </Field>

          <Pressable
            onPress={() => setShowAdvanced((v) => !v)}
            style={styles.advancedToggle}
          >
            <Text style={styles.advancedToggleText}>
              {showAdvanced ? 'Hide effort' : 'Adjust effort (optional)'}
            </Text>
          </Pressable>

          {showAdvanced ? (
            <Field label="Effort">
              <ScoreSlider
                value={effort}
                onChange={setEffort}
                valueLabel={effortLabel(effort)}
                presets={[
                  { label: 'Light', value: 3 },
                  { label: 'Medium', value: 5 },
                  { label: 'Heavy', value: 8 },
                ]}
                minLabel="Light"
                maxLabel="Heavy"
              />
            </Field>
          ) : null}

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
  field: { marginBottom: 18 },
  fieldLabel: {
    fontSize: 12,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
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
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  categoryChipActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  categoryChipText: { fontSize: 13, color: '#0f172a', fontWeight: '600' },
  categoryChipTextActive: { color: '#fff' },
  advancedToggle: { marginBottom: 12, paddingVertical: 4 },
  advancedToggleText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  submit: {
    marginTop: 10,
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

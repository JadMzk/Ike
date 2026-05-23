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
import type { ScreenProps } from '../navigation/types';
import { TASK_CATEGORIES } from '../types/task';

const DEFAULT_GROWTH = 0.1;
const DEFAULT_EFFORT = 5;
const DEFAULT_RESISTANCE = 0.3;

export default function CreateTaskScreen({ navigation }: ScreenProps<'CreateTask'>) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('personal');
  const [importance, setImportance] = useState('6');
  const [urgency, setUrgency] = useState('6');
  const [growth, setGrowth] = useState(String(DEFAULT_GROWTH));
  const [effort, setEffort] = useState(String(DEFAULT_EFFORT));
  const [resistance, setResistance] = useState(String(DEFAULT_RESISTANCE));
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    const importanceNum = parseFloat(importance);
    const urgencyNum = parseFloat(urgency);
    const growthNum = parseFloat(growth);
    const effortNum = parseFloat(effort);
    const resistanceNum = parseFloat(resistance);

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
    if (Number.isNaN(effortNum) || effortNum < 0 || effortNum > 10) {
      Alert.alert('Invalid effort', 'Initial effort must be between 0 and 10.');
      return;
    }
    if (Number.isNaN(resistanceNum) || resistanceNum < 0) {
      Alert.alert('Invalid resistance', 'Resistance factor must be ≥ 0.');
      return;
    }

    setSubmitting(true);
    try {
      await taskApi.create({
        name: name.trim(),
        category,
        importance_score: importanceNum,
        initial_urgency_score: urgencyNum,
        urgency_growth_rate: growthNum,
        initial_effort: effortNum,
        resistance_factor: resistanceNum,
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
          <Text style={styles.subtitle}>Add to your active landscape</Text>

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
            <Text style={styles.hint}>
              Resistance will eventually adapt per category based on delay patterns.
            </Text>
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
              Urgency increases linearly by this many points per day.
            </Text>
          </Field>

          <Field label="Initial effort (0–10)">
            <TextInput
              value={effort}
              onChangeText={setEffort}
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </Field>

          <Field label="Resistance factor">
            <TextInput
              value={resistance}
              onChangeText={setResistance}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <Text style={styles.hint}>
              MVP: set manually. Future: increases when you delay tasks in this category.
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

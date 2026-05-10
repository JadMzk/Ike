import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

/**
 * Minimalist time-preview control for the priority plan.
 * Sits above the graph and emits the number of days to project ahead.
 *
 * Layout: chips for "Today", "+7d", "+30d", and a "Custom" chip that
 * expands an inline numeric input. No modal, no second graph — the same
 * plot animates between projection horizons.
 */
interface Props {
  value: number; // days ahead of today (0 = today)
  onChange: (days: number) => void;
}

const PRESETS: Array<{ label: string; days: number }> = [
  { label: 'Today', days: 0 },
  { label: '+7d', days: 7 },
  { label: '+30d', days: 30 },
];

export function ProjectionControl({ value, onChange }: Props) {
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState(
    value !== 0 && value !== 7 && value !== 30 ? String(value) : '',
  );

  const isPresetSelected = (days: number) => !customMode && value === days;
  const customSelected =
    customMode || (value !== 0 && value !== 7 && value !== 30);

  const applyCustom = (raw: string) => {
    setCustomText(raw);
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= 365 * 5) {
      onChange(parsed);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Preview</Text>

      <View style={styles.row}>
        {PRESETS.map((p) => {
          const active = isPresetSelected(p.days);
          return (
            <Pressable
              key={p.label}
              onPress={() => {
                setCustomMode(false);
                setCustomText('');
                onChange(p.days);
              }}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {p.label}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          onPress={() => {
            setCustomMode(true);
            // If switching from a preset, seed the custom field with the current value.
            if (!customText && value !== 0) setCustomText(String(value));
          }}
          style={[styles.chip, customSelected && styles.chipActive]}
        >
          <Text
            style={[styles.chipText, customSelected && styles.chipTextActive]}
          >
            {customSelected && customText ? `+${customText}d` : '+ Custom'}
          </Text>
        </Pressable>
      </View>

      {customMode ? (
        <View style={styles.customRow}>
          <TextInput
            value={customText}
            onChangeText={applyCustom}
            keyboardType="number-pad"
            placeholder="Days from now"
            placeholderTextColor="#94a3b8"
            style={styles.input}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => setCustomMode(false)}
          />
          <Text style={styles.hint}>days from today</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  label: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  chipActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  chipText: { color: '#0f172a', fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#0f172a',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    minWidth: 100,
  },
  hint: { fontSize: 12, color: '#64748b' },
});

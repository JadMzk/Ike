import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';

export type ScorePreset = { label: string; value: number };

interface Props {
  value: number;
  onChange: (value: number) => void;
  /** Shown under the slider (e.g. "Important"). */
  valueLabel?: string;
  min?: number;
  max?: number;
  step?: number;
  presets?: ScorePreset[];
  minLabel?: string;
  maxLabel?: string;
}

/**
 * 1–10 score control: optional quick presets + continuous slider.
 * Values are sent to the API unchanged; only the UX is simplified.
 */
export function ScoreSlider({
  value,
  onChange,
  valueLabel,
  min = 1,
  max = 10,
  step = 1,
  presets,
  minLabel,
  maxLabel,
}: Props) {
  return (
    <View>
      {presets && presets.length > 0 ? (
        <View style={styles.presetRow}>
          {presets.map((p) => {
            const active = Math.round(value) === p.value;
            return (
              <Pressable
                key={p.label}
                onPress={() => onChange(p.value)}
                style={[styles.presetChip, active && styles.presetChipActive]}
              >
                <Text
                  style={[
                    styles.presetText,
                    active && styles.presetTextActive,
                  ]}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.valueRow}>
        <Text style={styles.valueNumber}>{Math.round(value)}</Text>
        {valueLabel ? <Text style={styles.valueHint}>{valueLabel}</Text> : null}
      </View>

      <Slider
        style={styles.slider}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor="#0f172a"
        maximumTrackTintColor="#cbd5e1"
        thumbTintColor="#0f172a"
      />

      {(minLabel || maxLabel) && (
        <View style={styles.endsRow}>
          <Text style={styles.endLabel}>{minLabel ?? ''}</Text>
          <Text style={styles.endLabel}>{maxLabel ?? ''}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  presetChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  presetChipActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  presetText: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  presetTextActive: { color: '#fff' },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 4,
  },
  valueNumber: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  valueHint: { fontSize: 14, color: '#64748b', fontWeight: '500' },
  slider: { width: '100%', height: 36 },
  endsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  endLabel: { fontSize: 11, color: '#94a3b8' },
});

import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';

import type { TaskCoordinates } from '../types/task';
import { PRIORITY_COLORS, priorityLevelFromScore } from '../utils/priority';

interface Props {
  tasks: TaskCoordinates[];
  onTaskPress?: (taskId: number) => void;
}

const AXIS_MAX = 10;
const DOT_SIZE = 18;
const PADDING = 24; // gutter between axis labels and the plot itself

/**
 * Dynamic 2D priority plan.
 *  - x axis = importance         (0 → 10, left → right)
 *  - y axis = current urgency    (0 → 10, bottom → top)
 *  - dot color reflects priority bucket (low / medium / high / critical)
 *
 * Pure RN — no SVG dependency. We measure the plot area on layout and
 * absolutely-position each dot.
 */
export function PriorityPlan({ tasks, onTaskPress }: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [activeId, setActiveId] = useState<number | null>(null);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  const ready = size.width > 0 && size.height > 0;

  return (
    <View style={styles.wrapper}>
      {/* y-axis label */}
      <View style={styles.yAxisLabel}>
        <Text style={styles.axisLabelText}>Urgency →</Text>
      </View>

      <View style={styles.plotRow}>
        <YTicks />

        <View style={styles.plotArea} onLayout={handleLayout}>
          <Grid />

          {ready &&
            tasks.map((t) => {
              const x = (t.importance / AXIS_MAX) * size.width - DOT_SIZE / 2;
              // y axis is inverted in screen coords (0 at top).
              const y =
                size.height -
                (t.urgency / AXIS_MAX) * size.height -
                DOT_SIZE / 2;
              const color = PRIORITY_COLORS[priorityLevelFromScore(t.priority_score)];
              const isActive = activeId === t.task_id;

              return (
                <Pressable
                  key={t.task_id}
                  onPress={() => {
                    setActiveId(t.task_id);
                    onTaskPress?.(t.task_id);
                  }}
                  style={[
                    styles.dot,
                    {
                      left: x,
                      top: y,
                      backgroundColor: color,
                      borderColor: isActive ? '#0f172a' : '#fff',
                    },
                  ]}
                >
                  {isActive ? (
                    <View style={styles.tooltip}>
                      <Text style={styles.tooltipText} numberOfLines={1}>
                        {t.name}
                      </Text>
                      <Text style={styles.tooltipMeta}>
                        i {t.importance.toFixed(1)} · u {t.urgency.toFixed(1)} ·
                        {' '}p {t.priority_score.toFixed(1)}
                      </Text>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
        </View>
      </View>

      <XTicks />
      <Text style={[styles.axisLabelText, styles.xAxisLabel]}>Importance →</Text>

      <Legend />
    </View>
  );
}

function Grid() {
  // 4 inner gridlines per axis (at 2/4/6/8) — purely cosmetic.
  return (
    <>
      {[20, 40, 60, 80].map((pct) => (
        <View
          key={`v-${pct}`}
          style={[styles.gridLineV, { left: `${pct}%` }]}
        />
      ))}
      {[20, 40, 60, 80].map((pct) => (
        <View
          key={`h-${pct}`}
          style={[styles.gridLineH, { top: `${pct}%` }]}
        />
      ))}
      {/* "high importance + high urgency" highlight zone (top-right quadrant). */}
      <View style={styles.hotZone} />
    </>
  );
}

function YTicks() {
  return (
    <View style={styles.yTicks}>
      {[10, 8, 6, 4, 2, 0].map((v) => (
        <Text key={v} style={styles.tickText}>
          {v}
        </Text>
      ))}
    </View>
  );
}

function XTicks() {
  return (
    <View style={styles.xTicks}>
      {[0, 2, 4, 6, 8, 10].map((v) => (
        <Text key={v} style={styles.tickText}>
          {v}
        </Text>
      ))}
    </View>
  );
}

function Legend() {
  return (
    <View style={styles.legend}>
      {(['low', 'medium', 'high', 'critical'] as const).map((lvl) => (
        <View key={lvl} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: PRIORITY_COLORS[lvl] }]} />
          <Text style={styles.legendText}>{lvl}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { padding: PADDING / 2 },
  yAxisLabel: { marginLeft: 24, marginBottom: 4 },
  plotRow: { flexDirection: 'row' },
  yTicks: {
    width: 24,
    justifyContent: 'space-between',
    paddingVertical: 0,
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  plotArea: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'visible',
  },
  gridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#e2e8f0',
  },
  gridLineH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  hotZone: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: '50%',
    height: '50%',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
    shadowColor: '#0f172a',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  tooltip: {
    position: 'absolute',
    bottom: DOT_SIZE + 6,
    left: -60,
    width: 140,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#0f172a',
    borderRadius: 6,
  },
  tooltipText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  tooltipMeta: { color: '#cbd5e1', fontSize: 10, marginTop: 2 },
  xTicks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginLeft: 24,
  },
  tickText: { fontSize: 10, color: '#64748b' },
  axisLabelText: { fontSize: 12, color: '#475569', fontWeight: '600' },
  xAxisLabel: { marginLeft: 24, marginTop: 2, alignSelf: 'flex-end' },
  legend: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#334155' },
});

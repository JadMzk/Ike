import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import type { Quadrant, TaskCoordinates } from '../types/task';
import { QUADRANT_LABELS, isQuadrantEmphasized } from '../utils/landscape';
import { PRIORITY_COLORS, priorityLevelFromScore } from '../utils/priority';

interface Props {
  tasks: TaskCoordinates[];
  onTaskPress?: (taskId: number) => void;
  motivationScore?: number | null;
}

const AXIS_MAX = 10;
const DOT_SIZE = 18;
const PADDING = 24;
const ANIM_MS = 400;

type DotState = {
  position: Animated.ValueXY;
  appear: Animated.Value;
};

/**
 * Dynamic task landscape plot.
 *  - x-axis = effort (0 → 10)
 *  - y-axis = priority (0 → 10, normalized from priority_score)
 */
export function PriorityLandscape({
  tasks,
  onTaskPress,
  motivationScore = null,
}: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [activeId, setActiveId] = useState<number | null>(null);
  // Bumped after dots are created in useEffect so the first paint includes them.
  const [renderTick, setRenderTick] = useState(0);

  const dotsRef = useRef<Map<number, DotState>>(new Map());

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.width || height !== size.height) {
      setSize({ width, height });
    }
  };

  const ready = size.width > 0 && size.height > 0;

  useEffect(() => {
    if (!ready) return;

    const seen = new Set<number>();
    const animations: Animated.CompositeAnimation[] = [];
    let createdNew = false;

    for (const t of tasks) {
      seen.add(t.task_id);
      const target = toPixel(t, size.width, size.height);
      let dot = dotsRef.current.get(t.task_id);

      if (!dot) {
        createdNew = true;
        dot = {
          position: new Animated.ValueXY(target),
          appear: new Animated.Value(0),
        };
        dotsRef.current.set(t.task_id, dot);
        animations.push(
          Animated.spring(dot.appear, {
            toValue: 1,
            useNativeDriver: true,
            friction: 6,
            tension: 80,
          }),
        );
      } else {
        animations.push(
          Animated.timing(dot.position, {
            toValue: target,
            duration: ANIM_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        );
      }
    }

    for (const id of Array.from(dotsRef.current.keys())) {
      if (!seen.has(id)) dotsRef.current.delete(id);
    }

    if (animations.length > 0) {
      Animated.parallel(animations).start();
    }

    const missingDot = tasks.some((t) => !dotsRef.current.has(t.task_id));
    if (createdNew || missingDot) {
      setRenderTick((n) => n + 1);
    }
  }, [tasks, size.width, size.height, ready]);

  // renderTick is intentionally read so React re-renders after dot init.
  void renderTick;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.chartTitle}>Dynamic task landscape</Text>

      <View style={styles.yAxisLabel}>
        <Text style={styles.axisLabelText}>Priority ↑</Text>
      </View>

      <View style={styles.plotRow}>
        <YTicks />

        <View style={styles.plotArea} onLayout={handleLayout}>
          <Grid emphasizedQuadrants={getEmphasizedZones(motivationScore)} />

          {ready &&
            tasks.map((t) => {
              const dot = dotsRef.current.get(t.task_id);
              if (!dot) return null;

              const color =
                PRIORITY_COLORS[priorityLevelFromScore(t.priority_score)];
              const isActive = activeId === t.task_id;
              const highlighted = isQuadrantEmphasized(
                t.quadrant,
                motivationScore ?? null,
              );

              return (
                <Animated.View
                  key={t.task_id}
                  pointerEvents="box-none"
                  style={[
                    styles.dotAnchor,
                    {
                      transform: [
                        { translateX: dot.position.x },
                        { translateY: dot.position.y },
                        { scale: dot.appear },
                      ],
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => {
                      setActiveId(t.task_id);
                      onTaskPress?.(t.task_id);
                    }}
                    style={styles.dotPressable}
                  >
                    <QuadrantDot
                      quadrant={t.quadrant}
                      color={color}
                      borderColor={
                        isActive
                          ? '#0f172a'
                          : highlighted
                            ? '#f59e0b'
                            : '#fff'
                      }
                      borderWidth={highlighted ? 3 : 2}
                    />
                    {isActive ? (
                      <View style={styles.tooltip}>
                        <Text style={styles.tooltipText} numberOfLines={1}>
                          {t.name}
                        </Text>
                        <Text style={styles.tooltipMeta}>
                          {QUADRANT_LABELS[t.quadrant]} · e {t.effort.toFixed(1)}{' '}
                          · p {t.priority.toFixed(1)}
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                </Animated.View>
              );
            })}
        </View>
      </View>

      <XTicks />
      <Text style={[styles.axisLabelText, styles.xAxisLabel]}>
        Low effort → High effort
      </Text>

      <QuadrantLegend motivationScore={motivationScore ?? null} />
      <Legend />
    </View>
  );
}

function getEmphasizedZones(
  motivationScore: number | null,
): Quadrant[] {
  if (motivationScore === null) return [];
  if (motivationScore <= 4) return ['QuickWins'];
  if (motivationScore >= 8) return ['BigRock'];
  return [];
}

function toPixel(
  t: TaskCoordinates,
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: (t.effort / AXIS_MAX) * width - DOT_SIZE / 2,
    y: height - (t.priority / AXIS_MAX) * height - DOT_SIZE / 2,
  };
}

function Grid({ emphasizedQuadrants }: { emphasizedQuadrants: Quadrant[] }) {
  const showQuickWins = emphasizedQuadrants.includes('QuickWins');
  const showBigRock = emphasizedQuadrants.includes('BigRock');

  return (
    <>
      {[20, 40, 60, 80].map((pct) => (
        <View key={`v-${pct}`} style={[styles.gridLineV, { left: `${pct}%` }]} />
      ))}
      {[20, 40, 60, 80].map((pct) => (
        <View key={`h-${pct}`} style={[styles.gridLineH, { top: `${pct}%` }]} />
      ))}
      {showQuickWins ? <View style={styles.zoneQuickWins} /> : null}
      {showBigRock ? <View style={styles.zoneBigRock} /> : null}
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

function QuadrantLegend({
  motivationScore,
}: {
  motivationScore: number | null;
}) {
  const entries: Quadrant[] = [
    'BigRock',
    'QuickWins',
    'NiceToDo',
    'PostponeDelegate',
  ];
  return (
    <View style={styles.quadrantLegend}>
      {entries.map((q) => {
        const emphasized = isQuadrantEmphasized(q, motivationScore);
        return (
          <View key={q} style={styles.quadrantLegendItem}>
            <QuadrantDot
              quadrant={q}
              color="#94a3b8"
              borderColor="#64748b"
              borderWidth={1}
              size={12}
            />
            <Text
              style={[styles.quadrantLabel, emphasized && styles.quadrantEmphasis]}
            >
              {QUADRANT_LABELS[q]}
              {emphasized ? ' ★' : ''}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function QuadrantDot({
  quadrant,
  color,
  borderColor,
  borderWidth,
  size = DOT_SIZE,
}: {
  quadrant: Quadrant;
  color: string;
  borderColor: string;
  borderWidth: number;
  size?: number;
}) {
  const borderStyle = { borderColor, borderWidth };

  if (quadrant === 'QuickWins') {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
          borderStyle,
        ]}
      />
    );
  }

  if (quadrant === 'BigRock') {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: 2,
            backgroundColor: color,
          },
          borderStyle,
        ]}
      />
    );
  }

  if (quadrant === 'PostponeDelegate') {
    const inner = size * 0.72;
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={[
            {
              width: inner,
              height: inner,
              backgroundColor: color,
              transform: [{ rotate: '45deg' }],
            },
            borderStyle,
          ]}
        />
      </View>
    );
  }

  // Nice to do — triangle
  const half = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: half,
          borderRightWidth: half,
          borderBottomWidth: size,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        }}
      />
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
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    marginLeft: 24,
  },
  yAxisLabel: { marginLeft: 24, marginBottom: 4 },
  plotRow: { flexDirection: 'row' },
  yTicks: {
    width: 24,
    justifyContent: 'space-between',
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
  zoneQuickWins: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '50%',
    height: '50%',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
  },
  zoneBigRock: {
    position: 'absolute',
    left: '50%',
    top: 0,
    width: '50%',
    height: '50%',
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  dotAnchor: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: DOT_SIZE,
    height: DOT_SIZE,
  },
  dotPressable: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  quadrantLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tooltip: {
    position: 'absolute',
    bottom: DOT_SIZE + 6,
    left: -60,
    width: 160,
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
  xAxisLabel: { marginLeft: 24, marginTop: 2 },
  quadrantLegend: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginLeft: 24,
  },
  quadrantLabel: { fontSize: 11, color: '#64748b' },
  quadrantEmphasis: { color: '#0f172a', fontWeight: '700' },
  legend: {
    marginTop: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: '#334155' },
});

import type { PriorityLevel } from '../types/task';

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

/**
 * Mirrors `TaskService.get_priority_level` on the backend.
 * Used for plan dots, since `TaskCoordinates` carries `priority_score`
 * but not `priority_level`.
 */
export function priorityLevelFromScore(score: number): PriorityLevel {
  if (score < 25) return 'low';
  if (score < 50) return 'medium';
  if (score < 75) return 'high';
  return 'critical';
}

import type { Quadrant, Task, TaskCoordinates } from '../types/task';

const MS_PER_DAY = 86_400_000;
const URGENCY_AXIS_MAX = 10;
const QUADRANT_AXIS_THRESHOLD = 5; // mirrors EisenhowerService._AXIS_THRESHOLD

/**
 * Mirrors `TaskService.compute_current_urgency` on the backend, with an
 * extra `projectionDays` offset for the "+7d / +30d / Custom" preview.
 *
 *   projectedUrgency = min(10,
 *     initialUrgency + urgencyGrowthRate * (daysElapsed + projectionDays))
 *
 * `now` is injectable for tests; defaults to the real wall clock.
 */
export function projectedUrgency(
  task: Pick<
    Task,
    'initial_urgency_score' | 'urgency_growth_rate' | 'created_at'
  >,
  projectionDays: number = 0,
  now: Date = new Date(),
): number {
  const created = new Date(task.created_at).getTime();
  const elapsedDays = Math.max(0, (now.getTime() - created) / MS_PER_DAY);
  const total =
    task.initial_urgency_score +
    task.urgency_growth_rate * (elapsedDays + projectionDays);
  return Math.min(URGENCY_AXIS_MAX, Math.max(0, total));
}

/**
 * Build the (importance, urgency, score) coordinate for a task at a given
 * projection horizon. Used by the priority-plan plot.
 */
export function projectedCoordinates(
  task: Task,
  projectionDays: number = 0,
  now: Date = new Date(),
): TaskCoordinates {
  const urgency = projectedUrgency(task, projectionDays, now);
  const score = task.importance_score * urgency;
  return {
    task_id: task.id,
    name: task.name,
    importance: task.importance_score,
    urgency,
    priority_score: score,
    quadrant: classifyQuadrant(task.importance_score, urgency),
  };
}

function classifyQuadrant(importance: number, urgency: number): Quadrant {
  const important = importance >= QUADRANT_AXIS_THRESHOLD;
  const urgent = urgency >= QUADRANT_AXIS_THRESHOLD;
  if (urgent && important) return 'Do';
  if (!urgent && important) return 'Schedule';
  if (urgent && !important) return 'Delegate';
  return 'Eliminate';
}

import type { Quadrant, Task, TaskCoordinates } from '../types/task';
import { classifyQuadrant } from './landscape';

const MS_PER_DAY = 86_400_000;
const AXIS_MAX = 10;

/**
 * Mirrors backend TaskService.compute_current_urgency with projection offset.
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
  return Math.min(AXIS_MAX, Math.max(0, total));
}

/**
 * Infer effective category resistance from API-computed current_effort
 * (resistance is not exposed to clients).
 */
function impliedResistance(
  task: Pick<Task, 'initial_effort' | 'current_effort' | 'created_at'>,
  now: Date = new Date(),
): number {
  const created = new Date(task.created_at).getTime();
  const elapsedDays = Math.max(0, (now.getTime() - created) / MS_PER_DAY);
  const sqrtDays = Math.sqrt(elapsedDays);
  if (sqrtDays < 1e-9) {
    return 0;
  }
  return Math.max(0, (task.current_effort - task.initial_effort) / sqrtDays);
}

/**
 * Mirrors backend TaskService.compute_current_effort with projection offset.
 */
export function projectedEffort(
  task: Pick<Task, 'initial_effort' | 'current_effort' | 'created_at'>,
  projectionDays: number = 0,
  now: Date = new Date(),
): number {
  const created = new Date(task.created_at).getTime();
  const elapsedDays = Math.max(0, (now.getTime() - created) / MS_PER_DAY);
  const totalDays = elapsedDays + projectionDays;
  const resistance = impliedResistance(task, now);
  const effort =
    task.initial_effort + resistance * Math.sqrt(Math.max(0, totalDays));
  return Math.min(AXIS_MAX, Math.max(0, effort));
}

export function normalizePriority(priorityScore: number): number {
  return Math.min(AXIS_MAX, priorityScore / 10);
}

/**
 * Build landscape coordinates for a task at a given projection horizon.
 */
export function projectedCoordinates(
  task: Task,
  projectionDays: number = 0,
  now: Date = new Date(),
): TaskCoordinates {
  const urgency = projectedUrgency(task, projectionDays, now);
  const effort = projectedEffort(task, projectionDays, now);
  const score = task.importance_score * urgency;
  const priority = normalizePriority(score);
  return {
    task_id: task.id,
    name: task.name,
    category: task.category,
    effort,
    priority,
    current_urgency: urgency,
    priority_score: score,
    quadrant: classifyQuadrant(effort, priority),
  };
}

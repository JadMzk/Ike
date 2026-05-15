export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

export type Quadrant =
  | 'BigRock'
  | 'QuickWins'
  | 'NiceToDo'
  | 'PostponeDelegate';

export const TASK_CATEGORIES = [
  'admin',
  'work',
  'study',
  'sport',
  'personal',
  'health',
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export interface Task {
  id: number;
  user_id: number;
  name: string;
  category: string;
  importance_score: number;
  initial_urgency_score: number;
  urgency_growth_rate: number;
  initial_effort: number;
  resistance_factor: number;
  created_at: string;
  completed: boolean;
  completed_at: string | null;
  current_urgency: number;
  current_effort: number;
  priority_score: number;
  priority_level: PriorityLevel;
}

export interface CreateTaskPayload {
  name: string;
  category: string;
  importance_score: number;
  initial_urgency_score: number;
  urgency_growth_rate: number;
  initial_effort: number;
  resistance_factor: number;
}

export interface UpdateTaskPayload {
  name?: string;
  category?: string;
  importance_score?: number;
  initial_urgency_score?: number;
  urgency_growth_rate?: number;
  initial_effort?: number;
  resistance_factor?: number;
}

export interface TaskCoordinates {
  task_id: number;
  name: string;
  category: string;
  effort: number;
  priority: number;
  current_urgency: number;
  priority_score: number;
  quadrant: Quadrant;
}

export interface PriorityLandscape {
  user_id: number;
  quadrants: Record<Quadrant, TaskCoordinates[]>;
  recommendations: TaskCoordinates[];
  motivation_message?: string | null;
}

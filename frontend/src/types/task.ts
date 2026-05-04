export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';

// Backend uses Eisenhower-style quadrant labels. The frontend keeps the same
// strings so we can pass through what the API returns without translation,
// even though the screen / component names use "PriorityPlan".
export type Quadrant = 'Do' | 'Schedule' | 'Delegate' | 'Eliminate';

export interface Task {
  id: number;
  user_id: number;
  name: string;
  importance_score: number;
  initial_urgency_score: number;
  urgency_growth_rate: number;
  created_at: string;
  current_urgency: number;
  priority_score: number;
  priority_level: PriorityLevel;
}

export interface CreateTaskPayload {
  name: string;
  importance_score: number;
  initial_urgency_score: number;
  urgency_growth_rate: number;
}

export interface UpdateTaskPayload {
  name?: string;
  importance_score?: number;
  initial_urgency_score?: number;
  urgency_growth_rate?: number;
}

export interface TaskCoordinates {
  task_id: number;
  name: string;
  importance: number;
  urgency: number;
  priority_score: number;
  quadrant: Quadrant;
}

export interface PriorityPlan {
  user_id: number;
  quadrants: Record<Quadrant, TaskCoordinates[]>;
  recommendations: TaskCoordinates[];
}

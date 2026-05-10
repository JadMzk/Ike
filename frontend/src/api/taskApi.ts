import { api } from './client';
import type {
  CreateTaskPayload,
  PriorityPlan,
  Task,
  UpdateTaskPayload,
} from '../types/task';

export const taskApi = {
  // Backend signature: POST /tasks?user_id={id} (body = task fields).
  // TODO(auth): drop the user_id query param once the backend reads
  // the current user from the JWT instead.
  async create(userId: number, payload: CreateTaskPayload): Promise<Task> {
    const { data } = await api.post<Task>('/tasks', payload, {
      params: { user_id: userId },
    });
    return data;
  },

  async getById(taskId: number): Promise<Task> {
    const { data } = await api.get<Task>(`/tasks/${taskId}`);
    return data;
  },

  async listByUser(userId: number): Promise<Task[]> {
    const { data } = await api.get<Task[]>(`/users/${userId}/tasks`);
    return data;
  },

  async update(taskId: number, payload: UpdateTaskPayload): Promise<Task> {
    const { data } = await api.patch<Task>(`/tasks/${taskId}`, payload);
    return data;
  },

  async markDone(taskId: number): Promise<Task> {
    const { data } = await api.patch<Task>(`/tasks/${taskId}/complete`);
    return data;
  },

  async remove(taskId: number): Promise<void> {
    await api.delete(`/tasks/${taskId}`);
  },

  // Endpoint is /eisenhower-plan on the backend; we expose it as the
  // "priority plan" everywhere on the frontend.
  async getPriorityPlan(userId: number): Promise<PriorityPlan> {
    const { data } = await api.get<PriorityPlan>(
      `/users/${userId}/eisenhower-plan`,
    );
    return data;
  },
};

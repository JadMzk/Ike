import { api } from './client';
import type {
  CreateTaskPayload,
  PriorityLandscape,
  Task,
  UpdateTaskPayload,
} from '../types/task';

export const taskApi = {
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

  async getPriorityLandscape(
    userId: number,
    motivationScore?: number,
  ): Promise<PriorityLandscape> {
    const { data } = await api.get<PriorityLandscape>(
      `/users/${userId}/priority-landscape`,
      {
        params:
          motivationScore != null
            ? { motivation_score: motivationScore }
            : undefined,
      },
    );
    return data;
  },
};

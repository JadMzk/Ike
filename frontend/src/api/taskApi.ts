import { api } from './client';
import type {
  CreateTaskPayload,
  PriorityLandscape,
  Task,
  UpdateTaskPayload,
} from '../types/task';

export const taskApi = {
  async create(payload: CreateTaskPayload): Promise<Task> {
    const { data } = await api.post<Task>('/me/tasks', payload);
    return data;
  },

  async getById(taskId: number): Promise<Task> {
    const { data } = await api.get<Task>(`/tasks/${taskId}`);
    return data;
  },

  async listMine(): Promise<Task[]> {
    const { data } = await api.get<Task[]>('/me/tasks');
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

  async getPriorityLandscape(motivationScore?: number): Promise<PriorityLandscape> {
    const { data } = await api.get<PriorityLandscape>('/me/priority-landscape', {
      params:
        motivationScore != null
          ? { motivation_score: motivationScore }
          : undefined,
    });
    return data;
  },
};

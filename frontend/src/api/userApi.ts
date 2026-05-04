import { api } from './client';
import type { CreateUserPayload, User } from '../types/user';

export const userApi = {
  async create(payload: CreateUserPayload): Promise<User> {
    const { data } = await api.post<User>('/users', payload);
    return data;
  },

  async getById(userId: number): Promise<User> {
    const { data } = await api.get<User>(`/users/${userId}`);
    return data;
  },
};

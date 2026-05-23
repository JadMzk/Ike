import { api } from './client';
import type { AuthSyncResponse, Profile } from '../types/profile';

export const authApi = {
  async sync(): Promise<AuthSyncResponse> {
    const { data } = await api.post<AuthSyncResponse>('/auth/sync');
    return data;
  },

  async getMe(): Promise<Profile> {
    const { data } = await api.get<Profile>('/auth/me');
    return data;
  },
};

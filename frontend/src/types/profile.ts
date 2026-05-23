export interface Profile {
  id: string;
  created_at: string;
  onboarding_completed: boolean;
  plan_type: string;
}

export interface AuthSyncResponse {
  profile: Profile;
  created: boolean;
}

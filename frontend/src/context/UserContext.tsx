import React, { createContext, useContext, useMemo, useState } from 'react';

/**
 * MVP user-switching context.
 *
 * TODO(auth): replace this with a real auth context once the backend has
 * login + JWT. The selected user should then come from the decoded token
 * rather than a manual selector.
 */
interface UserContextValue {
  selectedUserId: number;
  availableUserIds: number[];
  setSelectedUserId: (id: number) => void;
}

const AVAILABLE_USER_IDS = [1, 2];

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [selectedUserId, setSelectedUserId] = useState<number>(
    AVAILABLE_USER_IDS[0],
  );

  const value = useMemo<UserContextValue>(
    () => ({
      selectedUserId,
      setSelectedUserId,
      availableUserIds: AVAILABLE_USER_IDS,
    }),
    [selectedUserId],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useSelectedUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useSelectedUser must be used inside <UserProvider>');
  }
  return ctx;
}

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

interface MotivationContextValue {
  /** 1–10 daily energy score; null until the user answers the prompt. */
  motivationScore: number | null;
  /** True once the user has submitted (or skipped) today's check-in this session. */
  hasCheckedInToday: boolean;
  setMotivationScore: (score: number) => void;
  skipCheckIn: () => void;
}

const MotivationContext = createContext<MotivationContextValue | undefined>(
  undefined,
);

export function MotivationProvider({ children }: { children: React.ReactNode }) {
  const [motivationScore, setScore] = useState<number | null>(null);
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  const setMotivationScore = useCallback((score: number) => {
    setScore(Math.min(10, Math.max(1, Math.round(score))));
    setHasCheckedInToday(true);
  }, []);

  const skipCheckIn = useCallback(() => {
    setHasCheckedInToday(true);
  }, []);

  const value = useMemo(
    () => ({
      motivationScore,
      hasCheckedInToday,
      setMotivationScore,
      skipCheckIn,
    }),
    [motivationScore, hasCheckedInToday, setMotivationScore, skipCheckIn],
  );

  return (
    <MotivationContext.Provider value={value}>
      {children}
    </MotivationContext.Provider>
  );
}

export function useMotivation(): MotivationContextValue {
  const ctx = useContext(MotivationContext);
  if (!ctx) {
    throw new Error('useMotivation must be used within MotivationProvider');
  }
  return ctx;
}

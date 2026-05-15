import type { Quadrant, TaskCoordinates } from '../types/task';

const AXIS_THRESHOLD = 5;
const DEFAULT_LIMIT = 5;

/** Pure 2×2 matrix — mirrors PriorityLandscapeService.classify_quadrant. */
export function classifyQuadrant(effort: number, priority: number): Quadrant {
  const highPri = priority >= AXIS_THRESHOLD;
  const highEff = effort >= AXIS_THRESHOLD;
  if (highPri && highEff) return 'BigRock';
  if (highPri && !highEff) return 'QuickWins';
  if (!highPri && !highEff) return 'NiceToDo';
  return 'PostponeDelegate';
}

export const QUADRANT_LABELS: Record<Quadrant, string> = {
  BigRock: 'Big rock',
  QuickWins: 'Quick wins',
  NiceToDo: 'Nice to do',
  PostponeDelegate: 'Postpone-delegate',
};

export function adaptRecommendationsToMotivation(
  coords: TaskCoordinates[],
  motivationScore: number | null,
  limit: number = DEFAULT_LIMIT,
): TaskCoordinates[] {
  if (motivationScore === null) {
    return [...coords]
      .sort((a, b) => b.priority_score - a.priority_score)
      .slice(0, limit);
  }

  let emphasize: Quadrant;
  if (motivationScore <= 4) {
    emphasize = 'QuickWins';
  } else if (motivationScore >= 8) {
    emphasize = 'BigRock';
  } else {
    return [...coords]
      .sort((a, b) => b.priority_score - a.priority_score)
      .slice(0, limit);
  }

  const preferred = coords
    .filter((c) => c.quadrant === emphasize)
    .sort((a, b) => b.priority_score - a.priority_score);
  const others = coords
    .filter((c) => c.quadrant !== emphasize)
    .sort((a, b) => b.priority_score - a.priority_score);
  return [...preferred, ...others].slice(0, limit);
}

export function motivationMessage(motivationScore: number | null): string | null {
  if (motivationScore === null) return null;
  if (motivationScore <= 4) return 'Today is a good day for quick wins';
  if (motivationScore >= 8) return 'You seem motivated today — tackle a big rock';
  return 'Balance quick wins with one meaningful task';
}

export function isQuadrantEmphasized(
  quadrant: Quadrant,
  motivationScore: number | null,
): boolean {
  if (motivationScore === null) return false;
  if (motivationScore <= 4) return quadrant === 'QuickWins';
  if (motivationScore >= 8) return quadrant === 'BigRock';
  return false;
}

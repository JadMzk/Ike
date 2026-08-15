/** Human-readable labels for 0–10 scores (frontend display only). */

export type LevelBand = 'low' | 'medium' | 'high';

export function levelBand(value: number): LevelBand {
  if (value < 4) return 'low';
  if (value < 7) return 'medium';
  return 'high';
}

export function urgencyLabel(value: number): string {
  switch (levelBand(value)) {
    case 'low':
      return 'Low urgency';
    case 'medium':
      return 'Medium urgency';
    case 'high':
      return 'High urgency';
  }
}

export function effortLabel(value: number): string {
  switch (levelBand(value)) {
    case 'low':
      return 'Light effort';
    case 'medium':
      return 'Medium effort';
    case 'high':
      return 'Heavy effort';
  }
}

export function importanceLabel(value: number): string {
  switch (levelBand(value)) {
    case 'low':
      return 'Nice to have';
    case 'medium':
      return 'Important';
    case 'high':
      return 'Critical';
  }
}

/** Default urgency growth sent to API — hidden from the UI. */
export const DEFAULT_URGENCY_GROWTH = 0.1;

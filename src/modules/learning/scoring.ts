// Pure scoring helpers — testáveis sem DB.
// Regras canônicas: docs/GAMIFICATION.md

export function xpForCorrect(difficulty: number): number {
  if (difficulty <= 1) return 5;
  if (difficulty <= 3) return 10;
  return 15;
}

export const LESSON_COMPLETE_BONUS = 20;

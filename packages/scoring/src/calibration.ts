export function brierScore(predictions: ReadonlyArray<{ probability: number; outcome: 0 | 1 }>): number {
  if (predictions.length === 0) return 0;
  const sum = predictions.reduce((acc, { probability, outcome }) => {
    return acc + Math.pow(probability - outcome, 2);
  }, 0);
  return sum / predictions.length;
}

export function calibrationScore(brierScoreValue: number): number {
  // Maps Brier score (0 = perfect, 0.25 = random, 0.5 = worst) to a 0–100 display score.
  // Anything worse than random (0.25) scores below zero; we clamp to 0.
  const raw = (1 - brierScoreValue / 0.25) * 100;
  return Math.max(0, Math.round(raw));
}

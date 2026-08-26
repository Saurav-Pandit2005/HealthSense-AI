/**
 * Calculates a 0-100 "Health Score" from whatever data is available —
 * today's tracker log plus the user's BMI. Only factors with actual data
 * are included, and the result is rescaled to 100 based on the factors
 * that ARE present (so a user who hasn't logged blood pressure yet still
 * gets a fair score from what they have logged).
 *
 * Returns null if there's nothing to score yet (no log, no BMI).
 */
function calculateHealthScore(log, bmi) {
  const factors = [];

  if (log && log.steps !== undefined && log.steps !== null) {
    factors.push({ name: "steps", weight: 20, score: Math.min(1, log.steps / 10000) });
  }
  if (log && log.sleepHours !== undefined && log.sleepHours !== null) {
    factors.push({ name: "sleep", weight: 15, score: Math.min(1, log.sleepHours / 8) });
  }
  if (log && log.waterIntakeL !== undefined && log.waterIntakeL !== null) {
    factors.push({ name: "hydration", weight: 10, score: Math.min(1, log.waterIntakeL / 2.5) });
  }
  if (log && log.exerciseMinutes !== undefined && log.exerciseMinutes !== null) {
    factors.push({ name: "exercise", weight: 15, score: Math.min(1, log.exerciseMinutes / 45) });
  }
  if (log && log.heartRate !== undefined && log.heartRate !== null) {
    const hr = log.heartRate;
    const distanceFromIdeal = hr < 60 ? 60 - hr : hr > 80 ? hr - 80 : 0;
    factors.push({ name: "heartRate", weight: 15, score: Math.max(0, 1 - distanceFromIdeal / 40) });
  }
  if (log && log.bp_systolic !== undefined && log.bp_diastolic !== undefined && log.bp_systolic !== null) {
    const { bp_systolic: s, bp_diastolic: d } = log;
    let score;
    if (s < 120 && d < 80) score = 1;
    else if (s < 130 && d < 80) score = 0.8;
    else if (s < 140 || d < 90) score = 0.5;
    else score = 0.2;
    factors.push({ name: "bloodPressure", weight: 15, score });
  }
  if (bmi !== undefined && bmi !== null) {
    let score;
    if (bmi >= 18.5 && bmi < 25) score = 1;
    else if (bmi < 18.5 || (bmi >= 25 && bmi < 30)) score = 0.6;
    else score = 0.3;
    factors.push({ name: "bmi", weight: 10, score });
  }

  if (factors.length === 0) return null;

  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  const earned = factors.reduce((sum, f) => sum + f.weight * f.score, 0);
  const healthScore = Math.round((earned / totalWeight) * 100);

  const breakdown = factors.map((f) => ({
    factor: f.name,
    score: Math.round(f.score * 100),
  }));

  return { healthScore, breakdown };
}

module.exports = calculateHealthScore;

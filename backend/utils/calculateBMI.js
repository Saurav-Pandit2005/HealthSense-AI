/**
 * Calculates BMI and its category from height (cm) and weight (kg).
 * Used by the profile module now, and will be reused by the Dashboard
 * module later — keeping it here avoids duplicating the formula.
 */
function calculateBMI(heightCm, weightKg) {
  if (!heightCm || !weightKg) return null;

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const rounded = Math.round(bmi * 10) / 10;

  let category;
  if (rounded < 18.5) category = "Underweight";
  else if (rounded < 25) category = "Normal weight";
  else if (rounded < 30) category = "Overweight";
  else category = "Obesity";

  return { bmi: rounded, category };
}

module.exports = calculateBMI;

/**
 * Rule-based weekly workout plan generator (no ML — deliberately, per the
 * project scope). Templates are chosen by fitness goal, then lightly
 * adjusted for age (lower-impact suggestions for 55+) as a simple
 * personalization touch.
 */

const TEMPLATES = {
  lose_weight: [
    { day: "Monday", focus: "Cardio", activities: ["Brisk walk or jog — 30 min", "Core circuit — 10 min"], durationMinutes: 40 },
    { day: "Tuesday", focus: "Full Body Strength", activities: ["Squats, push-ups, rows — 3 sets x 12 reps"], durationMinutes: 35 },
    { day: "Wednesday", focus: "Active Recovery", activities: ["Light walk or yoga — 20-30 min"], durationMinutes: 25 },
    { day: "Thursday", focus: "HIIT", activities: ["20 min interval training (30s work / 30s rest)"], durationMinutes: 20 },
    { day: "Friday", focus: "Strength — Upper Body", activities: ["Push-ups, dumbbell rows, shoulder press — 3 sets x 12"], durationMinutes: 35 },
    { day: "Saturday", focus: "Cardio", activities: ["Cycling, swimming, or brisk walk — 40 min"], durationMinutes: 40 },
    { day: "Sunday", focus: "Rest", activities: ["Full rest or light stretching"], durationMinutes: 0 },
  ],
  gain_muscle: [
    { day: "Monday", focus: "Push (Chest, Shoulders, Triceps)", activities: ["Bench/push-ups, shoulder press, tricep dips — 4 sets x 8-10"], durationMinutes: 45 },
    { day: "Tuesday", focus: "Pull (Back, Biceps)", activities: ["Rows, pull-ups/lat pulldown, bicep curls — 4 sets x 8-10"], durationMinutes: 45 },
    { day: "Wednesday", focus: "Legs", activities: ["Squats, lunges, calf raises — 4 sets x 10-12"], durationMinutes: 45 },
    { day: "Thursday", focus: "Active Recovery", activities: ["Light cardio or mobility work — 20 min"], durationMinutes: 20 },
    { day: "Friday", focus: "Push (Chest, Shoulders, Triceps)", activities: ["Incline press, lateral raises, tricep extensions — 4 sets x 8-10"], durationMinutes: 45 },
    { day: "Saturday", focus: "Pull + Legs", activities: ["Deadlifts, rows, leg press — 4 sets x 8-10"], durationMinutes: 45 },
    { day: "Sunday", focus: "Rest", activities: ["Full rest — muscle recovery day"], durationMinutes: 0 },
  ],
  maintain: [
    { day: "Monday", focus: "Full Body Strength", activities: ["Compound lifts — moderate weight, 3 sets x 10"], durationMinutes: 35 },
    { day: "Tuesday", focus: "Cardio", activities: ["Jog, cycle, or swim — 30 min"], durationMinutes: 30 },
    { day: "Wednesday", focus: "Flexibility & Mobility", activities: ["Yoga or stretching routine — 25 min"], durationMinutes: 25 },
    { day: "Thursday", focus: "Full Body Strength", activities: ["Compound lifts — moderate weight, 3 sets x 10"], durationMinutes: 35 },
    { day: "Friday", focus: "Cardio", activities: ["Brisk walk or cycling — 30 min"], durationMinutes: 30 },
    { day: "Saturday", focus: "Light Activity", activities: ["Recreational sport, hiking, or a long walk"], durationMinutes: 45 },
    { day: "Sunday", focus: "Rest", activities: ["Full rest or gentle stretching"], durationMinutes: 0 },
  ],
  general_fitness: [
    { day: "Monday", focus: "Cardio", activities: ["Brisk walk or light jog — 25 min"], durationMinutes: 25 },
    { day: "Tuesday", focus: "Strength", activities: ["Bodyweight circuit — squats, push-ups, planks — 3 sets"], durationMinutes: 30 },
    { day: "Wednesday", focus: "Flexibility", activities: ["Stretching or beginner yoga — 20 min"], durationMinutes: 20 },
    { day: "Thursday", focus: "Cardio", activities: ["Cycling or swimming — 25 min"], durationMinutes: 25 },
    { day: "Friday", focus: "Strength", activities: ["Bodyweight circuit — lunges, rows, core — 3 sets"], durationMinutes: 30 },
    { day: "Saturday", focus: "Active Fun", activities: ["Any sport or recreational activity you enjoy"], durationMinutes: 40 },
    { day: "Sunday", focus: "Rest", activities: ["Full rest"], durationMinutes: 0 },
  ],
};

const GENERAL_TIPS = [
  "Warm up for 5 minutes before any workout and cool down/stretch afterward.",
  "Stay hydrated — drink water before, during, and after exercise.",
  "Progress gradually — increase intensity or reps by no more than ~10% per week.",
  "If you feel sharp pain (not normal muscle fatigue), stop and rest.",
];

/**
 * @param {{ fitnessGoal?: string, age?: number, smoking?: boolean }} profile
 */
function generateFitnessPlan(profile = {}) {
  const goal = TEMPLATES[profile.fitnessGoal] ? profile.fitnessGoal : "general_fitness";
  let weeklyPlan = TEMPLATES[goal].map((day) => ({ ...day, activities: [...day.activities] }));

  const notes = [...GENERAL_TIPS];

  // Simple age-based adjustment: swap high-impact HIIT for lower-impact cardio
  if (profile.age && profile.age >= 55) {
    weeklyPlan = weeklyPlan.map((day) => {
      if (day.focus === "HIIT") {
        return {
          ...day,
          focus: "Low-Impact Cardio",
          activities: ["Brisk walk, swimming, or stationary cycling — 25 min"],
          durationMinutes: 25,
        };
      }
      return day;
    });
    notes.push("Workouts adjusted for a lower-impact style. Consult a doctor before starting any new intense exercise routine.");
  }

  if (profile.smoking) {
    notes.push("As a smoker, ease into cardio intensity gradually and monitor your breathing closely during exercise.");
  }

  return { goal, weeklyPlan, notes };
}

module.exports = generateFitnessPlan;

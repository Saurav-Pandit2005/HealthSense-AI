/**
 * Rule-based meal plan generator (no ML, per project scope).
 * Uses the Mifflin-St Jeor BMR formula + a goal-based calorie adjustment,
 * then suggests meals filtered against the user's logged allergies.
 */

const GOAL_ADJUSTMENTS = {
  lose_weight: { calorieAdjustment: -500, macros: { protein: 35, carbs: 35, fat: 30 } },
  gain_muscle: { calorieAdjustment: 300, macros: { protein: 35, carbs: 40, fat: 25 } },
  maintain: { calorieAdjustment: 0, macros: { protein: 25, carbs: 45, fat: 30 } },
  general_fitness: { calorieAdjustment: -100, macros: { protein: 30, carbs: 40, fat: 30 } },
};

// Assumed light-to-moderate activity multiplier since this project doesn't
// separately track an activity level — noted explicitly in the response
// so it's transparent rather than silently assumed.
const ACTIVITY_MULTIPLIER = 1.45;

const MEAL_OPTIONS = {
  vegetarian: {
    breakfast: ["Oats with milk and banana", "Vegetable poha", "Paneer paratha with curd", "Idli with sambar"],
    lunch: ["Dal, brown rice, and mixed vegetable salad", "Paneer curry with roti and salad", "Rajma with rice and cucumber salad"],
    snack: ["Roasted chickpeas", "Mixed nuts and a piece of fruit", "Greek yogurt with honey"],
    dinner: ["Vegetable khichdi with curd", "Paneer stir-fry with roti", "Vegetable soup with whole-grain bread"],
  },
  vegan: {
    breakfast: ["Oats with almond milk and berries", "Vegetable upma", "Tofu scramble with toast"],
    lunch: ["Chickpea curry with brown rice", "Lentil salad with mixed greens", "Tofu stir-fry with quinoa"],
    snack: ["Roasted chickpeas", "Mixed nuts and fruit", "Hummus with carrot sticks"],
    dinner: ["Vegetable and lentil soup", "Tofu and vegetable stir-fry with rice", "Chickpea and vegetable curry"],
  },
  eggetarian: {
    breakfast: ["Boiled eggs with whole-grain toast", "Vegetable omelette", "Oats with milk and a boiled egg"],
    lunch: ["Egg curry with rice and salad", "Dal, rice, and a boiled egg", "Egg fried rice with vegetables"],
    snack: ["Boiled egg with a piece of fruit", "Mixed nuts", "Greek yogurt"],
    dinner: ["Egg bhurji with roti", "Vegetable soup with a boiled egg", "Omelette with whole-grain toast"],
  },
  non_vegetarian: {
    breakfast: ["Boiled eggs with whole-grain toast", "Grilled chicken sandwich", "Oats with milk and a boiled egg"],
    lunch: ["Grilled chicken with rice and salad", "Fish curry with brown rice", "Chicken and vegetable stir-fry"],
    snack: ["Boiled egg with fruit", "Mixed nuts", "Grilled chicken strips"],
    dinner: ["Grilled fish with steamed vegetables", "Chicken soup with whole-grain bread", "Chicken curry with roti"],
  },
};

const GENERAL_TIPS = [
  "Spread protein intake evenly across meals rather than in one large portion.",
  "Favor whole grains over refined/white flour where possible.",
  "Limit added sugar and fried/ultra-processed foods.",
  "Drink water before meals — it also helps with portion control.",
];

function calculateBMR(age, gender, heightCm, weightKg) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (gender === "male") return base + 5;
  if (gender === "female") return base - 161;
  return base - 78; // rough average offset for "other"
}

// Some allergens don't appear literally in dish names (e.g. "omelette" IS
// egg, but the word "egg" isn't in the string) — this maps an allergen to
// the extra keywords that imply its presence, so filtering catches those too.
const ALLERGEN_SYNONYMS = {
  egg: ["egg", "omelette", "omelet", "bhurji"],
  dairy: ["dairy", "milk", "paneer", "cheese", "curd", "yogurt", "cream", "ghee"],
  milk: ["milk", "paneer", "cheese", "curd", "yogurt", "cream", "ghee"],
  peanut: ["peanut", "groundnut"],
  peanuts: ["peanut", "groundnut"],
  nuts: ["nuts", "almond", "cashew", "walnut", "peanut"],
  wheat: ["wheat", "roti", "bread", "toast", "paratha", "poha"],
  gluten: ["wheat", "roti", "bread", "toast", "paratha"],
  fish: ["fish"],
  soy: ["soy", "tofu"],
};

// Removes any meal option that contains one of the user's allergy keywords
// (case-insensitive, including known synonyms — e.g. "egg" also matches
// "omelette"). Keeps a fallback note if everything in a category is filtered out.
function filterAllergies(options, allergies = []) {
  if (!allergies || allergies.length === 0) return options;

  const expandedKeywords = new Set();
  for (const allergy of allergies) {
    const key = allergy.toLowerCase().trim();
    expandedKeywords.add(key);
    (ALLERGEN_SYNONYMS[key] || []).forEach((syn) => expandedKeywords.add(syn));
  }

  const filtered = options.filter((opt) => {
    const lowerOpt = opt.toLowerCase();
    return ![...expandedKeywords].some((keyword) => lowerOpt.includes(keyword));
  });

  return filtered.length > 0 ? filtered : ["Consult a dietitian for options avoiding: " + allergies.join(", ")];
}

/**
 * @param {{ age:number, gender:string, height_cm:number, weight_kg:number,
 *           fitnessGoal?:string, allergies?:string[] }} profile
 * @param {string} preference - "vegetarian" | "vegan" | "eggetarian" | "non_vegetarian"
 */
function generateMealPlan(profile, preference = "vegetarian") {
  const goalKey = GOAL_ADJUSTMENTS[profile.fitnessGoal] ? profile.fitnessGoal : "maintain";
  const goalInfo = GOAL_ADJUSTMENTS[goalKey];

  const bmr = calculateBMR(profile.age, profile.gender, profile.height_cm, profile.weight_kg);
  const tdee = bmr * ACTIVITY_MULTIPLIER;
  const dailyCalories = Math.max(1200, Math.round(tdee + goalInfo.calorieAdjustment));

  const prefKey = MEAL_OPTIONS[preference] ? preference : "vegetarian";
  const rawMeals = MEAL_OPTIONS[prefKey];

  const meals = {};
  for (const mealType of Object.keys(rawMeals)) {
    meals[mealType] = filterAllergies(rawMeals[mealType], profile.allergies);
  }

  return {
    dailyCalories,
    macroSplit: goalInfo.macros,
    goal: goalKey,
    preference: prefKey,
    meals,
    tips: GENERAL_TIPS,
    assumptions: "Calorie target assumes a light-to-moderate activity level (no separate activity tracking in this app).",
  };
}

module.exports = generateMealPlan;

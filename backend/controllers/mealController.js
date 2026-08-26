const generateMealPlan = require("../utils/mealPlanGenerator");

const VALID_PREFERENCES = ["vegetarian", "vegan", "eggetarian", "non_vegetarian"];

// @route  GET /api/meal/plan?preference=vegetarian   (protected)
exports.getMealPlan = async (req, res) => {
  try {
    const user = req.user;

    if (!user.age || !user.gender || !user.height_cm || !user.weight_kg) {
      return res.status(400).json({
        message: "Please complete your health profile (age, gender, height, weight) before generating a meal plan.",
      });
    }

    const preference = VALID_PREFERENCES.includes(req.query.preference) ? req.query.preference : "vegetarian";

    const plan = generateMealPlan(
      {
        age: user.age,
        gender: user.gender,
        height_cm: user.height_cm,
        weight_kg: user.weight_kg,
        fitnessGoal: user.fitnessGoal,
        allergies: user.allergies,
      },
      preference
    );

    res.status(200).json({ plan });
  } catch (err) {
    res.status(500).json({ message: "Failed to generate meal plan", error: err.message });
  }
};

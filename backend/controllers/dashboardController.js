const User = require("../models/User");
const HealthLog = require("../models/HealthLog");
const calculateBMI = require("../utils/calculateBMI");
const calculateHealthScore = require("../utils/calculateHealthScore");

function todayString() {
  return new Date().toISOString().split("T")[0];
}

// @route  GET /api/dashboard/summary   (protected)
// One-stop endpoint for the dashboard: profile stats + today's log + health score.
exports.getSummary = async (req, res) => {
  try {
    const user = req.user; // already loaded by authMiddleware
    const bmiResult = calculateBMI(user.height_cm, user.weight_kg);

    const todayLog = await HealthLog.findOne({ user: user._id, date: todayString() });

    const scoreResult = calculateHealthScore(todayLog, bmiResult?.bmi ?? null);

    res.status(200).json({
      profile: {
        name: user.name,
        age: user.age,
        gender: user.gender,
        height_cm: user.height_cm,
        weight_kg: user.weight_kg,
        fitnessGoal: user.fitnessGoal,
        bmi: bmiResult?.bmi ?? null,
        bmiCategory: bmiResult?.category ?? null,
      },
      todayLog: todayLog || null,
      healthScore: scoreResult?.healthScore ?? null,
      healthScoreBreakdown: scoreResult?.breakdown ?? [],
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load dashboard summary", error: err.message });
  }
};

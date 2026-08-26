const generateFitnessPlan = require("../utils/fitnessPlanGenerator");

// @route  GET /api/fitness/plan   (protected)
exports.getFitnessPlan = async (req, res) => {
  try {
    const user = req.user;

    if (!user.fitnessGoal) {
      return res.status(400).json({
        message: "Please complete your health profile (with a fitness goal) before generating a plan.",
      });
    }

    const plan = generateFitnessPlan({
      fitnessGoal: user.fitnessGoal,
      age: user.age,
      smoking: user.smoking,
    });

    res.status(200).json({ plan });
  } catch (err) {
    res.status(500).json({ message: "Failed to generate fitness plan", error: err.message });
  }
};

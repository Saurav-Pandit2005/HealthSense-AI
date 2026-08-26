const User = require("../models/User");
const calculateBMI = require("../utils/calculateBMI");

const GENDER_OPTIONS = ["male", "female", "other"];
const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const FITNESS_GOAL_OPTIONS = ["lose_weight", "gain_muscle", "maintain", "general_fitness"];

function toSafeProfile(user) {
  const bmiResult = calculateBMI(user.height_cm, user.weight_kg);
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    age: user.age,
    gender: user.gender,
    height_cm: user.height_cm,
    weight_kg: user.weight_kg,
    bloodGroup: user.bloodGroup,
    allergies: user.allergies,
    medicalHistory: user.medicalHistory,
    smoking: user.smoking,
    alcohol: user.alcohol,
    fitnessGoal: user.fitnessGoal,
    profileCompleted: user.profileCompleted,
    bmi: bmiResult?.bmi ?? null,
    bmiCategory: bmiResult?.category ?? null,
  };
}

// @route  GET /api/profile   (protected)
exports.getProfile = async (req, res) => {
  // req.user is already the full user doc, attached by authMiddleware
  res.status(200).json({ profile: toSafeProfile(req.user) });
};

// @route  PUT /api/profile   (protected)
exports.updateProfile = async (req, res) => {
  try {
    const {
      age,
      gender,
      height_cm,
      weight_kg,
      bloodGroup,
      allergies,
      medicalHistory,
      smoking,
      alcohol,
      fitnessGoal,
    } = req.body;

    const errors = [];

    if (age === undefined || age === null || age === "") {
      errors.push("Age is required");
    } else if (typeof age !== "number" || age < 1 || age > 120) {
      errors.push("Age must be a number between 1 and 120");
    }

    if (!gender || !GENDER_OPTIONS.includes(gender)) {
      errors.push(`Gender must be one of: ${GENDER_OPTIONS.join(", ")}`);
    }

    if (!height_cm || typeof height_cm !== "number" || height_cm < 50 || height_cm > 260) {
      errors.push("Height must be a number between 50 and 260 cm");
    }

    if (!weight_kg || typeof weight_kg !== "number" || weight_kg < 2 || weight_kg > 400) {
      errors.push("Weight must be a number between 2 and 400 kg");
    }

    if (bloodGroup && !BLOOD_GROUP_OPTIONS.includes(bloodGroup)) {
      errors.push(`Blood group must be one of: ${BLOOD_GROUP_OPTIONS.join(", ")}`);
    }

    if (fitnessGoal && !FITNESS_GOAL_OPTIONS.includes(fitnessGoal)) {
      errors.push(`Fitness goal must be one of: ${FITNESS_GOAL_OPTIONS.join(", ")}`);
    }

    if (allergies !== undefined && !Array.isArray(allergies)) {
      errors.push("Allergies must be a list");
    }

    if (medicalHistory !== undefined && !Array.isArray(medicalHistory)) {
      errors.push("Medical history must be a list");
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    // Build update object with only the fields that were actually provided
    const update = {
      age,
      gender,
      height_cm,
      weight_kg,
      profileCompleted: true,
    };
    if (bloodGroup !== undefined) update.bloodGroup = bloodGroup;
    if (allergies !== undefined) update.allergies = allergies;
    if (medicalHistory !== undefined) update.medicalHistory = medicalHistory;
    if (smoking !== undefined) update.smoking = Boolean(smoking);
    if (alcohol !== undefined) update.alcohol = Boolean(alcohol);
    if (fitnessGoal !== undefined) update.fitnessGoal = fitnessGoal;

    const updatedUser = await User.findByIdAndUpdate(req.user._id, update, {
      new: true, // return the updated document
      runValidators: true, // still enforce schema-level constraints too
    });

    res.status(200).json({ profile: toSafeProfile(updatedUser) });
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
};

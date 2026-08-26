const HealthLog = require("../models/HealthLog");

const FIELDS = [
  "weight_kg",
  "bp_systolic",
  "bp_diastolic",
  "bloodSugar",
  "heartRate",
  "sleepHours",
  "waterIntakeL",
  "steps",
  "exerciseMinutes",
  "calories",
];

const RANGES = {
  weight_kg: [2, 400],
  bp_systolic: [60, 260],
  bp_diastolic: [30, 160],
  bloodSugar: [20, 600],
  heartRate: [25, 250],
  sleepHours: [0, 16],
  waterIntakeL: [0, 10],
  steps: [0, 60000],
  exerciseMinutes: [0, 600],
  calories: [0, 10000],
};

// Returns today's date as YYYY-MM-DD (local server date)
function todayString() {
  return new Date().toISOString().split("T")[0];
}

function validateFields(body) {
  const errors = [];
  for (const field of FIELDS) {
    const value = body[field];
    if (value === undefined || value === null || value === "") continue; // all fields optional per entry
    if (typeof value !== "number" || Number.isNaN(value)) {
      errors.push(`${field} must be a number`);
      continue;
    }
    const [min, max] = RANGES[field];
    if (value < min || value > max) {
      errors.push(`${field} must be between ${min} and ${max}`);
    }
  }
  return errors;
}

// @route  POST /api/tracker   (protected)
// Adds today's entry, or updates it if one already exists for today (upsert).
// Optionally accepts a "date" field (YYYY-MM-DD) to log/edit a past day.
exports.upsertLog = async (req, res) => {
  try {
    const errors = validateFields(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ message: "Validation failed", errors });
    }

    const date = req.body.date || todayString();
    const update = { user: req.user._id, date };
    for (const field of FIELDS) {
      if (req.body[field] !== undefined && req.body[field] !== "") {
        update[field] = req.body[field];
      }
    }

    const log = await HealthLog.findOneAndUpdate(
      { user: req.user._id, date },
      { $set: update },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ log });
  } catch (err) {
    res.status(500).json({ message: "Failed to save health log", error: err.message });
  }
};

// @route  GET /api/tracker/today   (protected)
exports.getToday = async (req, res) => {
  try {
    const log = await HealthLog.findOne({ user: req.user._id, date: todayString() });
    res.status(200).json({ log: log || null });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch today's log", error: err.message });
  }
};

// @route  GET /api/tracker/history?limit=30   (protected)
exports.getHistory = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 180); // cap at 180 days
    const logs = await HealthLog.find({ user: req.user._id })
      .sort({ date: 1 }) // oldest -> newest, ready for charting left-to-right
      .limit(limit);
    res.status(200).json({ logs });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch history", error: err.message });
  }
};

// @route  DELETE /api/tracker/:id   (protected)
exports.deleteLog = async (req, res) => {
  try {
    const log = await HealthLog.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!log) {
      return res.status(404).json({ message: "Log entry not found" });
    }
    res.status(200).json({ message: "Log deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete log", error: err.message });
  }
};

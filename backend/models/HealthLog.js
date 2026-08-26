const mongoose = require("mongoose");

const healthLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Stored as a date-only string (YYYY-MM-DD) so there's exactly one
    // entry per user per day — new entries for the same day update it
    // instead of creating duplicates (see trackerController's upsert logic).
    date: {
      type: String,
      required: true,
    },
    weight_kg: { type: Number, min: 2, max: 400 },
    bp_systolic: { type: Number, min: 60, max: 260 },
    bp_diastolic: { type: Number, min: 30, max: 160 },
    bloodSugar: { type: Number, min: 20, max: 600 }, // mg/dL
    heartRate: { type: Number, min: 25, max: 250 }, // bpm
    sleepHours: { type: Number, min: 0, max: 16 },
    waterIntakeL: { type: Number, min: 0, max: 10 },
    steps: { type: Number, min: 0, max: 60000 },
    exerciseMinutes: { type: Number, min: 0, max: 600 },
    calories: { type: Number, min: 0, max: 10000 },
  },
  { timestamps: true }
);

// Enforce one log per user per day at the database level
healthLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("HealthLog", healthLogSchema);

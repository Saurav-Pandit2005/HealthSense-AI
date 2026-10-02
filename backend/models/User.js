const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // never return password by default in queries
    },
    // Forgot-password (token is stored hashed, never in plain text)
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    // ---- Health Profile fields (used from Module 2 onward) ----
    age: { type: Number, min: 1, max: 120 },
    gender: { type: String, enum: ["male", "female", "other"] },
    height_cm: { type: Number, min: 50, max: 260 },
    weight_kg: { type: Number, min: 2, max: 400 },
    bloodGroup: { type: String, enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] },
    allergies: [{ type: String }],
    medicalHistory: [{ type: String }],
    smoking: { type: Boolean, default: false },
    alcohol: { type: Boolean, default: false },
    fitnessGoal: {
      type: String,
      enum: ["lose_weight", "gain_muscle", "maintain", "general_fitness"],
      default: "maintain",
    },
    profileCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Hash password before saving, only if it changed
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);

const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const { validatePassword } = require("../utils/passwordPolicy");

const sha256 = (v) => crypto.createHash("sha256").update(v).digest("hex");
const RESET_MINUTES = 30;

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// Shape the user object we send back to the frontend (never send password)
function toSafeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    profileCompleted: user.profileCompleted,
  };
}

// @route  POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are all required" });
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    res.status(201).json({ user: toSafeUser(user), token });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

// @route  POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // .select("+password") because the schema hides password by default
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id);
    res.status(200).json({ user: toSafeUser(user), token });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

// @route  GET /api/auth/me   (protected)
exports.getMe = async (req, res) => {
  // req.user is attached by the authMiddleware after verifying the JWT
  res.status(200).json({ user: toSafeUser(req.user) });
};

// @route  POST /api/auth/forgot-password
// Always answers with the same message so nobody can check which emails are registered.
exports.forgotPassword = async (req, res) => {
  const genericMessage = "If an account exists for that email, a reset link has been sent.";
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    const user = await User.findOne({ email });
    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      await User.updateOne(
        { _id: user._id },
        { passwordResetToken: sha256(rawToken), passwordResetExpires: new Date(Date.now() + RESET_MINUTES * 60 * 1000) }
      );

      const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");
      const link = `${clientUrl}/reset-password/${rawToken}`;
      try {
        await sendEmail({
          to: user.email,
          subject: "Reset your HealthSense AI password",
          text: `Hi ${user.name},\n\nUse this link to set a new password (valid for ${RESET_MINUTES} minutes):\n${link}\n\nIf you didn't ask for this, you can ignore this email.`,
          html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#0F172A">
            <h2 style="margin:0 0 12px">Reset your password</h2>
            <p>Hi ${String(user.name).replace(/[<>&]/g, "")}, use the button below to set a new password. The link works for ${RESET_MINUTES} minutes.</p>
            <p><a href="${link}" style="display:inline-block;background:#146C6C;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Set new password</a></p>
            <p style="font-size:13px;color:#5B6B82">If you didn't ask for this, you can ignore this email.</p></div>`,
        });
      } catch (mailErr) {
        console.error("Reset email failed:", mailErr.message);
        await User.updateOne({ _id: user._id }, { $unset: { passwordResetToken: 1, passwordResetExpires: 1 } });
      }
    }
    res.status(200).json({ message: genericMessage });
  } catch (err) {
    res.status(500).json({ message: "Could not process the request. Please try again." });
  }
};

// @route  POST /api/auth/reset-password/:token
exports.resetPassword = async (req, res) => {
  try {
    const passwordError = validatePassword(req.body.password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const user = await User.findOne({
      passwordResetToken: sha256(String(req.params.token)),
      passwordResetExpires: { $gt: new Date() },
    });
    if (!user) {
      return res.status(400).json({ message: "This reset link is invalid or has expired. Please request a new one." });
    }

    user.password = req.body.password; // hashed by the pre-save hook
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password updated. You can now log in." });
  } catch (err) {
    res.status(500).json({ message: "Could not reset the password. Please try again." });
  }
};

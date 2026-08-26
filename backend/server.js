require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const trackerRoutes = require("./routes/trackerRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const riskRoutes = require("./routes/riskRoutes");
const fitnessRoutes = require("./routes/fitnessRoutes");
const mealRoutes = require("./routes/mealRoutes");

const app = express();

// ---- Middleware ----
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

// ---- Routes ----
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/tracker", trackerRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/risk", riskRoutes);
app.use("/api/fitness", fitnessRoutes);
app.use("/api/meal", mealRoutes);
// Health Report (Module 8) is frontend-only (PDF export) — no new backend route needed.

// ---- 404 handler ----
app.use((req, res) => res.status(404).json({ message: "Route not found" }));

// ---- Global error handler (catches anything thrown in async handlers) ----
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong on the server" });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
});

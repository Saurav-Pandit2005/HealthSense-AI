const express = require("express");
const router = express.Router();
const { getFitnessPlan } = require("../controllers/fitnessController");
const { protect } = require("../middleware/authMiddleware");

router.get("/plan", protect, getFitnessPlan);

module.exports = router;

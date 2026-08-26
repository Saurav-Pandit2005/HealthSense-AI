const express = require("express");
const router = express.Router();
const { getMealPlan } = require("../controllers/mealController");
const { protect } = require("../middleware/authMiddleware");

router.get("/plan", protect, getMealPlan);

module.exports = router;

const express = require("express");
const router = express.Router();
const { predictDiabetesRisk, getRiskHistory } = require("../controllers/riskController");
const { protect } = require("../middleware/authMiddleware");

router.post("/diabetes", protect, predictDiabetesRisk);
router.get("/history", protect, getRiskHistory);

module.exports = router;

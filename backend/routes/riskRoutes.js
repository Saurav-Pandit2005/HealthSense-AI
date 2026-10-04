const express = require("express");
const router = express.Router();
const { predictDiabetesRisk, getRiskHistory, deleteRiskResult } = require("../controllers/riskController");
const { protect } = require("../middleware/authMiddleware");

router.post("/diabetes", protect, predictDiabetesRisk);
router.get("/history", protect, getRiskHistory);
router.delete("/:id", protect, deleteRiskResult);

module.exports = router;

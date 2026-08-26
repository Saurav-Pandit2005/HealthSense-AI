const express = require("express");
const router = express.Router();
const { upsertLog, getToday, getHistory, deleteLog } = require("../controllers/trackerController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, upsertLog);
router.get("/today", protect, getToday);
router.get("/history", protect, getHistory);
router.delete("/:id", protect, deleteLog);

module.exports = router;

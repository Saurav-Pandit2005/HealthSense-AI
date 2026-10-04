const axios = require("axios");
const mongoose = require("mongoose");
const DiseaseRiskResult = require("../models/DiseaseRiskResult");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

const REQUIRED_FIELDS = [
  "pregnancies",
  "glucose",
  "blood_pressure",
  "skin_thickness",
  "insulin",
  "bmi",
  "diabetes_pedigree",
  "age",
];

// @route  POST /api/risk/diabetes   (protected)
exports.predictDiabetesRisk = async (req, res) => {
  try {
    const missing = REQUIRED_FIELDS.filter((f) => req.body[f] === undefined || req.body[f] === null || req.body[f] === "");
    if (missing.length > 0) {
      return res.status(400).json({ message: "Missing required fields", fields: missing });
    }

    const payload = {};
    for (const field of REQUIRED_FIELDS) {
      payload[field] = Number(req.body[field]);
    }

    // Call the FastAPI ML microservice — this is the only place in the whole
    // app that talks to it. The frontend never calls FastAPI directly.
    let mlResponse;
    try {
      mlResponse = await axios.post(`${ML_SERVICE_URL}/predict/diabetes`, payload, { timeout: 8000 });
    } catch (mlErr) {
      if (mlErr.code === "ECONNREFUSED" || mlErr.code === "ECONNABORTED") {
        return res.status(503).json({
          message: "The ML prediction service is not reachable. Make sure it's running (uvicorn on port 8000).",
        });
      }
      if (mlErr.response) {
        // ML service responded with an error (e.g. its own validation failure)
        return res.status(mlErr.response.status).json({ message: "ML service error", detail: mlErr.response.data });
      }
      throw mlErr;
    }

    const { risk_level, risk_percentage, important_factors, model_info, disclaimer } = mlResponse.data;

    // Save this assessment to history
    const saved = await DiseaseRiskResult.create({
      user: req.user._id,
      diseaseType: "diabetes",
      inputData: payload,
      riskLevel: risk_level,
      riskPercentage: risk_percentage,
      importantFactors: important_factors,
    });

    res.status(200).json({
      id: saved._id,
      riskLevel: risk_level,
      riskPercentage: risk_percentage,
      importantFactors: important_factors,
      modelInfo: model_info,
      disclaimer,
      createdAt: saved.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to get risk prediction", error: err.message });
  }
};

// @route  GET /api/risk/history   (protected)
exports.getRiskHistory = async (req, res) => {
  try {
    const results = await DiseaseRiskResult.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(20);
    res.status(200).json({ results });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch risk history", error: err.message });
  }
};

// @route  DELETE /api/risk/:id   (protected) - delete one past assessment of the logged-in user
exports.deleteRiskResult = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid assessment id" });
    }
    const deleted = await DiseaseRiskResult.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deleted) {
      return res.status(404).json({ message: "Assessment not found" });
    }
    res.status(200).json({ message: "Assessment deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete assessment", error: err.message });
  }
};

const mongoose = require("mongoose");

const diseaseRiskResultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    diseaseType: {
      type: String,
      enum: ["diabetes"], // more disease types can be added here later (Future Scope)
      default: "diabetes",
    },
    inputData: {
      type: Object,
      required: true,
    },
    riskLevel: {
      type: String,
      enum: ["Low", "Moderate", "High"],
      required: true,
    },
    riskPercentage: {
      type: Number,
      required: true,
    },
    importantFactors: {
      type: [Object],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DiseaseRiskResult", diseaseRiskResultSchema);

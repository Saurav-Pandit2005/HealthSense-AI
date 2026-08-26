import os

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.schemas import DiabetesRiskRequest, DiabetesRiskResponse, FactorContribution

app = FastAPI(
    title="HealthSense AI — ML Service",
    description="Diabetes risk prediction microservice (Logistic Regression, trained on the Pima Indians Diabetes Dataset).",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # only the Node backend calls this service — restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "diabetes_model.joblib")
_bundle = joblib.load(MODEL_PATH)
_model = _bundle["model"]
_scaler = _bundle["scaler"]
_features = _bundle["features"]
_metrics = _bundle["metrics"]

FEATURE_LABELS = {
    "pregnancies": "Number of pregnancies",
    "glucose": "Glucose level",
    "blood_pressure": "Blood pressure",
    "skin_thickness": "Skin thickness",
    "insulin": "Insulin level",
    "bmi": "BMI",
    "diabetes_pedigree": "Family history (diabetes pedigree)",
    "age": "Age",
}

DISCLAIMER = (
    "This is an estimated risk score from a machine learning model trained on a public "
    "research dataset. It is NOT a medical diagnosis. Please consult a doctor for accurate "
    "testing and medical advice."
)


@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": _model is not None}


@app.post("/predict/diabetes", response_model=DiabetesRiskResponse)
def predict_diabetes(req: DiabetesRiskRequest):
    try:
        raw_values = [getattr(req, f) for f in _features]
        # Wrap in a DataFrame with matching column names to avoid sklearn's
        # "missing feature names" warning (the scaler was fit on a DataFrame).
        input_df = pd.DataFrame([raw_values], columns=_features)
        scaled_values = _scaler.transform(input_df)[0]

        risk_proba = _model.predict_proba([scaled_values])[0][1]
        risk_percentage = round(float(risk_proba) * 100, 1)

        if risk_percentage < 30:
            risk_level = "Low"
        elif risk_percentage < 60:
            risk_level = "Moderate"
        else:
            risk_level = "High"

        # Per-user factor contribution = coefficient * this person's scaled value.
        # This explains THIS prediction specifically, not just global feature
        # importance — e.g. a low glucose value contributes negatively (protective)
        # even though glucose's coefficient is positive overall.
        coefficients = _model.coef_[0]
        contributions = []
        for i, feat in enumerate(_features):
            contribution = float(coefficients[i] * scaled_values[i])
            contributions.append(
                FactorContribution(
                    factor=FEATURE_LABELS.get(feat, feat),
                    value=raw_values[i],
                    effect="increases_risk" if contribution > 0 else "decreases_risk",
                    impact=round(abs(contribution), 4),
                )
            )

        contributions.sort(key=lambda c: c.impact, reverse=True)
        top_factors = contributions[:4]

        return DiabetesRiskResponse(
            risk_level=risk_level,
            risk_percentage=risk_percentage,
            important_factors=top_factors,
            model_info={
                "algorithm": "Logistic Regression",
                "trained_on": "Pima Indians Diabetes Dataset (768 records)",
                "test_accuracy": _metrics["accuracy"],
                "test_roc_auc": _metrics["roc_auc"],
            },
            disclaimer=DISCLAIMER,
        )
    except Exception as e:  # pragma: no cover
        raise HTTPException(status_code=500, detail=str(e))

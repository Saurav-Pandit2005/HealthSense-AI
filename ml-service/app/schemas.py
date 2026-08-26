from typing import List
from pydantic import BaseModel, Field


class DiabetesRiskRequest(BaseModel):
    pregnancies: int = Field(..., ge=0, le=20, description="Number of times pregnant (0 for male/no history)")
    glucose: float = Field(..., ge=0, le=300, description="Plasma glucose concentration (mg/dL)")
    blood_pressure: float = Field(..., ge=0, le=200, description="Diastolic blood pressure (mm Hg)")
    skin_thickness: float = Field(..., ge=0, le=100, description="Triceps skin fold thickness (mm)")
    insulin: float = Field(..., ge=0, le=900, description="2-Hour serum insulin (mu U/ml)")
    bmi: float = Field(..., ge=0, le=70, description="Body Mass Index")
    diabetes_pedigree: float = Field(..., ge=0, le=3, description="Diabetes pedigree function (family history score)")
    age: int = Field(..., ge=1, le=120)


class FactorContribution(BaseModel):
    factor: str
    value: float
    effect: str  # "increases_risk" | "decreases_risk"
    impact: float  # relative magnitude, for sorting/display


class DiabetesRiskResponse(BaseModel):
    model_config = {"protected_namespaces": ()}  # allows a field named "model_info" below

    risk_level: str  # "Low" | "Moderate" | "High"
    risk_percentage: float
    important_factors: List[FactorContribution]
    model_info: dict
    disclaimer: str

"""
Trains a Logistic Regression model on the real Pima Indians Diabetes
Dataset (768 patient records, 8 clinical features + outcome).

Why Logistic Regression (not Random Forest):
  - Coefficients are directly interpretable — for the "Important Factors"
    explanation shown to the user, we need to say WHY a risk was predicted,
    and LR's coefficients map cleanly to "this factor increased/decreased
    risk by X", which is much harder to justify from an ensemble model.
  - It's the standard baseline for this exact dataset/problem in the
    academic literature, so it's an easy, defensible choice for a viva.

Handles a well-known quirk of this dataset: several columns use 0 as a
placeholder for "missing" (e.g. 0 blood pressure is medically impossible)
so we treat those zeroes as missing and impute with the column median
before scaling/training.

Run with: python train_model.py
"""
import json
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

BASE_DIR = os.path.dirname(__file__)
DATA_PATH = os.path.join(BASE_DIR, "app", "data", "diabetes.csv")
MODEL_DIR = os.path.join(BASE_DIR, "app", "model")
os.makedirs(MODEL_DIR, exist_ok=True)

COLUMNS = [
    "pregnancies",
    "glucose",
    "blood_pressure",
    "skin_thickness",
    "insulin",
    "bmi",
    "diabetes_pedigree",
    "age",
    "outcome",
]

# These columns physically cannot be 0 in a real patient — 0 here means
# "not recorded" in this dataset, so we treat them as missing values.
ZERO_AS_MISSING = ["glucose", "blood_pressure", "skin_thickness", "insulin", "bmi"]

FEATURES = ["pregnancies", "glucose", "blood_pressure", "skin_thickness", "insulin", "bmi", "diabetes_pedigree", "age"]


def load_and_clean_data():
    df = pd.read_csv(DATA_PATH, header=None, names=COLUMNS)

    for col in ZERO_AS_MISSING:
        median = df.loc[df[col] != 0, col].median()
        df[col] = df[col].replace(0, np.nan).fillna(median)

    return df


def train():
    df = load_and_clean_data()
    X = df[FEATURES]
    y = df["outcome"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    model = LogisticRegression(max_iter=1000, random_state=42)
    model.fit(X_train_scaled, y_train)

    y_pred = model.predict(X_test_scaled)
    y_proba = model.predict_proba(X_test_scaled)[:, 1]

    metrics = {
        "accuracy": round(accuracy_score(y_test, y_pred), 4),
        "precision": round(precision_score(y_test, y_pred), 4),
        "recall": round(recall_score(y_test, y_pred), 4),
        "f1_score": round(f1_score(y_test, y_pred), 4),
        "roc_auc": round(roc_auc_score(y_test, y_proba), 4),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
    }

    print("=== Model Evaluation (on held-out 20% test set) ===")
    for k, v in metrics.items():
        print(f"  {k}: {v}")

    # Feature importance = standardized coefficients (since features are
    # scaled, coefficient magnitude is directly comparable across features)
    coefficients = dict(zip(FEATURES, model.coef_[0].round(4).tolist()))
    sorted_importance = dict(sorted(coefficients.items(), key=lambda x: abs(x[1]), reverse=True))
    print("\n=== Feature Importance (standardized coefficients) ===")
    for feat, coef in sorted_importance.items():
        direction = "increases" if coef > 0 else "decreases"
        print(f"  {feat}: {coef}  ({direction} risk)")

    joblib.dump(
        {"model": model, "scaler": scaler, "features": FEATURES, "metrics": metrics, "coefficients": coefficients},
        os.path.join(MODEL_DIR, "diabetes_model.joblib"),
    )

    with open(os.path.join(MODEL_DIR, "metrics.json"), "w") as f:
        json.dump({"metrics": metrics, "coefficients": sorted_importance}, f, indent=2)

    print(f"\nModel saved to {MODEL_DIR}/diabetes_model.joblib")


if __name__ == "__main__":
    train()

"""
train_yield_model.py
====================
Trains a GradientBoostingRegressor on synthetic-but-realistic
crop yield data and saves it as  yield_model.pkl  ready to drop into:
  agriai-assist/backend/models/yield_model.pkl

If you have a real CSV dataset, see the --csv_path flag below.

Usage:
  pip install -r train_requirements.txt

  # With synthetic data (works out of the box):
  python train_yield_model.py

  # With your own CSV:
  python train_yield_model.py --csv_path /path/to/crop_yield.csv

Expected CSV columns (if using --csv_path):
  temperature, humidity, rainfall, soil_type, crop_type, yield

  where yield is the target in Tonnes/Hectare.
"""

import argparse
import os
import json
import numpy as np
import pandas as pd
import joblib

from sklearn.ensemble          import GradientBoostingRegressor
from sklearn.preprocessing     import OneHotEncoder
from sklearn.pipeline          import Pipeline
from sklearn.compose           import ColumnTransformer
from sklearn.model_selection   import train_test_split, cross_val_score
from sklearn.metrics           import mean_absolute_error, r2_score

# ---------------------------------------------------------------------------
# Constants — must match the values accepted by the FastAPI endpoint
# ---------------------------------------------------------------------------
CROP_TYPES = ["Tomato", "Wheat", "Rice", "Maize", "Soybean",
              "Cotton", "Potato", "Sugarcane"]

SOIL_TYPES = ["Loamy", "Sandy", "Clay", "Silty",
              "Peaty", "Chalky", "Sandy Loam"]

# Base yield (T/ha) per crop — used to generate realistic synthetic data
CROP_BASELINES = {
    "Tomato": 8.5, "Wheat": 3.8, "Rice": 4.5, "Maize": 5.2,
    "Soybean": 2.9, "Cotton": 1.8, "Potato": 20.0, "Sugarcane": 70.0,
}
SOIL_MULTIPLIERS = {
    "Loamy": 1.10, "Sandy Loam": 1.05, "Silty": 1.08, "Clay": 0.95,
    "Sandy": 0.88, "Peaty": 1.02, "Chalky": 0.90,
}

# ---------------------------------------------------------------------------
# Synthetic dataset generator
# ---------------------------------------------------------------------------

def generate_synthetic_data(n_samples: int = 8000) -> pd.DataFrame:
    """
    Creates a realistic synthetic dataset using agronomic rules + noise.
    Replace with your real dataset if you have one.
    """
    rng = np.random.default_rng(42)
    rows = []

    for _ in range(n_samples):
        crop      = rng.choice(CROP_TYPES)
        soil      = rng.choice(SOIL_TYPES)
        temp      = rng.uniform(10, 45)      # °C
        humidity  = rng.uniform(30, 95)      # %
        rainfall  = rng.uniform(50, 450)     # mm

        baseline  = CROP_BASELINES[crop]
        soil_mul  = SOIL_MULTIPLIERS[soil]

        import math
        temp_factor     = math.exp(-((temp - 25) ** 2) / (2 * 12 ** 2))
        moisture_factor = min(1.2, 0.6 + 0.3 * math.log1p(rainfall / 100))
        humid_factor    = 1.0 if humidity <= 85 else max(0.85, 1.0 - (humidity - 85) * 0.005)

        true_yield = baseline * soil_mul * temp_factor * moisture_factor * humid_factor
        # Add realistic noise (±8%)
        noisy_yield = true_yield * rng.uniform(0.92, 1.08)

        rows.append({
            "temperature": round(temp, 1),
            "humidity":    round(humidity, 1),
            "rainfall":    round(rainfall, 1),
            "soil_type":   soil,
            "crop_type":   crop,
            "yield":       round(max(0.1, noisy_yield), 2),
        })

    df = pd.DataFrame(rows)
    print(f"Generated {len(df):,} synthetic samples.")
    print(df.describe())
    return df


def load_csv_data(csv_path: str) -> pd.DataFrame:
    """Load and validate a user-supplied CSV."""
    df = pd.read_csv(csv_path)
    required = {"temperature", "humidity", "rainfall", "soil_type", "crop_type", "yield"}
    missing  = required - set(df.columns)
    if missing:
        raise ValueError(f"CSV is missing columns: {missing}")
    print(f"Loaded {len(df):,} rows from {csv_path}")
    return df


# ---------------------------------------------------------------------------
# Model pipeline
# ---------------------------------------------------------------------------

def build_pipeline() -> Pipeline:
    """
    ColumnTransformer:
      - numerical features → passthrough
      - categorical features → OneHotEncoder

    Then GradientBoostingRegressor.
    """
    categorical_features = ["soil_type", "crop_type"]
    numerical_features   = ["temperature", "humidity", "rainfall"]

    preprocessor = ColumnTransformer(transformers=[
        ("num", "passthrough", numerical_features),
        ("cat", OneHotEncoder(
            categories=[SOIL_TYPES, CROP_TYPES],
            handle_unknown="ignore",
            sparse_output=False,
        ), categorical_features),
    ])

    regressor = GradientBoostingRegressor(
        n_estimators=300,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.85,
        min_samples_split=10,
        random_state=42,
        verbose=1,
    )

    return Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("regressor",    regressor),
    ])


# ---------------------------------------------------------------------------
# Training entry point
# ---------------------------------------------------------------------------

def train(csv_path: str | None, output_dir: str):
    os.makedirs(output_dir, exist_ok=True)

    print(f"\n{'='*60}")
    print(f"  AgriAI — Yield Model Training")
    print(f"  Data    : {'synthetic' if not csv_path else csv_path}")
    print(f"  Output  : {output_dir}")
    print(f"{'='*60}\n")

    # Load data
    df = load_csv_data(csv_path) if csv_path else generate_synthetic_data()

    X = df[["temperature", "humidity", "rainfall", "soil_type", "crop_type"]]
    y = df["yield"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.15, random_state=42
    )

    print(f"\nTrain samples : {len(X_train):,}")
    print(f"Test  samples : {len(X_test):,}\n")

    # Build + train
    pipeline = build_pipeline()
    pipeline.fit(X_train, y_train)

    # Evaluate
    y_pred = pipeline.predict(X_test)
    mae    = mean_absolute_error(y_test, y_pred)
    r2     = r2_score(y_test, y_pred)

    print(f"\n── Test Set Metrics ──")
    print(f"  MAE  : {mae:.4f} T/ha")
    print(f"  R²   : {r2:.4f}")

    # Cross-validation (quick sanity check)
    cv_scores = cross_val_score(pipeline, X, y, cv=5, scoring="r2", n_jobs=-1)
    print(f"  CV R²: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    # ── Save model bundle ──
    # The backend loads this exact structure:
    #   bundle = joblib.load("yield_model.pkl")
    #   model  = bundle["model"]       → the full sklearn pipeline
    #   meta   = bundle["meta"]        → crops, soils, units
    bundle = {
        "model": pipeline,
        "meta": {
            "crop_types":   CROP_TYPES,
            "soil_types":   SOIL_TYPES,
            "target_unit":  "Tonnes/Hectare",
            "features":     ["temperature", "humidity", "rainfall", "soil_type", "crop_type"],
            "mae":          round(mae, 4),
            "r2":           round(r2, 4),
        },
    }

    model_path = os.path.join(output_dir, "yield_model.pkl")
    joblib.dump(bundle, model_path, compress=3)
    print(f"\n✅ Model saved → {model_path}")

    # Also save meta as JSON for reference
    meta_path = os.path.join(output_dir, "yield_model_meta.json")
    with open(meta_path, "w") as f:
        json.dump(bundle["meta"], f, indent=2)
    print(f"✅ Metadata saved → {meta_path}")

    print(f"""
{'='*60}
  DONE. Copy this file to your backend:
    {model_path}
    → agriai-assist/backend/models/yield_model.pkl
{'='*60}
""")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--csv_path",
        default=None,
        help="(Optional) Path to your CSV dataset. Omit to use synthetic data.",
    )
    parser.add_argument(
        "--output_dir",
        default="./trained_models",
        help="Directory to save the trained model files",
    )
    args = parser.parse_args()
    train(args.csv_path, args.output_dir)

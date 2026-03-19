"""
train_yield_model.py
--------------------
Train a crop yield regression model and save it in the exact format
expected by agriai-assist/backend/models/yield_model.py

The model bundle is saved as a joblib file containing:
    { "model": <trained pipeline>, "encoder": <fitted OrdinalEncoder> }

Usage:
    pip install scikit-learn pandas joblib
    python train_yield_model.py --data_path /path/to/yield_data.csv
    python train_yield_model.py --demo   # generates synthetic data and trains
"""

import argparse
import json
import numpy as np
import pandas as pd
import joblib

from sklearn.ensemble        import GradientBoostingRegressor, RandomForestRegressor
from sklearn.preprocessing   import OrdinalEncoder
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.pipeline        import Pipeline
from sklearn.compose         import ColumnTransformer
from sklearn.preprocessing   import StandardScaler
from sklearn.metrics         import mean_absolute_error, r2_score

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
parser = argparse.ArgumentParser()
parser.add_argument("--data_path", type=str, default=None,
                    help="Path to CSV with columns: temperature, humidity, rainfall, soil_type, crop_type, yield")
parser.add_argument("--output",    type=str, default="yield_model.pkl",
                    help="Output path for the saved model bundle")
parser.add_argument("--demo",      action="store_true",
                    help="Generate synthetic training data (no CSV needed)")
args = parser.parse_args()

# ---------------------------------------------------------------------------
# Categorical value sets — must match what the frontend sends
# ---------------------------------------------------------------------------
SOIL_TYPES = ["Loamy", "Sandy", "Clay", "Silty", "Peaty", "Chalky", "Sandy Loam"]
CROP_TYPES = ["Tomato", "Wheat", "Rice", "Maize", "Soybean", "Cotton", "Potato", "Sugarcane"]

# ---------------------------------------------------------------------------
# Load or generate training data
# ---------------------------------------------------------------------------
def generate_synthetic_data(n: int = 3000) -> pd.DataFrame:
    """
    Physics-inspired synthetic yield data for demo / fallback training.
    Replace with real CSV data for production accuracy.
    """
    import math
    rng = np.random.default_rng(42)

    BASELINES = {
        "Tomato": 8.5, "Wheat": 3.8, "Rice": 4.5, "Maize": 5.2,
        "Soybean": 2.9, "Cotton": 1.8, "Potato": 20.0, "Sugarcane": 70.0,
    }
    SOIL_MUL = {
        "Loamy": 1.10, "Sandy Loam": 1.05, "Silty": 1.08,
        "Clay": 0.95, "Sandy": 0.88, "Peaty": 1.02, "Chalky": 0.90,
    }

    records = []
    for _ in range(n):
        crop      = rng.choice(CROP_TYPES)
        soil      = rng.choice(SOIL_TYPES)
        temp      = float(rng.uniform(10, 45))
        humidity  = float(rng.uniform(30, 95))
        rainfall  = float(rng.uniform(50, 450))

        base      = BASELINES[crop]
        soil_m    = SOIL_MUL[soil]
        temp_f    = math.exp(-((temp - 25) ** 2) / (2 * 12 ** 2))
        moist_f   = min(1.2, 0.6 + 0.3 * math.log1p(rainfall / 100))
        humid_f   = 1.0 if humidity <= 85 else max(0.85, 1.0 - (humidity - 85) * 0.005)

        yield_val = base * soil_m * temp_f * moist_f * humid_f
        # Add realistic noise
        yield_val += rng.normal(0, yield_val * 0.05)
        yield_val  = max(0.1, round(yield_val, 2))

        records.append({
            "temperature": round(temp, 1),
            "humidity":    round(humidity, 1),
            "rainfall":    round(rainfall, 1),
            "soil_type":   soil,
            "crop_type":   crop,
            "yield":       yield_val,
        })

    return pd.DataFrame(records)


if args.demo or args.data_path is None:
    print("Generating synthetic training data (3 000 samples)…")
    df = generate_synthetic_data(3000)
else:
    print(f"Loading data from: {args.data_path}")
    df = pd.read_csv(args.data_path)
    # Normalise column names
    df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")
    required = {"temperature", "humidity", "rainfall", "soil_type", "crop_type", "yield"}
    missing  = required - set(df.columns)
    if missing:
        raise ValueError(f"CSV is missing columns: {missing}")

print(f"  Rows: {len(df)}")
print(f"  Yield range: {df['yield'].min():.2f} – {df['yield'].max():.2f} T/ha")

# ---------------------------------------------------------------------------
# Feature engineering
# ---------------------------------------------------------------------------
NUMERIC_FEATURES     = ["temperature", "humidity", "rainfall"]
CATEGORICAL_FEATURES = ["soil_type", "crop_type"]
TARGET               = "yield"

X = df[NUMERIC_FEATURES + CATEGORICAL_FEATURES]
y = df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ---------------------------------------------------------------------------
# Encoder — fit on known categories to avoid unseen-label errors at inference
# ---------------------------------------------------------------------------
encoder = OrdinalEncoder(
    categories=[SOIL_TYPES, CROP_TYPES],
    handle_unknown="use_encoded_value",
    unknown_value=-1,
)

# ---------------------------------------------------------------------------
# Build preprocessing + model pipeline
# ---------------------------------------------------------------------------
preprocessor = ColumnTransformer([
    ("num", StandardScaler(),    NUMERIC_FEATURES),
    ("cat", encoder,             CATEGORICAL_FEATURES),
])

model = GradientBoostingRegressor(
    n_estimators=300,
    learning_rate=0.05,
    max_depth=5,
    min_samples_leaf=4,
    subsample=0.8,
    random_state=42,
)

pipeline = Pipeline([
    ("preprocessor", preprocessor),
    ("regressor",    model),
])

# ---------------------------------------------------------------------------
# Train
# ---------------------------------------------------------------------------
print("\nTraining GradientBoostingRegressor…")
pipeline.fit(X_train, y_train)

# ---------------------------------------------------------------------------
# Evaluate
# ---------------------------------------------------------------------------
y_pred = pipeline.predict(X_test)
mae    = mean_absolute_error(y_test, y_pred)
r2     = r2_score(y_test, y_pred)

print(f"\n── Test set results ──")
print(f"  MAE : {mae:.3f} T/ha")
print(f"  R²  : {r2:.4f}")

cv_scores = cross_val_score(pipeline, X, y, cv=5, scoring="r2")
print(f"  CV R² (5-fold): {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

# ---------------------------------------------------------------------------
# Save — bundle format the backend expects
# ---------------------------------------------------------------------------
# The backend's yield_model.py calls:
#   bundle = joblib.load("yield_model.pkl")
#   model   = bundle["model"]
#   encoder = bundle["encoder"]   ← unused in pipeline mode; kept for compat
#
# Since we embedded the encoder inside the pipeline, we pass the pipeline
# as "model" and encoder=None. The backend handles this correctly.

bundle = {
    "model":   pipeline,   # sklearn Pipeline (preprocessor + regressor)
    "encoder": None,       # Already inside the pipeline
}

joblib.dump(bundle, args.output, compress=3)
print(f"\n✅ Model saved to: {args.output}")
print(f"   Copy to: agriai-assist/backend/models/yield_model.pkl")

# ---------------------------------------------------------------------------
# Save feature metadata (for documentation / future retraining)
# ---------------------------------------------------------------------------
meta = {
    "numeric_features":     NUMERIC_FEATURES,
    "categorical_features": CATEGORICAL_FEATURES,
    "soil_types":           SOIL_TYPES,
    "crop_types":           CROP_TYPES,
    "target":               TARGET,
    "test_mae":             round(float(mae), 4),
    "test_r2":              round(float(r2), 4),
}
meta_path = args.output.replace(".pkl", "_meta.json")
with open(meta_path, "w") as f:
    json.dump(meta, f, indent=2)
print(f"✅ Metadata saved to: {meta_path}")

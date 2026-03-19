"""
models/yield_model.py
---------------------
Yield prediction inference.

Strategy:
  1. Attempt to load a trained scikit-learn pipeline from models/yield_model.pkl
  2. Fall back to a physics-inspired mock formula if the file is absent
     or scikit-learn is not installed.
"""

import os
import logging
import math

logger = logging.getLogger("agriai.yield")

# ---------------------------------------------------------------------------
# Crop baseline yields (tonnes/hectare) — used by both real and mock paths
# ---------------------------------------------------------------------------
CROP_BASELINES = {
    "Tomato":     8.5,
    "Wheat":      3.8,
    "Rice":       4.5,
    "Maize":      5.2,
    "Soybean":    2.9,
    "Cotton":     1.8,
    "Potato":    20.0,
    "Sugarcane": 70.0,
}

SOIL_MULTIPLIERS = {
    "Loamy":      1.10,
    "Sandy Loam": 1.05,
    "Silty":      1.08,
    "Clay":       0.95,
    "Sandy":      0.88,
    "Peaty":      1.02,
    "Chalky":     0.90,
}

# ---------------------------------------------------------------------------
# Try to load a real model
# ---------------------------------------------------------------------------
_MODEL = None
_ENCODER = None

def _load_model():
    global _MODEL, _ENCODER
    model_path = os.path.join(os.path.dirname(__file__), "yield_model.pkl")
    if not os.path.exists(model_path):
        logger.warning(
            "yield_model.pkl not found — running in MOCK mode. "
            "Drop your trained model at backend/models/yield_model.pkl to enable real inference."
        )
        return False

    try:
        import joblib
        bundle = joblib.load(model_path)
        _MODEL   = bundle.get("model")
        _ENCODER = bundle.get("encoder")
        logger.info("Yield model loaded from %s", model_path)
        return True
    except ImportError:
        logger.warning("joblib not installed — running in MOCK mode.")
        return False
    except Exception as e:
        logger.error("Failed to load yield model: %s", e)
        return False

_MODEL_READY = _load_model()

# ---------------------------------------------------------------------------
# Inference function
# ---------------------------------------------------------------------------

def predict_yield(
    temperature: float,
    humidity: float,
    rainfall: float,
    soil_type: str,
    crop_type: str,
) -> dict:
    """
    Returns { predicted_yield: str, confidence: float }
    """
    if _MODEL_READY and _MODEL is not None:
        return _real_inference(temperature, humidity, rainfall, soil_type, crop_type)
    return _mock_inference(temperature, humidity, rainfall, soil_type, crop_type)


def _real_inference(temperature, humidity, rainfall, soil_type, crop_type) -> dict:
    import numpy as np

    # Encode categoricals if encoder was saved with the model
    if _ENCODER:
        cat = _ENCODER.transform([[soil_type, crop_type]])
        features = np.array([[temperature, humidity, rainfall, *cat[0]]])
    else:
        # Assume model accepts raw numeric features only
        soil_idx  = list(SOIL_MULTIPLIERS.keys()).index(soil_type)  if soil_type  in SOIL_MULTIPLIERS  else 0
        crop_idx  = list(CROP_BASELINES.keys()).index(crop_type)    if crop_type  in CROP_BASELINES    else 0
        features = np.array([[temperature, humidity, rainfall, soil_idx, crop_idx]])

    pred = float(_MODEL.predict(features)[0])
    confidence = min(0.97, max(0.70, 1 - abs(pred - _get_baseline(crop_type)) / _get_baseline(crop_type) * 0.3))

    return {
        "predicted_yield": f"{pred:.1f} Tonnes/Hectare",
        "confidence":      round(confidence, 2),
    }


def _mock_inference(temperature, humidity, rainfall, soil_type, crop_type) -> dict:
    """
    Physics-inspired formula:
      base yield × soil multiplier × temperature factor × moisture factor
    """
    baseline = _get_baseline(crop_type)
    soil_mul  = SOIL_MULTIPLIERS.get(soil_type, 1.0)

    # Temperature factor: bell curve centred at 25 °C, σ ≈ 12
    temp_factor = math.exp(-((temperature - 25) ** 2) / (2 * 12 ** 2))

    # Moisture factor: logarithmic growth, normalised at 200 mm
    moisture_factor = min(1.2, 0.6 + 0.3 * math.log1p(rainfall / 100))

    # Humidity: slight penalty above 85% (disease pressure)
    humidity_factor = 1.0 if humidity <= 85 else max(0.85, 1.0 - (humidity - 85) * 0.005)

    raw = baseline * soil_mul * temp_factor * moisture_factor * humidity_factor
    predicted = round(max(0.1, raw), 1)

    # Confidence: inversely proportional to how extreme the inputs are
    extremeness = (
        abs(temperature - 25) / 25
        + abs(humidity   - 65) / 65
        + abs(rainfall   - 200) / 200
    ) / 3
    confidence = round(min(0.96, max(0.72, 0.93 - extremeness * 0.2)), 2)

    logger.info(
        "MOCK yield prediction: %.1f T/ha (conf %.2f) for %s on %s soil",
        predicted, confidence, crop_type, soil_type,
    )
    return {
        "predicted_yield": f"{predicted} Tonnes/Hectare",
        "confidence":      confidence,
    }


def _get_baseline(crop_type: str) -> float:
    return CROP_BASELINES.get(crop_type, 4.0)

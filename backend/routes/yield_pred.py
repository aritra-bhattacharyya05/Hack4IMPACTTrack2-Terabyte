"""
routes/yield_pred.py
POST /api/predict-yield — farm inputs → yield estimate
"""
import logging
import numpy as np
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from models.loader import get_yield_model

logger = logging.getLogger("agriai.yield")
router = APIRouter()


class YieldRequest(BaseModel):
    crop:             str   = Field(..., example="Wheat")
    state:            str   = Field(..., example="Punjab")
    season:           str   = Field("Kharif", example="Kharif")
    area:             float = Field(..., example=1.5,    description="Area in hectares")
    annual_rainfall:  float = Field(..., example=900.0,  description="mm/year")
    fertilizer:       float = Field(..., example=150.0,  description="kg/hectare")
    pesticide:        float = Field(..., example=2.5,    description="kg/hectare")


# ── Simple demo estimation when model unavailable ─────────────────
_BASE_YIELDS = {
    "wheat": 3.5, "rice": 4.2, "maize": 5.0, "cotton": 1.8,
    "sugarcane": 70.0, "tomato": 25.0, "potato": 20.0,
}

def _demo_yield(req: YieldRequest) -> float:
    base    = _BASE_YIELDS.get(req.crop.lower(), 3.0)
    rf_adj  = (req.annual_rainfall - 800) / 800 * 0.5
    fert_adj = min(req.fertilizer / 200, 1.0) * 0.3
    return round(base + rf_adj + fert_adj, 2)


# ── POST /api/predict-yield ───────────────────────────────────────
@router.post("/predict-yield")
def predict_yield(body: YieldRequest):
    """
    Accept farm parameters → return predicted crop yield.
    """
    model = get_yield_model()

    if model is None:
        logger.warning("Yield model not loaded — using demo estimation")
        predicted = _demo_yield(body)
        return {
            "predicted_yield": f"{predicted:.2f} Tonnes/Hectare",
            "source": "demo",
        }

    try:
        # Encode inputs — match training feature order from crop_yield.csv
        features = np.array([[
            body.area,
            body.annual_rainfall,
            body.fertilizer,
            body.pesticide,
        ]])

        predicted = model.predict(features)[0]
        return {
            "predicted_yield": f"{predicted:.2f} Tonnes/Hectare",
            "source": "model",
        }

    except Exception as e:
        logger.error(f"Yield prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Yield prediction error: {str(e)}")

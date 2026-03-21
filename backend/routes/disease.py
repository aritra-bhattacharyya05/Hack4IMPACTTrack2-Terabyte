"""
routes/disease.py
POST /api/predict-disease  — image → disease + confidence
POST /api/get-remedy       — disease name → treatment steps
"""
import logging
import torch
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from models.loader import get_disease_model, get_class_names, get_model_info
from utils.image_utils import preprocess_image
from utils.remedy import generate_remedy

logger = logging.getLogger("agriai.disease")
router = APIRouter()

# ── Demo fallback when model not loaded ───────────────────────────
_DEMO_RESULT = {
    "disease":    "Tomato___Late_blight",
    "confidence": 0.87,
    "top_3": [
        {"disease": "Tomato___Late_blight",         "confidence": 0.87},
        {"disease": "Tomato___Early_blight",         "confidence": 0.09},
        {"disease": "Tomato___Septoria_leaf_spot",   "confidence": 0.04},
    ],
}


class RemedyRequest(BaseModel):
    disease:    str
    confidence: str = "N/A"


# ── POST /api/predict-disease ─────────────────────────────────────
@router.post("/predict-disease")
async def predict_disease(file: UploadFile = File(...)):
    """
    Accept a leaf image → return predicted disease, confidence, top-3.
    """
    # Validate file type
    if file.content_type not in ("image/jpeg", "image/png", "image/jpg", "image/webp"):
        raise HTTPException(status_code=400, detail="Only JPG/PNG/WEBP images accepted")

    image_bytes = await file.read()
    model       = get_disease_model()
    class_names = get_class_names()

    # Use demo data if model not loaded
    if model is None:
        logger.warning("Disease model not loaded — returning demo result")
        return _DEMO_RESULT

    device = next(model.parameters()).device

    try:
        tensor = preprocess_image(image_bytes, device)

        with torch.no_grad():
            logits = model(tensor)
            probs  = torch.softmax(logits, dim=1)[0]

        top_probs, top_idxs = probs.topk(3)

        top_3 = [
            {
                "disease":    class_names[top_idxs[i].item()],
                "confidence": round(top_probs[i].item(), 4),
            }
            for i in range(3)
        ]

        return {
            "disease":    top_3[0]["disease"],
            "confidence": top_3[0]["confidence"],
            "top_3":      top_3,
        }

    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


# ── POST /api/get-remedy ──────────────────────────────────────────
@router.post("/get-remedy")
def get_remedy(body: RemedyRequest):
    """
    Accept a disease name → return GenAI treatment plan.
    """
    remedy = generate_remedy(body.disease, body.confidence)
    return {"remedy": remedy}

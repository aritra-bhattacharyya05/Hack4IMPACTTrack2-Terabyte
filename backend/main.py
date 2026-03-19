"""
AgriAI Assist — FastAPI Backend
Exposes two AI prediction endpoints:
  POST /predict-disease  — crop disease detection from an image
  POST /predict-yield    — yield forecasting from environmental params
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
import os
import shutil
import uuid
import logging

from models.disease_model import predict_disease
from models.yield_model import predict_yield

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("agriai")

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = FastAPI(
    title="AgriAI Assist API",
    description="AI-powered crop disease detection and yield prediction",
    version="1.0.0",
)

# CORS — allow the Vite dev server and any local origin during hackathon
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (heatmap images etc.)
app.mount("/static", StaticFiles(directory="static"), name="static")

# ---------------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------------

class YieldRequest(BaseModel):
    temperature: float
    humidity: float
    rainfall: float
    soil_type: str
    crop_type: str

class DiseaseResponse(BaseModel):
    disease: str
    confidence: float
    treatment: list[str]
    heatmap_url: str | None

class YieldResponse(BaseModel):
    predicted_yield: str
    confidence: float

# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health", tags=["meta"])
def health_check():
    return {"status": "ok", "service": "AgriAI Assist API"}

# ---------------------------------------------------------------------------
# Disease detection endpoint
# ---------------------------------------------------------------------------

@app.post("/predict-disease", response_model=DiseaseResponse, tags=["prediction"])
async def disease_detection(file: UploadFile = File(...)):
    """
    Accept a crop/leaf image and return:
      - disease name
      - confidence score
      - treatment steps
      - path to the AI-generated heatmap
    """
    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type: {file.content_type}. Use JPEG, PNG, or WEBP."
        )

    # Save upload to a temp path so the model can read it
    upload_filename = f"{uuid.uuid4()}_{file.filename}"
    upload_path = os.path.join("uploads", upload_filename)

    try:
        with open(upload_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        logger.info(f"Image saved: {upload_path}")

        # Run inference
        result = predict_disease(upload_path)
        logger.info(f"Disease result: {result}")

        return result

    except Exception as e:
        logger.error(f"Disease prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Always clean up the uploaded file
        if os.path.exists(upload_path):
            os.remove(upload_path)

# ---------------------------------------------------------------------------
# Yield prediction endpoint
# ---------------------------------------------------------------------------

@app.post("/predict-yield", response_model=YieldResponse, tags=["prediction"])
async def yield_prediction(params: YieldRequest):
    """
    Accept environmental parameters and return a yield forecast.
    """
    logger.info(f"Yield request: {params}")

    try:
        result = predict_yield(
            temperature=params.temperature,
            humidity=params.humidity,
            rainfall=params.rainfall,
            soil_type=params.soil_type,
            crop_type=params.crop_type,
        )
        logger.info(f"Yield result: {result}")
        return result

    except Exception as e:
        logger.error(f"Yield prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------------------------
# Dev entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

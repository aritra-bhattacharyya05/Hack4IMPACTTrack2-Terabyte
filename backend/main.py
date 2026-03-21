"""
AgriAI Assist — FastAPI Backend
Disease Detection + Yield Prediction + GenAI Remedy
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import disease, yield_pred, health
from models.loader import load_all_models

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("agriai")

app = FastAPI(
    title="AgriAI Assist API",
    description="Crop Disease Detection + Yield Prediction powered by ResNet50 + GenAI",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    logger.info("Loading models from Hugging Face...")
    load_all_models()
    logger.info("All models loaded — server ready")


app.include_router(health.router, tags=["Health"])
app.include_router(disease.router, prefix="/api", tags=["Disease"])
app.include_router(yield_pred.router, prefix="/api", tags=["Yield"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

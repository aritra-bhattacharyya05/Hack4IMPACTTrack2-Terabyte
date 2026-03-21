"""routes/health.py — Health check endpoint."""
from fastapi import APIRouter
from models.loader import get_model_info

router = APIRouter()


@router.get("/health")
def health():
    info = get_model_info()
    return {
        "status":  "running",
        "version": "1.0.0",
        **info,
    }

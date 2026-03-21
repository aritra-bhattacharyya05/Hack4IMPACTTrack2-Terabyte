"""
models/loader.py
Downloads disease_model.pt + yield_model.pkl from Hugging Face
and loads them into memory ONCE at startup.
"""
import logging
from contextlib import contextmanager
import torch
import torch.nn as nn
import joblib
from torchvision import models
from huggingface_hub import hf_hub_download
from pathlib import Path

logger = logging.getLogger("agriai.loader")

# ── Hugging Face repo ──────────────────────────────────────────────
HF_REPO       = "aadiaditya9421/agriai-disease-model"
DISEASE_FILE  = "disease_model.pt"
YIELD_FILE    = "yield_model.pkl"

# ── Global model state (loaded once) ──────────────────────────────
_state = {
    "disease_model":  None,
    "yield_model":    None,
    "class_names":    [],
    "num_classes":    0,
    "test_accuracy":  0.0,
    "device":         None,
}


@contextmanager
def _patched_print_callback_symbol():
    """Temporarily expose PrintCallback for legacy pickle deserialization."""

    class PrintCallback:
        def after_iteration(self, model, epoch, evals_log):
            return False

    import __main__

    had_existing = hasattr(__main__, "PrintCallback")
    previous_value = getattr(__main__, "PrintCallback", None)
    __main__.PrintCallback = PrintCallback

    try:
        yield
    finally:
        if had_existing:
            __main__.PrintCallback = previous_value
        else:
            delattr(__main__, "PrintCallback")


def get_device() -> torch.device:
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


def _build_disease_model(num_classes: int) -> nn.Module:
    """Rebuild the exact ResNet50 architecture from hackathon.ipynb."""
    model = models.resnet50(weights=None)
    model.fc = nn.Sequential(
        nn.Linear(model.fc.in_features, 512),
        nn.ReLU(),
        nn.Dropout(0.4),
        nn.Linear(512, num_classes),
    )
    return model


def load_all_models():
    """Download and load all models. Called once at startup."""
    device = get_device()
    _state["device"] = device
    logger.info(f"Using device: {device}")

    # ── Disease model ──────────────────────────────────────────────
    try:
        logger.info(f"Downloading {DISEASE_FILE} from {HF_REPO}...")
        disease_path = hf_hub_download(repo_id=HF_REPO, filename=DISEASE_FILE)

        checkpoint       = torch.load(disease_path, map_location=device, weights_only=False)
        class_names      = checkpoint["class_names"]
        num_classes      = checkpoint["num_classes"]
        test_accuracy    = checkpoint.get("test_accuracy", 0.0)

        disease_model = _build_disease_model(num_classes)
        disease_model.load_state_dict(checkpoint["model_state_dict"])
        disease_model.to(device)
        disease_model.eval()

        _state["disease_model"] = disease_model
        _state["class_names"]   = class_names
        _state["num_classes"]   = num_classes
        _state["test_accuracy"] = test_accuracy

        logger.info(f"Disease model loaded | classes={num_classes} | acc={test_accuracy:.2%}")

    except Exception as e:
        logger.error(f"Failed to load disease model: {e}")
        logger.warning("Disease endpoints will return demo data")

    # ── Yield model ────────────────────────────────────────────────
    try:
        logger.info(f"Downloading {YIELD_FILE} from {HF_REPO}...")
        yield_path = hf_hub_download(repo_id=HF_REPO, filename=YIELD_FILE)

        with _patched_print_callback_symbol():
            yield_model = joblib.load(yield_path)
        _state["yield_model"] = yield_model
        logger.info("Yield model loaded")

    except Exception as e:
        logger.error(f"Failed to load yield model: {e}")
        logger.warning("Yield endpoints will return demo data")


def get_disease_model():
    return _state["disease_model"]


def get_yield_model():
    return _state["yield_model"]


def get_class_names():
    return _state["class_names"]


def get_model_info() -> dict:
    return {
        "disease_model_loaded": _state["disease_model"] is not None,
        "yield_model_loaded":   _state["yield_model"]   is not None,
        "num_classes":          _state["num_classes"],
        "test_accuracy":        f'{_state["test_accuracy"]:.2%}',
        "device":               str(_state["device"]),
    }

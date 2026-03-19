"""
models/disease_model.py
-----------------------
Disease detection inference.

Loads disease_classifier.h5  (TensorFlow/Keras EfficientNetB0)
      disease_labels.json     (index → class name, produced by training script)

Falls back to deterministic mock if either file is absent.
"""

import os
import json
import random
import logging

logger = logging.getLogger("agriai.disease")

# ---------------------------------------------------------------------------
# Disease treatment catalogue
# Keys = Kaggle PlantVillage folder names (lowercased, spaces→underscore)
# Add / edit entries to match your dataset's actual class names.
# ---------------------------------------------------------------------------
TREATMENT_CATALOGUE = {
    # Tomato
    "tomato___early_blight": {
        "display": "Tomato Early Blight",
        "treatment": [
            "Apply copper-based fungicide every 7–10 days",
            "Remove and destroy all infected leaves immediately",
            "Avoid overhead irrigation to reduce leaf wetness",
            "Ensure proper plant spacing to improve air circulation",
        ],
        "heatmap": "heatmap_blight.jpg",
    },
    "tomato___late_blight": {
        "display": "Tomato Late Blight",
        "treatment": [
            "Apply systemic fungicide (mefenoxam or metalaxyl) promptly",
            "Remove infected plants and dispose of them safely",
            "Avoid excess nitrogen fertilisation",
            "Monitor weather — act before rain events",
        ],
        "heatmap": "heatmap_late_blight.jpg",
    },
    "tomato___leaf_mold": {
        "display": "Tomato Leaf Mold",
        "treatment": [
            "Improve ventilation in greenhouses",
            "Apply chlorothalonil or mancozeb fungicide",
            "Avoid wetting foliage during irrigation",
            "Remove and destroy heavily infected leaves",
        ],
        "heatmap": None,
    },
    "tomato___septoria_leaf_spot": {
        "display": "Tomato Septoria Leaf Spot",
        "treatment": [
            "Apply fungicide at first sign of spots",
            "Mulch around plants to reduce soil splash",
            "Remove infected lower leaves",
            "Rotate crops each season",
        ],
        "heatmap": None,
    },
    "tomato___spider_mites two-spotted_spider_mite": {
        "display": "Tomato Spider Mites",
        "treatment": [
            "Apply miticide or insecticidal soap",
            "Increase humidity around plants",
            "Introduce predatory mites (biological control)",
            "Remove heavily infested leaves",
        ],
        "heatmap": None,
    },
    "tomato___target_spot": {
        "display": "Tomato Target Spot",
        "treatment": [
            "Apply azoxystrobin or chlorothalonil fungicide",
            "Avoid overhead irrigation",
            "Maintain crop rotation schedule",
        ],
        "heatmap": None,
    },
    "tomato___tomato_yellow_leaf_curl_virus": {
        "display": "Tomato Yellow Leaf Curl Virus",
        "treatment": [
            "Control whitefly vectors with imidacloprid",
            "Remove and destroy infected plants immediately",
            "Use reflective mulches to repel whiteflies",
            "Plant resistant varieties next season",
        ],
        "heatmap": None,
    },
    "tomato___tomato_mosaic_virus": {
        "display": "Tomato Mosaic Virus",
        "treatment": [
            "Remove and destroy infected plants",
            "Disinfect tools with 10% bleach solution",
            "Wash hands thoroughly before handling plants",
            "Plant virus-resistant tomato varieties",
        ],
        "heatmap": None,
    },
    # Potato
    "potato___early_blight": {
        "display": "Potato Early Blight",
        "treatment": [
            "Apply chlorothalonil or mancozeb fungicide",
            "Ensure adequate potassium fertilisation",
            "Remove infected foliage promptly",
            "Avoid overhead irrigation",
        ],
        "heatmap": None,
    },
    "potato___late_blight": {
        "display": "Potato Late Blight",
        "treatment": [
            "Apply metalaxyl-based fungicide immediately",
            "Hill up soil around plants to protect tubers",
            "Destroy infected haulm before harvest",
            "Use certified disease-free seed potatoes",
        ],
        "heatmap": None,
    },
    # Apple
    "apple___apple_scab": {
        "display": "Apple Scab",
        "treatment": [
            "Apply captan or myclobutanil fungicide at green-tip stage",
            "Rake and destroy fallen leaves",
            "Prune for open canopy and air circulation",
            "Plant scab-resistant apple varieties",
        ],
        "heatmap": None,
    },
    "apple___black_rot": {
        "display": "Apple Black Rot",
        "treatment": [
            "Prune out dead or diseased wood",
            "Apply fungicide during bloom period",
            "Remove mummified fruit from trees",
            "Maintain tree vigour with balanced fertilisation",
        ],
        "heatmap": None,
    },
    "apple___cedar_apple_rust": {
        "display": "Apple Cedar Rust",
        "treatment": [
            "Apply myclobutanil fungicide in spring",
            "Remove nearby eastern red cedar trees if possible",
            "Plant rust-resistant apple cultivars",
        ],
        "heatmap": None,
    },
    # Wheat
    "wheat___rust": {
        "display": "Wheat Stem Rust",
        "treatment": [
            "Apply triazole-based fungicide at first sign of infection",
            "Use rust-resistant wheat varieties next season",
            "Monitor surrounding fields for spread",
            "Harvest early if infection is severe",
        ],
        "heatmap": "heatmap_wheat_rust.jpg",
    },
    # Rice
    "rice___blast": {
        "display": "Rice Blast",
        "treatment": [
            "Apply tricyclazole or isoprothiolane fungicide",
            "Maintain optimal water depth in paddies",
            "Avoid excessive nitrogen application",
            "Plant blast-resistant varieties",
        ],
        "heatmap": "heatmap_rice_blast.jpg",
    },
    # Corn / Maize
    "corn_(maize)___cercospora_leaf_spot gray_leaf_spot": {
        "display": "Corn Gray Leaf Spot",
        "treatment": [
            "Apply strobilurin fungicide at tasseling",
            "Plant resistant hybrid varieties",
            "Rotate with non-host crops",
            "Till crop residue after harvest",
        ],
        "heatmap": None,
    },
    "corn_(maize)___common_rust_": {
        "display": "Corn Common Rust",
        "treatment": [
            "Apply fungicide if infection occurs before tasseling",
            "Use rust-resistant corn hybrids",
            "Monitor regularly during cool humid weather",
        ],
        "heatmap": None,
    },
    "corn_(maize)___northern_leaf_blight": {
        "display": "Corn Northern Leaf Blight",
        "treatment": [
            "Apply propiconazole or azoxystrobin fungicide",
            "Use resistant hybrids",
            "Rotate crops and till residue",
        ],
        "heatmap": None,
    },
    # Grape
    "grape___black_rot": {
        "display": "Grape Black Rot",
        "treatment": [
            "Apply myclobutanil before bloom",
            "Remove mummified berries and infected canes",
            "Ensure good canopy ventilation by pruning",
        ],
        "heatmap": None,
    },
    "grape___esca_(black_measles)": {
        "display": "Grape Esca (Black Measles)",
        "treatment": [
            "Prune during dry weather and seal wounds",
            "Remove and destroy infected wood",
            "Apply fungicide to pruning wounds",
        ],
        "heatmap": None,
    },
    "grape___leaf_blight_(isariopsis_leaf_spot)": {
        "display": "Grape Leaf Blight",
        "treatment": [
            "Apply copper-based fungicide",
            "Improve air circulation through canopy management",
            "Remove infected leaves promptly",
        ],
        "heatmap": None,
    },
    # Healthy catch-all
    "healthy": {
        "display": "Healthy — No Disease Detected",
        "treatment": [
            "Continue current crop management practices",
            "Schedule routine monitoring every 2 weeks",
            "Maintain balanced fertilisation programme",
        ],
        "heatmap": None,
    },
}

# Generic fallback for unknown class names
DEFAULT_TREATMENT = {
    "display": "Disease Detected",
    "treatment": [
        "Consult a local agricultural extension officer",
        "Isolate affected plants to prevent spread",
        "Document symptoms for specialist diagnosis",
    ],
    "heatmap": None,
}

# ---------------------------------------------------------------------------
# Load model + label map
# ---------------------------------------------------------------------------
_MODEL        = None
_INDEX_TO_CLASS = {}   # { 0: "Tomato___Early_blight", 1: ... }
_NUM_CLASSES  = 0

def _load_model():
    global _MODEL, _INDEX_TO_CLASS, _NUM_CLASSES

    base_dir    = os.path.dirname(__file__)
    model_path  = os.path.join(base_dir, "disease_classifier.h5")
    labels_path = os.path.join(base_dir, "disease_labels.json")

    if not os.path.exists(model_path):
        logger.warning(
            "disease_classifier.h5 not found — MOCK mode active.\n"
            "  Run: python train_disease_model.py --data_dir <path>\n"
            "  Then copy disease_classifier.h5 + disease_labels.json here."
        )
        return False

    # Load label map produced by training script
    if os.path.exists(labels_path):
        with open(labels_path) as f:
            raw = json.load(f)
        # Keys may be strings ("0", "1"…) — normalise to int
        _INDEX_TO_CLASS = {int(k): v for k, v in raw.items()}
        logger.info("Loaded %d disease labels from %s", len(_INDEX_TO_CLASS), labels_path)
    else:
        logger.warning("disease_labels.json not found — class names will be raw indices.")

    try:
        import tensorflow as tf
        _MODEL = tf.keras.models.load_model(model_path)
        _NUM_CLASSES = _MODEL.output_shape[-1]
        logger.info("Disease model loaded (%d classes)", _NUM_CLASSES)
        return True
    except ImportError:
        logger.warning("TensorFlow not installed — MOCK mode active.")
        return False
    except Exception as e:
        logger.error("Failed to load disease model: %s", e)
        return False

_MODEL_READY = _load_model()

# ---------------------------------------------------------------------------
# Public inference function
# ---------------------------------------------------------------------------

def predict_disease(image_path: str) -> dict:
    if _MODEL_READY and _MODEL is not None:
        return _real_inference(image_path)
    return _mock_inference(image_path)


def _real_inference(image_path: str) -> dict:
    import tensorflow as tf
    import numpy as np

    img = tf.keras.utils.load_img(image_path, target_size=(224, 224))
    arr = tf.keras.utils.img_to_array(img) / 255.0
    arr = np.expand_dims(arr, axis=0)

    preds      = _MODEL.predict(arr, verbose=0)[0]
    top_idx    = int(np.argmax(preds))
    confidence = float(preds[top_idx])

    # Map index → raw class name from training script
    raw_label = _INDEX_TO_CLASS.get(top_idx, f"class_{top_idx}")
    logger.info("Real inference: %s (%.2f)", raw_label, confidence)

    return _build_response(raw_label, confidence)


def _mock_inference(image_path: str) -> dict:
    """Deterministic mock — same image always gives the same result."""
    seed = sum(ord(c) for c in os.path.basename(image_path))
    rng  = random.Random(seed)

    demo_labels = [
        "tomato___early_blight",
        "tomato___late_blight",
        "wheat___rust",
        "rice___blast",
        "healthy",
    ]
    weights = [0.25, 0.20, 0.15, 0.15, 0.25]
    label      = rng.choices(demo_labels, weights=weights, k=1)[0]
    confidence = round(rng.uniform(0.82, 0.97), 2)

    logger.info("MOCK inference: %s (%.2f)", label, confidence)
    return _build_response(label, confidence)


def _build_response(raw_label: str, confidence: float) -> dict:
    """
    Look up treatment info using a normalised key.
    Handles both Kaggle folder names (Tomato___Early_blight)
    and our short keys (tomato___early_blight).
    """
    normalised = raw_label.lower().replace(" ", "_")

    # Direct hit
    info = TREATMENT_CATALOGUE.get(normalised)

    # Partial match — e.g. dataset uses "Tomato___Tomato_Early_blight"
    if info is None:
        for key in TREATMENT_CATALOGUE:
            if key in normalised or normalised in key:
                info = TREATMENT_CATALOGUE[key]
                break

    # "healthy" catch-all
    if info is None and "healthy" in normalised:
        info = TREATMENT_CATALOGUE["healthy"]

    if info is None:
        logger.warning("No catalogue entry for '%s' — using default.", raw_label)
        info = {**DEFAULT_TREATMENT, "display": raw_label.replace("_", " ").title()}

    heatmap_url = (
        f"/static/heatmaps/{info['heatmap']}" if info.get("heatmap") else None
    )

    return {
        "disease":     info["display"],
        "confidence":  round(confidence, 4),
        "treatment":   info["treatment"],
        "heatmap_url": heatmap_url,
    }

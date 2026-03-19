"""
verify_models.py
================
Run this on the TRAINING laptop after training to confirm both
model files are saved correctly and will load cleanly on the backend.

Usage:
  python verify_models.py --models_dir ./trained_models
"""

import argparse
import json
import os
import sys

def verify_disease_model(models_dir: str) -> bool:
    h5_path     = os.path.join(models_dir, "disease_classifier.h5")
    labels_path = os.path.join(models_dir, "class_labels.json")

    print("\n── Disease Model ──────────────────────────")

    if not os.path.exists(h5_path):
        print(f"  ❌ MISSING: {h5_path}")
        return False
    print(f"  ✅ Found:   {h5_path}  ({os.path.getsize(h5_path)/1e6:.1f} MB)")

    if not os.path.exists(labels_path):
        print(f"  ❌ MISSING: {labels_path}")
        return False
    with open(labels_path) as f:
        labels = json.load(f)
    print(f"  ✅ Found:   {labels_path}  ({len(labels)} classes)")

    # Load model and do a dummy inference
    try:
        import tensorflow as tf
        import numpy as np
        model = tf.keras.models.load_model(h5_path)
        print(f"  ✅ Model loads OK. Input shape: {model.input_shape}")

        dummy = np.zeros((1, 224, 224, 3), dtype=np.float32)
        preds = model.predict(dummy, verbose=0)
        print(f"  ✅ Inference OK. Output shape: {preds.shape}  (expected: (1, {len(labels)}))")

        if preds.shape[1] != len(labels):
            print(f"  ⚠️  WARNING: model outputs {preds.shape[1]} classes but class_labels.json has {len(labels)}. Check CLASS_LABELS order.")
            return False

        top = int(np.argmax(preds[0]))
        print(f"  ✅ Top class on dummy input: [{top}] {labels[top]}")
        return True

    except ImportError:
        print("  ⚠️  TensorFlow not installed — skipping inference check.")
        return True
    except Exception as e:
        print(f"  ❌ Error loading model: {e}")
        return False


def verify_yield_model(models_dir: str) -> bool:
    pkl_path = os.path.join(models_dir, "yield_model.pkl")

    print("\n── Yield Model ────────────────────────────")

    if not os.path.exists(pkl_path):
        print(f"  ❌ MISSING: {pkl_path}")
        return False
    print(f"  ✅ Found:   {pkl_path}  ({os.path.getsize(pkl_path)/1e6:.2f} MB)")

    try:
        import joblib
        import pandas as pd

        bundle = joblib.load(pkl_path)
        assert "model"  in bundle, "Bundle missing 'model' key"
        assert "meta"   in bundle, "Bundle missing 'meta' key"
        print(f"  ✅ Bundle loads OK")
        print(f"     Crops: {bundle['meta']['crop_types']}")
        print(f"     Soils: {bundle['meta']['soil_types']}")
        print(f"     R²   : {bundle['meta'].get('r2', 'n/a')}")
        print(f"     MAE  : {bundle['meta'].get('mae', 'n/a')} T/ha")

        # Test inference
        model = bundle["model"]
        test_input = pd.DataFrame([{
            "temperature": 25.0,
            "humidity":    65.0,
            "rainfall":    200.0,
            "soil_type":   "Loamy",
            "crop_type":   "Tomato",
        }])
        result = model.predict(test_input)[0]
        print(f"  ✅ Inference OK. Test prediction: {result:.2f} T/ha")
        return True

    except ImportError:
        print("  ⚠️  joblib / pandas not installed — skipping inference check.")
        return True
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return False


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--models_dir", default="./trained_models")
    args = parser.parse_args()

    print(f"\n{'='*50}")
    print(f"  AgriAI Model Verification")
    print(f"  Directory: {args.models_dir}")
    print(f"{'='*50}")

    disease_ok = verify_disease_model(args.models_dir)
    yield_ok   = verify_yield_model(args.models_dir)

    print(f"\n{'='*50}")
    if disease_ok and yield_ok:
        print("  ✅ ALL CHECKS PASSED")
        print("""
  Next steps — copy these files to your backend machine:
    trained_models/disease_classifier.h5  → backend/models/
    trained_models/class_labels.json      → backend/models/
    trained_models/yield_model.pkl        → backend/models/
""")
        sys.exit(0)
    else:
        print("  ❌ SOME CHECKS FAILED — fix errors before deploying")
        sys.exit(1)


if __name__ == "__main__":
    main()

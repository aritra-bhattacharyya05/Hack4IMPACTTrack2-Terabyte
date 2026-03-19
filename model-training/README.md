# AgriAI Assist — Model Training Guide

Run these scripts on your **training laptop**.
Drop the output files into the **backend machine** when done.

---

## Setup (training laptop)

```bash
pip install -r train_requirements.txt
```

---

## 1 — Disease Detection Model (TensorFlow / Keras)

### Dataset
Download from Kaggle: `vipoooool/new-plant-diseases-dataset`

After unzipping you should have:
```
New Plant Diseases Dataset(Augmented)/
  train/   ← 70,295 images across 38 classes
  valid/   ← 17,572 images across 38 classes
```

### Train
```bash
python train_disease_model.py \
  --data_dir "/path/to/New Plant Diseases Dataset(Augmented)" \
  --output_dir ./trained_models
```

Training runs in two phases:
- **Phase 1** (15 epochs): Classification head only, EfficientNetB0 base frozen
- **Phase 2** (10 epochs): Fine-tune top 30 layers of EfficientNetB0

Expected accuracy: **95–98%** on validation set.
Expected time: ~2–4 hours on a mid-range GPU.

### Output files
```
trained_models/
  disease_classifier.h5    ← main model file
  class_labels.json        ← 38 class names in index order
```

---

## 2 — Yield Prediction Model (scikit-learn)

### Option A — Use synthetic data (works immediately, no dataset needed)
```bash
python train_yield_model.py --output_dir ./trained_models
```

### Option B — Use your own CSV dataset
Your CSV must have these columns:
```
temperature, humidity, rainfall, soil_type, crop_type, yield
```
where `yield` is in Tonnes/Hectare.

```bash
python train_yield_model.py \
  --csv_path /path/to/your_dataset.csv \
  --output_dir ./trained_models
```

Expected R²: **0.94–0.97** (synthetic), varies with real data.
Expected time: < 5 minutes.

### Output files
```
trained_models/
  yield_model.pkl          ← sklearn pipeline bundle
  yield_model_meta.json    ← metadata (crop types, MAE, R²)
```

---

## 3 — Verify before transferring

```bash
python verify_models.py --models_dir ./trained_models
```

All checks must pass (✅) before you copy the files.

---

## 4 — Transfer to backend machine

Copy exactly these 3 files to your backend server:

| File | Destination |
|------|-------------|
| `trained_models/disease_classifier.h5` | `agriai-assist/backend/models/` |
| `trained_models/class_labels.json`      | `agriai-assist/backend/models/` |
| `trained_models/yield_model.pkl`        | `agriai-assist/backend/models/` |

Also uncomment the ML lines in `backend/requirements.txt`:
```
tensorflow==2.16.1
scikit-learn==1.4.2
joblib==1.4.2
numpy==1.26.4
Pillow==10.3.0
```

Then restart the backend:
```bash
uvicorn main:app --reload --port 8000
```

You should see in the logs:
```
Disease classifier loaded (38 classes)
Yield model loaded from ...
```

---

## Class labels (38 classes)

These are the exact Kaggle folder names used as class indices.
**Do not reorder them** — the index must match `class_labels.json`.

```
 0  Apple___Apple_scab
 1  Apple___Black_rot
 2  Apple___Cedar_apple_rust
 3  Apple___healthy
 4  Blueberry___healthy
 5  Cherry_(including_sour)___Powdery_mildew
 6  Cherry_(including_sour)___healthy
 7  Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot
 8  Corn_(maize)___Common_rust_
 9  Corn_(maize)___Northern_Leaf_Blight
10  Corn_(maize)___healthy
11  Grape___Black_rot
12  Grape___Esca_(Black_Measles)
13  Grape___Leaf_blight_(Isariopsis_Leaf_Spot)
14  Grape___healthy
15  Orange___Haunglongbing_(Citrus_greening)
16  Peach___Bacterial_spot
17  Peach___healthy
18  Pepper,_bell___Bacterial_spot
19  Pepper,_bell___healthy
20  Potato___Early_blight
21  Potato___Late_blight
22  Potato___healthy
23  Raspberry___healthy
24  Soybean___healthy
25  Squash___Powdery_mildew
26  Strawberry___Leaf_scorch
27  Strawberry___healthy
28  Tomato___Bacterial_spot
29  Tomato___Early_blight
30  Tomato___Late_blight
31  Tomato___Leaf_Mold
32  Tomato___Septoria_leaf_spot
33  Tomato___Spider_mites Two-spotted_spider_mite
34  Tomato___Target_Spot
35  Tomato___Tomato_Yellow_Leaf_Curl_Virus
36  Tomato___Tomato_mosaic_virus
37  Tomato___healthy
```

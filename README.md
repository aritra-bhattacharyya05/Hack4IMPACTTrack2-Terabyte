# AgriAI Assist 🌿

AI-powered crop disease detection and yield prediction — full-stack hackathon project.

---

## Project Structure

```
agriai-assist/
├── backend/                   # FastAPI backend
│   ├── main.py                # App entry point, CORS, routes
│   ├── requirements.txt       # Python dependencies
│   ├── models/
│   │   ├── disease_model.py   # Disease detection inference
│   │   └── yield_model.py     # Yield prediction inference
│   ├── static/
│   │   └── heatmaps/          # AI-generated heatmap images go here
│   └── uploads/               # Temp upload storage (auto-cleaned)
│
├── src/                       # React frontend (Vite + Tailwind)
│   ├── services/
│   │   └── api.js             # ALL API calls, retry logic, fallbacks
│   ├── hooks/
│   │   └── useToast.js        # Toast notification hook
│   ├── components/
│   │   ├── ConfidenceBar.jsx  # Reusable AI confidence bar
│   │   └── ToastContainer.jsx # Toast renderer
│   ├── pages/
│   │   ├── Dashboard.jsx      # Home screen
│   │   ├── DiseaseDetection.jsx
│   │   ├── YieldPrediction.jsx
│   │   └── Analytics.jsx
│   ├── App.jsx                # Router + navigation shell
│   ├── main.jsx               # React entry point
│   └── index.css              # Tailwind + global styles
│
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── package.json
└── .env.example
```

---

## Quick Start

### 1. Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend will be available at: **http://127.0.0.1:8000**

Interactive API docs: **http://127.0.0.1:8000/docs**

### 2. Frontend (React + Vite)

```bash
# From the project root
cp .env.example .env
npm install
npm run dev
```

Frontend will be available at: **http://localhost:5173**

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/predict-disease` | Image → disease detection |
| POST | `/predict-yield` | JSON params → yield forecast |

### POST `/predict-disease`

```
Content-Type: multipart/form-data
Body: file=<image file>
```

Response:
```json
{
  "disease": "Tomato Early Blight",
  "confidence": 0.92,
  "treatment": ["Apply copper-based fungicide...", "..."],
  "heatmap_url": "/static/heatmaps/heatmap_blight.jpg"
}
```

### POST `/predict-yield`

```json
{
  "temperature": 25,
  "humidity": 60,
  "rainfall": 200,
  "soil_type": "Loamy",
  "crop_type": "Tomato"
}
```

Response:
```json
{
  "predicted_yield": "3.4 Tonnes/Hectare",
  "confidence": 0.91
}
```

---

## Adding Real ML Models

### Disease Detection Model

1. Train a CNN classifier (e.g. EfficientNetB0) on PlantVillage dataset
2. Save as `backend/models/disease_classifier.h5`
3. Ensure `requirements.txt` includes `tensorflow` (uncomment the line)
4. The `disease_model.py` will auto-detect and use it

Class labels (index order must match):
```
tomato_early_blight, tomato_late_blight, wheat_rust, rice_blast, healthy
```

### Yield Prediction Model

1. Train a regression model (e.g. RandomForestRegressor)
2. Save as a joblib bundle: `{"model": model, "encoder": encoder}`
3. Place at `backend/models/yield_model.pkl`
4. Uncomment `scikit-learn` and `joblib` in `requirements.txt`

---

## Demo Reliability

The system is designed to **never break during a demo**:

- `services/api.js` auto-retries on network failures (2 retries, 800ms delay)
- If the backend is unreachable after retries → realistic fallback data is shown
- A small "Demo data" badge appears on fallback results (honest but non-breaking)
- Loading states and skeletons prevent any layout flash

---

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, Vite 5 |
| Styling | Tailwind CSS 3 (custom design tokens) |
| Backend | FastAPI, Uvicorn |
| ML (optional) | TensorFlow / scikit-learn |
| Fonts | Manrope, Inter, Material Symbols |

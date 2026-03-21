# AgriAI Assist

AI-powered crop disease detection and crop yield prediction for Indian farmers.

## HACK4IMPACT Track 2

Team: Terabyte

| Name | Roll Number |
|---|---|
| Aritra Bhattacharyya | 23052551 |
| Alimpan Mukherjee | 23051973 |
| Ankit Roy | 23051327 |
| Aditya Singh | 23052212 |

Domain: Smart Agriculture and Food Security  
Problem Statement: AI-Powered Crop Disease Detection and Yield Prediction System

## What It Does

- Detects crop diseases from leaf images (38 classes, ResNet50 model)
- Generates remedy suggestions for detected diseases
- Predicts yield from farm inputs (area, rainfall, fertilizer, pesticide)
- Falls back to demo responses when model/API is unavailable

## Tech Stack

- Frontend: React, React Router, Axios
- Backend: FastAPI, Uvicorn
- ML: PyTorch (disease), XGBoost/Scikit-learn (yield)
- Model hosting: Hugging Face Hub

## Project Structure

```text
agriai-fullstack/
  backend/
    main.py
    requirements.txt
    models/loader.py
    routes/{health.py,disease.py,yield_pred.py}
    utils/{image_utils.py,remedy.py}
  frontend/
    package.json
    src/{components,pages,services,hooks}
```

## Quick Start

### 1) Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### 2) Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm start
```

## API Endpoints

- GET `/health`
- POST `/api/predict-disease` (multipart image)
- POST `/api/get-remedy` (JSON)
- POST `/api/predict-yield` (JSON)

## Notes

- First backend start downloads model files from Hugging Face.
- If the yield model fails to load, the app returns demo yield output.
- For remedy generation, set `AIPIPE_TOKEN` in backend environment variables (optional).

## Future Improvements

- Batch image detection
- Multilingual support
- Weather-aware recommendations
- Mobile app

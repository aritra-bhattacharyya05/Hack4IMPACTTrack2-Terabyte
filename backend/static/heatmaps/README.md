# Heatmaps

Place your AI-generated disease heatmap images here.

Expected filenames (referenced by `disease_model.py`):
- `heatmap_blight.jpg`
- `heatmap_late_blight.jpg`
- `heatmap_wheat_rust.jpg`
- `heatmap_rice_blast.jpg`

These are served at `/static/heatmaps/<filename>` by FastAPI's static file handler.

"""
utils/image_utils.py
Image preprocessing for disease detection model.
Matches transforms used in hackathon.ipynb val_transforms.
"""
import io
import logging
import torch
from PIL import Image
from torchvision import transforms

logger = logging.getLogger("agriai.image")

# ── Same transforms as hackathon.ipynb val_transforms ─────────────
_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std =[0.229, 0.224, 0.225],
    ),
])


def preprocess_image(image_bytes: bytes, device: torch.device) -> torch.Tensor:
    """
    Convert raw image bytes → normalised tensor ready for ResNet50.
    Returns shape: [1, 3, 224, 224]
    """
    try:
        img    = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        tensor = _transform(img).unsqueeze(0).to(device)
        return tensor
    except Exception as e:
        logger.error(f"Image preprocessing failed: {e}")
        raise ValueError(f"Could not process image: {e}")

"""
train_disease_model.py
======================
Trains an EfficientNetB0 classifier on the Kaggle Crop Disease dataset
and saves it as  disease_classifier.h5  ready to drop into:
  agriai-assist/backend/models/disease_classifier.h5

Kaggle dataset: "vipoooool/new-plant-diseases-dataset"
  → after unzip you get:
      New Plant Diseases Dataset(Augmented)/
        train/   (70,295 images, 38 classes)
        valid/   (17,572 images, 38 classes)

Usage:
  pip install -r train_requirements.txt
  python train_disease_model.py --data_dir /path/to/dataset_root
"""

import argparse
import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models, callbacks
from tensorflow.keras.applications import EfficientNetB0

# ---------------------------------------------------------------------------
# 38 class labels — exact folder names from the Kaggle dataset.
# The ORDER here is the index the model outputs. Do NOT change it.
# This is saved alongside the model as  class_labels.json
# ---------------------------------------------------------------------------
CLASS_LABELS = [
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
    "Apple___healthy",
    "Blueberry___healthy",
    "Cherry_(including_sour)___Powdery_mildew",
    "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight",
    "Corn_(maize)___healthy",
    "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot",
    "Peach___healthy",
    "Pepper,_bell___Bacterial_spot",
    "Pepper,_bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch",
    "Strawberry___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy",
]

IMG_SIZE   = (224, 224)
BATCH_SIZE = 32
EPOCHS     = 15   # increase to 30+ for better accuracy
NUM_CLASSES = len(CLASS_LABELS)  # 38


def build_model(num_classes: int) -> tf.keras.Model:
    """EfficientNetB0 + custom classification head."""
    base = EfficientNetB0(
        include_top=False,
        weights="imagenet",
        input_shape=(*IMG_SIZE, 3),
    )
    # Freeze base initially; we'll fine-tune top layers later
    base.trainable = False

    model = models.Sequential([
        base,
        layers.GlobalAveragePooling2D(),
        layers.BatchNormalization(),
        layers.Dropout(0.3),
        layers.Dense(256, activation="relu"),
        layers.Dropout(0.2),
        layers.Dense(num_classes, activation="softmax"),
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def get_data_generators(data_dir: str):
    """Build train / validation ImageDataGenerators."""
    train_dir = os.path.join(data_dir, "train")
    valid_dir = os.path.join(data_dir, "valid")

    # EfficientNet expects pixel values in [0, 255] — preprocessing is built in
    train_gen = tf.keras.preprocessing.image.ImageDataGenerator(
        rescale=1.0 / 255,
        rotation_range=20,
        width_shift_range=0.15,
        height_shift_range=0.15,
        shear_range=0.1,
        zoom_range=0.15,
        horizontal_flip=True,
        fill_mode="nearest",
    )
    valid_gen = tf.keras.preprocessing.image.ImageDataGenerator(rescale=1.0 / 255)

    train_data = train_gen.flow_from_directory(
        train_dir,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        classes=CLASS_LABELS,   # enforce fixed index order
        shuffle=True,
    )
    valid_data = valid_gen.flow_from_directory(
        valid_dir,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        classes=CLASS_LABELS,
        shuffle=False,
    )
    return train_data, valid_data


def train(data_dir: str, output_dir: str):
    os.makedirs(output_dir, exist_ok=True)

    print(f"\n{'='*60}")
    print(f"  AgriAI — Disease Model Training")
    print(f"  Dataset : {data_dir}")
    print(f"  Classes : {NUM_CLASSES}")
    print(f"  Output  : {output_dir}")
    print(f"{'='*60}\n")

    train_data, valid_data = get_data_generators(data_dir)

    model = build_model(NUM_CLASSES)
    model.summary()

    cb = [
        callbacks.ModelCheckpoint(
            filepath=os.path.join(output_dir, "disease_classifier_best.h5"),
            monitor="val_accuracy",
            save_best_only=True,
            verbose=1,
        ),
        callbacks.EarlyStopping(
            monitor="val_accuracy",
            patience=5,
            restore_best_weights=True,
            verbose=1,
        ),
        callbacks.ReduceLROnPlateau(
            monitor="val_loss",
            factor=0.3,
            patience=3,
            min_lr=1e-6,
            verbose=1,
        ),
    ]

    # ── Phase 1: train classification head only ──
    print("\n[Phase 1] Training classification head (base frozen)…")
    model.fit(
        train_data,
        validation_data=valid_data,
        epochs=EPOCHS,
        callbacks=cb,
    )

    # ── Phase 2: fine-tune top 30 layers of EfficientNet ──
    print("\n[Phase 2] Fine-tuning top 30 EfficientNet layers…")
    base_model = model.layers[0]
    base_model.trainable = True
    for layer in base_model.layers[:-30]:
        layer.trainable = False

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    model.fit(
        train_data,
        validation_data=valid_data,
        epochs=10,
        callbacks=cb,
    )

    # ── Save final model ──
    final_path = os.path.join(output_dir, "disease_classifier.h5")
    model.save(final_path)
    print(f"\n✅ Model saved → {final_path}")

    # ── Save class labels alongside the model ──
    labels_path = os.path.join(output_dir, "class_labels.json")
    with open(labels_path, "w") as f:
        json.dump(CLASS_LABELS, f, indent=2)
    print(f"✅ Class labels saved → {labels_path}")

    # ── Quick evaluation ──
    print("\nFinal evaluation on validation set:")
    loss, acc = model.evaluate(valid_data, verbose=1)
    print(f"  Validation accuracy : {acc*100:.2f}%")
    print(f"  Validation loss     : {loss:.4f}")

    print(f"""
{'='*60}
  DONE. Copy these two files to your backend:
    {final_path}
    → agriai-assist/backend/models/disease_classifier.h5

    {labels_path}
    → agriai-assist/backend/models/class_labels.json
{'='*60}
""")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--data_dir",
        required=True,
        help="Path to the dataset root containing train/ and valid/ folders",
    )
    parser.add_argument(
        "--output_dir",
        default="./trained_models",
        help="Where to save the trained model files",
    )
    args = parser.parse_args()
    train(args.data_dir, args.output_dir)

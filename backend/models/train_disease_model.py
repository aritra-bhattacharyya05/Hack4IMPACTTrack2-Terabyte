"""
train_disease_model.py
----------------------
Train a crop disease classifier on the Kaggle Plant Disease dataset
and save it in the exact format expected by agriai-assist/backend/models/disease_model.py

Dataset: https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset
         OR https://www.kaggle.com/datasets/abdallahalidev/plantvillage-dataset

Usage:
    pip install tensorflow scikit-learn matplotlib
    python train_disease_model.py --data_dir /path/to/dataset --epochs 15
"""

import os
import argparse
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import EfficientNetB0
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.metrics import classification_report

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
IMG_SIZE    = (224, 224)
BATCH_SIZE  = 32
EPOCHS      = 15
SEED        = 42

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
parser = argparse.ArgumentParser()
parser.add_argument("--data_dir", type=str, required=True,
                    help="Path to dataset root (should contain train/ and valid/ subdirs)")
parser.add_argument("--epochs",   type=int, default=EPOCHS)
parser.add_argument("--output",   type=str, default="disease_classifier.h5",
                    help="Output path for the saved model")
args = parser.parse_args()

# ---------------------------------------------------------------------------
# Data generators
# ---------------------------------------------------------------------------
train_datagen = ImageDataGenerator(
    rescale=1.0 / 255,
    rotation_range=20,
    width_shift_range=0.15,
    height_shift_range=0.15,
    shear_range=0.1,
    zoom_range=0.15,
    horizontal_flip=True,
    fill_mode="nearest",
)

val_datagen = ImageDataGenerator(rescale=1.0 / 255)

train_dir = os.path.join(args.data_dir, "train")
valid_dir = os.path.join(args.data_dir, "valid")

train_gen = train_datagen.flow_from_directory(
    train_dir,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    seed=SEED,
)

val_gen = val_datagen.flow_from_directory(
    valid_dir,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    shuffle=False,
    seed=SEED,
)

NUM_CLASSES = train_gen.num_classes
print(f"\n✓ Found {NUM_CLASSES} classes")
print(f"  Train samples : {train_gen.samples}")
print(f"  Val samples   : {val_gen.samples}")

# ---------------------------------------------------------------------------
# Save class index mapping — IMPORTANT for backend label alignment
# ---------------------------------------------------------------------------
# class_indices = { "Apple___Apple_scab": 0, "Apple___Black_rot": 1, ... }
class_indices = train_gen.class_indices
# Invert to { 0: "Apple___Apple_scab", ... }
index_to_class = {v: k for k, v in class_indices.items()}

labels_path = args.output.replace(".h5", "_labels.json")
with open(labels_path, "w") as f:
    json.dump(index_to_class, f, indent=2)
print(f"\n✓ Class label map saved to: {labels_path}")
print("  ← Copy this file to backend/models/disease_labels.json")

# ---------------------------------------------------------------------------
# Model — EfficientNetB0 with transfer learning
# ---------------------------------------------------------------------------
base_model = EfficientNetB0(
    weights="imagenet",
    include_top=False,
    input_shape=(*IMG_SIZE, 3),
)
# Freeze base initially for fast convergence
base_model.trainable = False

model = models.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.BatchNormalization(),
    layers.Dense(256, activation="relu"),
    layers.Dropout(0.4),
    layers.Dense(NUM_CLASSES, activation="softmax"),
])

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
    loss="categorical_crossentropy",
    metrics=["accuracy"],
)

model.summary()

# ---------------------------------------------------------------------------
# Phase 1 — train top layers only
# ---------------------------------------------------------------------------
print("\n── Phase 1: Training classifier head ──")
callbacks = [
    tf.keras.callbacks.EarlyStopping(patience=4, restore_best_weights=True, monitor="val_accuracy"),
    tf.keras.callbacks.ReduceLROnPlateau(factor=0.3, patience=2, monitor="val_loss"),
    tf.keras.callbacks.ModelCheckpoint(args.output, save_best_only=True, monitor="val_accuracy"),
]

history = model.fit(
    train_gen,
    epochs=args.epochs,
    validation_data=val_gen,
    callbacks=callbacks,
)

# ---------------------------------------------------------------------------
# Phase 2 — fine-tune last 30 layers of base model
# ---------------------------------------------------------------------------
print("\n── Phase 2: Fine-tuning base model ──")
base_model.trainable = True
# Freeze all but the last 30 layers
for layer in base_model.layers[:-30]:
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
    loss="categorical_crossentropy",
    metrics=["accuracy"],
)

model.fit(
    train_gen,
    epochs=10,
    validation_data=val_gen,
    callbacks=callbacks,
)

# ---------------------------------------------------------------------------
# Evaluation
# ---------------------------------------------------------------------------
print("\n── Evaluating on validation set ──")
val_gen.reset()
preds     = model.predict(val_gen, verbose=1)
pred_idxs = np.argmax(preds, axis=1)
true_idxs = val_gen.classes

print("\nClassification Report:")
print(classification_report(
    true_idxs,
    pred_idxs,
    target_names=[index_to_class[i] for i in range(NUM_CLASSES)],
))

# ---------------------------------------------------------------------------
# Save final model
# ---------------------------------------------------------------------------
model.save(args.output)
print(f"\n✅ Model saved to: {args.output}")
print(f"   Copy to: agriai-assist/backend/models/disease_classifier.h5")
print(f"\n✅ Labels saved to: {labels_path}")
print(f"   Copy to: agriai-assist/backend/models/disease_labels.json")

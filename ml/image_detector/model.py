import os
import numpy as np
from PIL import Image
from transformers import AutoImageProcessor
from optimum.onnxruntime import ORTModelForImageClassification
import onnxruntime

import gc

# LRU Cache (maxsize=1) to prevent RAM explosion.
# Unloads previous model when a new one is requested.
_current_loaded_model_name = None
_current_loaded_model = None


def _get_provider() -> str:
    available = onnxruntime.get_available_providers()
    for p in available:
        if p != "AzureExecutionProvider":
            return p
    return "CPUExecutionProvider"


def load_classifier(folder_name: str):
    """Load (and cache) an ONNX image classifier from ml/models/<folder_name>/."""
    global _current_loaded_model_name, _current_loaded_model
    
    if folder_name == _current_loaded_model_name:
        return _current_loaded_model
        
    # Clear old model to free RAM
    if _current_loaded_model is not None:
        print(f"Unloading previous image classifier '{_current_loaded_model_name}' to free RAM...")
        del _current_loaded_model
        gc.collect()

    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    model_path = os.path.join(base_dir, "ml", "models", folder_name)

    print(f"Loading image classifier '{folder_name}' from {model_path}...")
    processor = AutoImageProcessor.from_pretrained(model_path, use_fast=True)

    provider = _get_provider()
    
    # Memory optimization: limit threads to prevent massive RAM/CPU overhead 
    # when running inside Celery workers.
    session_options = onnxruntime.SessionOptions()
    session_options.intra_op_num_threads = 1
    session_options.inter_op_num_threads = 1
    
    model = ORTModelForImageClassification.from_pretrained(
        model_path, 
        provider=provider,
        session_options=session_options,
        file_name="model_quantized.onnx"
    )
    print(f"Image classifier '{folder_name}' (INT8) loaded successfully (provider: {provider}).")

    _current_loaded_model_name = folder_name
    _current_loaded_model = (processor, model)
    return _current_loaded_model


def predict_with_classifier(folder_name: str, image_path: str) -> dict:
    """Run a single named classifier against an image, return its raw label/confidence."""
    processor, model = load_classifier(folder_name)

    image = Image.open(image_path).convert("RGB")
    inputs = processor(images=image, return_tensors="np")

    outputs = model(**inputs)
    logits = outputs.logits

    exp_logits = np.exp(logits - np.max(logits, axis=-1, keepdims=True))
    probs = (exp_logits / exp_logits.sum(axis=-1, keepdims=True))[0].tolist()

    predicted_class_id = int(np.argmax(logits, axis=-1)[0])
    label = model.config.id2label[predicted_class_id]
    confidence = probs[predicted_class_id]

    return {
        "label": label,
        "confidence": confidence,
        "raw_scores": probs,
        "id2label": model.config.id2label,
    }


def preload_all():
    """Warm both classifiers at backend startup so the first request isn't slow."""
    load_classifier("image_onnx_gan")
    load_classifier("image_onnx_diffusion")

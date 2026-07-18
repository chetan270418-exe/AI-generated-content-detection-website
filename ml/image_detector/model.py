import os
import numpy as np
from PIL import Image
from transformers import AutoImageProcessor
from optimum.onnxruntime import ORTModelForImageClassification
import onnxruntime

class ImageDetectorModel:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(ImageDetectorModel, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, model_id: str = None):
        if self._initialized:
            return
            
        self.model_id = model_id or os.getenv("HF_MODEL_IMAGE", "umm-maybe/AI-image-detector")
        self.processor = None
        self.model = None
        self._initialized = True
        
    def load(self):
        """Load the ONNX model and processor from local disk."""
        if self.model is not None and self.processor is not None:
            return
            
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        model_path = os.path.join(base_dir, "ml", "models", "image_onnx")
        
        print(f"Loading ImageDetectorModel from {model_path}...")
        self.processor = AutoImageProcessor.from_pretrained(model_path, use_fast=True)
        
        # Use only providers that are actually available on this machine
        available = onnxruntime.get_available_providers()
        provider = "CPUExecutionProvider"
        for p in available:
            if p != "AzureExecutionProvider":
                provider = p
                break
        
        self.model = ORTModelForImageClassification.from_pretrained(
            model_path,
            provider=provider
        )
        print(f"Image model loaded successfully (provider: {provider}).")

    def predict(self, image_path: str) -> dict:
        """Predict whether an image is AI generated or real."""
        if self.model is None or self.processor is None:
            self.load()
            
        image = Image.open(image_path).convert("RGB")
        inputs = self.processor(images=image, return_tensors="np")
        
        outputs = self.model(**inputs)
        logits = outputs.logits
        
        # Apply softmax to get probabilities (numpy)
        exp_logits = np.exp(logits - np.max(logits, axis=-1, keepdims=True))
        probs = (exp_logits / exp_logits.sum(axis=-1, keepdims=True))[0].tolist()
        
        predicted_class_id = int(np.argmax(logits, axis=-1)[0])
        label = self.model.config.id2label[predicted_class_id]
        
        confidence = probs[predicted_class_id]
        
        return {
            "label": label,
            "confidence": confidence,
            "raw_scores": probs,
            "id2label": self.model.config.id2label
        }

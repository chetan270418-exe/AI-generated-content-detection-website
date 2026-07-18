import os
import numpy as np
from transformers import AutoTokenizer
from optimum.onnxruntime import ORTModelForSequenceClassification
import onnxruntime

class TextDetectorModel:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(TextDetectorModel, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, model_id: str = None):
        if self._initialized:
            return
            
        self.model_id = model_id or os.getenv("HF_MODEL_TEXT", "openai-community/roberta-base-openai-detector")
        self.tokenizer = None
        self.model = None
        self._initialized = True
        
    def load(self):
        """Load the ONNX model and tokenizer from local disk."""
        if self.model is not None and self.tokenizer is not None:
            return
            
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        model_path = os.path.join(base_dir, "ml", "models", "text_onnx")
        
        print(f"Loading TextDetectorModel from {model_path}...")
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        
        # Use only providers that are actually available on this machine
        available = onnxruntime.get_available_providers()
        provider = "CPUExecutionProvider"
        for p in available:
            if p != "AzureExecutionProvider":
                provider = p
                break
        
        self.model = ORTModelForSequenceClassification.from_pretrained(
            model_path,
            provider=provider
        )
        print(f"Text model loaded successfully (provider: {provider}).")

    def predict(self, text: str) -> dict:
        """Predict whether text is AI generated or human."""
        if self.model is None or self.tokenizer is None:
            self.load()
            
        inputs = self.tokenizer(
            text, 
            return_tensors="np", 
            truncation=True, 
            max_length=512
        )
        
        outputs = self.model(**inputs)
        logits = outputs.logits
        
        # Apply softmax (numpy)
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

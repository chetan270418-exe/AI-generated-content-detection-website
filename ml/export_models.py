import os
import argparse
from transformers import AutoImageProcessor, AutoTokenizer
from optimum.onnxruntime import ORTModelForImageClassification, ORTModelForSequenceClassification

def export_models():
    """
    Downloads and exports HuggingFace models to ONNX format locally,
    preventing the backend from having to do this on-the-fly.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(base_dir, "models")
    
    image_model_id = os.getenv("HF_MODEL_IMAGE", "umm-maybe/AI-image-detector")
    text_model_id = os.getenv("HF_MODEL_TEXT", "openai-community/roberta-base-openai-detector")
    
    image_onnx_dir = os.path.join(models_dir, "image_onnx")
    text_onnx_dir = os.path.join(models_dir, "text_onnx")
    
    os.makedirs(image_onnx_dir, exist_ok=True)
    os.makedirs(text_onnx_dir, exist_ok=True)
    
    print(f"Exporting Image Model ({image_model_id}) to ONNX...")
    processor = AutoImageProcessor.from_pretrained(image_model_id)
    processor.save_pretrained(image_onnx_dir)
    
    image_model = ORTModelForImageClassification.from_pretrained(image_model_id, export=True)
    image_model.save_pretrained(image_onnx_dir)
    print("Image model exported successfully.\n")
    
    print(f"Exporting Text Model ({text_model_id}) to ONNX...")
    tokenizer = AutoTokenizer.from_pretrained(text_model_id)
    tokenizer.save_pretrained(text_onnx_dir)
    
    text_model = ORTModelForSequenceClassification.from_pretrained(text_model_id, export=True)
    text_model.save_pretrained(text_onnx_dir)
    print("Text model exported successfully.\n")

if __name__ == "__main__":
    export_models()

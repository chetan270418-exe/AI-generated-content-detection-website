import os
from transformers import AutoImageProcessor, AutoTokenizer
from optimum.onnxruntime import ORTModelForImageClassification, ORTModelForSequenceClassification

# Each modality now exports TWO independent classifiers (see ml/common/ensemble.py
# for why) instead of one. Override with env vars if you want to swap either.
IMAGE_MODEL_GAN = os.getenv("HF_MODEL_IMAGE_GAN", "umm-maybe/AI-image-detector")
IMAGE_MODEL_DIFFUSION = os.getenv("HF_MODEL_IMAGE_DIFFUSION", "Organika/sdxl-detector")

TEXT_MODEL_QA = os.getenv("HF_MODEL_TEXT_QA", "Hello-SimpleAI/chatgpt-detector-roberta")
TEXT_MODEL_GPT2 = os.getenv("HF_MODEL_TEXT_GPT2", "openai-community/roberta-base-openai-detector")


def _export_image_model(model_id: str, folder_name: str, models_dir: str):
    out_dir = os.path.join(models_dir, folder_name)
    os.makedirs(out_dir, exist_ok=True)
    print(f"Exporting image model '{model_id}' -> {folder_name} ...")
    processor = AutoImageProcessor.from_pretrained(model_id)
    processor.save_pretrained(out_dir)
    model = ORTModelForImageClassification.from_pretrained(model_id, export=True)
    model.save_pretrained(out_dir)
    print(f"  done: {folder_name}\n")


def _export_text_model(model_id: str, folder_name: str, models_dir: str):
    out_dir = os.path.join(models_dir, folder_name)
    os.makedirs(out_dir, exist_ok=True)
    print(f"Exporting text model '{model_id}' -> {folder_name} ...")
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    tokenizer.save_pretrained(out_dir)
    model = ORTModelForSequenceClassification.from_pretrained(model_id, export=True)
    model.save_pretrained(out_dir)
    print(f"  done: {folder_name}\n")


def export_models():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(base_dir, "models")
    os.makedirs(models_dir, exist_ok=True)

    _export_image_model(IMAGE_MODEL_GAN, "image_onnx_gan", models_dir)
    _export_image_model(IMAGE_MODEL_DIFFUSION, "image_onnx_diffusion", models_dir)

    _export_text_model(TEXT_MODEL_QA, "text_onnx_qa", models_dir)
    _export_text_model(TEXT_MODEL_GPT2, "text_onnx_gpt2", models_dir)

    print("All models exported successfully.")
    print("Next step (optional but recommended): train the stylometric classifier:")
    print("  python ml/text_detector/train_stylometric_classifier.py")


if __name__ == "__main__":
    export_models()

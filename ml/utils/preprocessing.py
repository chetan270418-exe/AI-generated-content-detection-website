import os

def preprocess_image(image_path: str, target_size=(224,224)):
    # The actual preprocessing is handled by AutoImageProcessor in the model wrapper
    pass

def validate_image(image_path: str):
    if not os.path.exists(image_path):
        raise FileNotFoundError("Image file not found.")
        
    ext = os.path.splitext(image_path)[1].lower()
    if ext not in ['.jpg', '.jpeg', '.png', '.webp']:
        raise ValueError(f"Unsupported image format: {ext}")

def validate_text(text: str):
    if not text or not text.strip():
        raise ValueError("Text cannot be empty.")
        
    if len(text) > 10000:
        raise ValueError("Text is too long. Maximum 10000 characters allowed.")

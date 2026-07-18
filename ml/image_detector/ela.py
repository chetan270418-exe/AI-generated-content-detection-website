import cv2
import numpy as np

def analyze_ela(image_path: str, quality: int = 95) -> dict:
    """
    Perform Error Level Analysis (ELA) on an image.
    AI-generated images often have uniform error levels across the image.
    """
    try:
        # Load image
        original_image = cv2.imread(image_path)
        if original_image is None:
            raise ValueError("Could not read the image")

        # Re-save as JPEG
        _, compressed = cv2.imencode('.jpg', original_image, [cv2.IMWRITE_JPEG_QUALITY, quality])
        compressed_image = cv2.imdecode(compressed, cv2.IMREAD_COLOR)

        # Compute absolute difference
        diff = cv2.absdiff(original_image, compressed_image)
        
        # Analyze the difference
        mean_diff = np.mean(diff)
        std_diff = np.std(diff)
        max_diff = np.max(diff)

        # AI images tend to have lower std_diff (more uniform error)
        # We create a simple heuristic score based on standard deviation
        # Lower std_diff -> higher likelihood of being AI.
        # Let's normalize it arbitrarily for this demo.
        # Normally std_diff might be between 0.5 and 3.0 for natural images.
        
        # Inverse mapping: lower std -> higher AI score
        # e.g., if std_diff < 1.0, high AI probability.
        ela_score = max(0.0, min(1.0, 1.0 - (std_diff / 5.0)))
        
        return {
            "ela_score": float(ela_score),
            "mean_diff": float(mean_diff),
            "std_diff": float(std_diff),
            "max_diff": float(max_diff),
            "details": "Lower std_diff implies more uniform compression artifacts, common in AI generated images."
        }
    except Exception as e:
        print(f"Error in ELA: {e}")
        return {
            "ela_score": 0.5, # neutral fallback
            "mean_diff": 0.0,
            "std_diff": 0.0,
            "max_diff": 0.0,
            "details": f"Error: {str(e)}"
        }

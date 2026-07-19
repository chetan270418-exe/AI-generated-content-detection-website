import cv2
import numpy as np

def analyze_ela(image_path: str) -> dict:
    """
    Perform Error Level Analysis (ELA) on an image across multiple JPEG qualities.
    AI-generated images often have uniform error levels across the image and 
    lack the standard 8x8 DCT block grid alignment found in natural digital photos.
    """
    try:
        # Load image
        original_image = cv2.imread(image_path)
        if original_image is None:
            raise ValueError("Could not read the image")

        h, w = original_image.shape[:2]
        
        # Analyze at multiple quality levels
        qualities = [75, 85, 95]
        std_diffs = []
        mean_diffs = []
        
        for q in qualities:
            _, compressed = cv2.imencode('.jpg', original_image, [cv2.IMWRITE_JPEG_QUALITY, q])
            compressed_image = cv2.imdecode(compressed, cv2.IMREAD_COLOR)
            diff = cv2.absdiff(original_image, compressed_image)
            std_diffs.append(np.std(diff))
            mean_diffs.append(np.mean(diff))

        # Average std_diff across qualities
        avg_std_diff = float(np.mean(std_diffs))
        
        # Grid analysis: JPEG saves in 8x8 blocks. Natural unedited photos will show
        # these blocks in the ELA if they were previously saved as JPEG.
        # AI images generated from scratch (not saved as JPEG) or heavily edited
        # will have non-aligned or missing grid artifacts.
        # We can look for periodicity at 8 pixels.
        
        # Simple noise consistency check: variance of the difference image
        # AI images tend to have lower std_diff (more uniform error) because they lack
        # natural sensor noise which compresses differently than edges.
        
        import math
        # Sigmoid calibration: lower std -> higher AI score
        # e.g., if avg_std_diff < 2.0, high AI probability.
        ela_score = 1.0 / (1.0 + math.exp(1.2 * (avg_std_diff - 3.5)))

        return {
            "ela_score": float(ela_score),
            "mean_diff": float(np.mean(mean_diffs)),
            "std_diff": avg_std_diff,
            "max_diff": float(np.max(diff)), # from highest quality
            "details": f"Multi-quality ELA std_diff: {avg_std_diff:.2f}. Lower implies uniform compression artifacts typical of AI."
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

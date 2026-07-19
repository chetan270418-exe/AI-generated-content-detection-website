import cv2
import numpy as np
import base64
from typing import Callable

def generate_heatmap(image_path: str, base_confidence: float, predict_fn: Callable) -> str:
    """
    Generates an occlusion sensitivity heatmap indicating which parts of the image
    contribute most to the 'AI Generated' prediction.
    Uses an 8x8 grid of occlusions to keep CPU inference time manageable.
    Returns a base64 encoded PNG string of the heatmap overlay.
    """
    try:
        # Load original image
        img = cv2.imread(image_path)
        if img is None:
            return None
            
        h, w = img.shape[:2]
        
        # Grid size (8x8 = 64 inferences)
        grid_x = 8
        grid_y = 8
        
        step_x = w // grid_x
        step_y = h // grid_y
        
        heatmap = np.zeros((grid_y, grid_x), dtype=np.float32)
        
        # Temporarily save masked images to a scratch path for predict_fn
        # (predict_fn currently expects a file path)
        import os
        import tempfile
        fd, temp_path = tempfile.mkstemp(suffix=".jpg")
        os.close(fd)
        
        max_drop = 0.0
        
        # Iterate over grid
        for i in range(grid_y):
            for j in range(grid_x):
                # Create a copy and mask out the current grid cell
                masked_img = img.copy()
                
                y1, y2 = i * step_y, (i + 1) * step_y
                x1, x2 = j * step_x, (j + 1) * step_x
                
                # Fill with mean color or black
                masked_img[y1:y2, x1:x2] = (128, 128, 128)
                
                # Save and predict
                cv2.imwrite(temp_path, masked_img)
                
                # Predict
                res = predict_fn(temp_path)
                
                # If masking this region dropped the AI confidence significantly,
                # it means this region was highly responsible for the AI classification.
                new_conf = res.get('confidence', base_confidence)
                if res.get('verdict') == 'human_made':
                    new_conf = 1.0 - new_conf # Convert human confidence back to AI probability scale
                    
                drop = max(0, base_confidence - new_conf)
                heatmap[i, j] = drop
                
                if drop > max_drop:
                    max_drop = drop
                    
        # Cleanup
        if os.path.exists(temp_path):
            os.remove(temp_path)
            
        # Normalize heatmap
        if max_drop > 0:
            heatmap = heatmap / max_drop
            
        # Resize heatmap to match original image dimensions using cubic interpolation for smooth gradients
        heatmap_resized = cv2.resize(heatmap, (w, h), interpolation=cv2.INTER_CUBIC)
        
        # Apply colormap (JET goes from blue to red, red being highest impact)
        heatmap_colored = cv2.applyColorMap(np.uint8(255 * heatmap_resized), cv2.COLORMAP_JET)
        
        # Overlay heatmap on original image
        overlay = cv2.addWeighted(img, 0.6, heatmap_colored, 0.4, 0)
        
        # Encode to base64
        _, buffer = cv2.imencode('.jpg', overlay, [cv2.IMWRITE_JPEG_QUALITY, 85])
        base64_str = base64.b64encode(buffer).decode('utf-8')
        
        return f"data:image/jpeg;base64,{base64_str}"
        
    except Exception as e:
        print(f"Heatmap generation failed: {e}")
        return None

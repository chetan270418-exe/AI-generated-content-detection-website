from .model import ImageDetectorModel
from .ela import analyze_ela

def predict_image(image_path: str) -> dict:
    """
    Combines ML model prediction and ELA score to determine if an image is AI generated.
    """
    try:
        model = ImageDetectorModel()
        model_result = model.predict(image_path)
        
        ela_result = analyze_ela(image_path)
        
        # Determine model score (probability of being AI)
        label = str(model_result["label"]).lower()
        confidence = float(model_result["confidence"])
        
        if "artificial" in label or "ai" in label or "fake" in label:
            model_ai_prob = confidence
        else:
            model_ai_prob = 1.0 - confidence
            
        ela_ai_prob = ela_result["ela_score"]
        
        # Weighted combination
        final_score = (0.7 * model_ai_prob) + (0.3 * ela_ai_prob)
        
        if final_score > 0.7:
            verdict = "ai_generated"
            explanation = f"High probability of AI generation detected (Score: {final_score:.2f}). The image contains visual artifacts and pattern uniformities consistent with AI synthesis."
        elif final_score < 0.3:
            verdict = "human_made"
            explanation = f"High probability of being human-made/real (Score: {final_score:.2f}). The image structure and compression artifacts appear natural."
        else:
            verdict = "inconclusive"
            explanation = f"The analysis is inconclusive (Score: {final_score:.2f}). The system could not confidently determine the origin of the image."
            
        return {
            "verdict": verdict,
            "confidence": final_score if verdict == "ai_generated" else (1 - final_score if verdict == "human_made" else max(final_score, 1-final_score)),
            "model_score": model_ai_prob,
            "ela_score": ela_ai_prob,
            "explanation": explanation,
            "detailed_results": {
                "model_output": model_result,
                "ela_output": ela_result,
                "final_ai_probability": final_score
            }
        }
    except Exception as e:
        raise Exception(f"Failed to analyze image: {str(e)}")

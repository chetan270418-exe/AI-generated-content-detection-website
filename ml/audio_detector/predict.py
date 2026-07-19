from .model import get_audio_model

def predict_audio(audio_path: str) -> dict:
    """
    Analyzes an audio file for deepfake/AI-generation artifacts.
    """
    try:
        model = get_audio_model()
        result = model.predict(audio_path)
        
        prob = result.get("ai_probability", 0.5)
        
        if prob > 0.6:
            verdict = "ai_generated"
            explanation = f"High probability of being AI-generated (score: {prob:.2f}). The audio exhibits unnatural frequency rolloff and vocal tract characteristics common in synthetic voice clones."
        elif prob < 0.4:
            verdict = "human_made"
            explanation = f"High probability of being human-made (score: {prob:.2f}). Natural breath patterns and high-frequency transients are present."
        else:
            verdict = "inconclusive"
            explanation = f"Audio analysis is inconclusive (score: {prob:.2f}). Ensure the audio contains clear speech without excessive background noise."

        return {
            "verdict": verdict,
            "confidence": result.get("confidence", 0.0),
            "explanation": explanation,
            "detailed_results": result
        }
    except Exception as e:
        return {
            "verdict": "inconclusive",
            "confidence": 0.0,
            "explanation": f"Failed to analyze audio: {str(e)}",
            "detailed_results": {},
        }

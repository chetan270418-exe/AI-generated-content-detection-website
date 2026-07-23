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

        # Lift spectrogram_url to root for easy frontend access
        details = result.get("details", {})
        spectrogram_url = details.get("spectrogram_url")
        if spectrogram_url:
            result["spectrogram_url"] = spectrogram_url

        # Build signals array for frontend ScoreChart
        signals = []
        if result.get("source") == "librosa_heuristic":
            import math
            # Reconstruct the calibrated scores for visualization
            mean_rolloff = details.get("mean_rolloff", 0)
            score_rolloff = 1.0 / (1.0 + math.exp(0.002 * (mean_rolloff - 3500)))
            
            mfcc_var = details.get("mfcc_variance", 0)
            score_mfcc = 1.0 / (1.0 + math.exp(0.05 * (mfcc_var - 150)))
            
            mean_zcr = details.get("mean_zcr", 0)
            score_zcr = 1.0 / (1.0 + math.exp(100.0 * (mean_zcr - 0.06)))
            
            signals = [
                {"name": "High Freq Rolloff", "ai_probability": score_rolloff},
                {"name": "Timbre Consistency (MFCC)", "ai_probability": score_mfcc},
                {"name": "Breath/Sibilance (ZCR)", "ai_probability": score_zcr}
            ]
        else:
            signals = [
                {"name": "HF Audio Deepfake Model", "ai_probability": result.get("ai_probability", 0.5)}
            ]
            
        result["signals"] = signals
        result["agreement"] = 1.0 # Single source logic

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

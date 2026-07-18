from .model import TextDetectorModel
from .perplexity import compute_perplexity_scores

def predict_text(text: str) -> dict:
    """
    Combines model prediction, perplexity, and burstiness to determine if text is AI generated.
    """
    try:
        model = TextDetectorModel()
        model_result = model.predict(text)
        
        ppl_result = compute_perplexity_scores(text)
        
        # Determine model score
        label = str(model_result["label"]).lower()
        confidence = float(model_result["confidence"])
        
        if "fake" in label or "ai" in label or "artificial" in label:
            model_ai_prob = confidence
        else:
            model_ai_prob = 1.0 - confidence
            
        ppl_score = ppl_result["perplexity_score"]
        burst_score = ppl_result["burstiness_score"]
        
        # Weighted combination
        final_score = (0.6 * model_ai_prob) + (0.25 * ppl_score) + (0.15 * burst_score)
        
        if final_score > 0.7:
            verdict = "ai_generated"
            explanation = f"High probability of AI generation detected (Score: {final_score:.2f}). The text exhibits predictable language patterns and uniform sentence structure common in LLM outputs."
        elif final_score < 0.3:
            verdict = "human_made"
            explanation = f"High probability of being human-written (Score: {final_score:.2f}). The text shows natural variance in vocabulary and sentence complexity."
        else:
            verdict = "inconclusive"
            explanation = f"The analysis is inconclusive (Score: {final_score:.2f}). The text contains a mix of patterns that make it difficult to determine the origin with high confidence."
            
        return {
            "verdict": verdict,
            "confidence": final_score if verdict == "ai_generated" else (1 - final_score if verdict == "human_made" else max(final_score, 1-final_score)),
            "model_score": model_ai_prob,
            "perplexity_score": ppl_score,
            "burstiness_score": burst_score,
            "explanation": explanation,
            "detailed_results": {
                "model_output": model_result,
                "perplexity_output": ppl_result,
                "final_ai_probability": final_score
            }
        }
    except Exception as e:
        raise Exception(f"Failed to analyze text: {str(e)}")

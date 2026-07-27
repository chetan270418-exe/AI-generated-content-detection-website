from .model import predict_with_classifier
from .ela import analyze_ela
from .frequency import compute_frequency_scores
from ..common.label_config import resolve_ai_probability
from ..common.ensemble import combine_signals
from .explain import generate_heatmap
from ..utils.cache import prediction_cache
from ..utils.hashing import compute_phash, hamming_distance
import copy


def predict_image(image_path: str) -> dict:
    """
    Runs a 4-signal ensemble to detect AI-generated images.
    Uses O(1) LRU Cache + Perceptual Hashing (pHash) to skip 
    expensive model inference if this image was recently analyzed.
    """
    try:
        # --- DSA CACHE LAYER ---
        img_hash = compute_phash(image_path)
        
        # O(N) scan bounded by small constant N (max 100 items). 
        # For a truly massive DB, we'd use a KD-Tree/FAISS here.
        for cached_key in list(prediction_cache.cache.keys()):
            dist = hamming_distance(img_hash, cached_key)
            if dist <= 2:  # Allow 2 bits of variation (e.g. slight JPEG compression)
                cached_result = prediction_cache.get(cached_key)
                if cached_result:
                    print(f"[predict_image] CACHE HIT! Found near-match (distance {dist}). Skipping ML inference.")
                    # Return a copy to prevent accidental mutation
                    return copy.deepcopy(cached_result)
        
        signals = []
        detailed_results = {}

        # 1. Diffusion Classifier
        try:
            diffusion_result = predict_with_classifier("image_onnx_diffusion", image_path)
            diffusion_ai_prob = resolve_ai_probability(
                diffusion_result["label"], diffusion_result["confidence"], "diffusion_classifier"
            )
            signals.append({"name": "Diffusion Classifier", "ai_probability": diffusion_ai_prob, "weight": 0.35})
            detailed_results["diffusion_classifier_raw"] = diffusion_result
        except Exception as e:
            print(f"[predict_image] Diffusion classifier failed: {e}")
            diffusion_ai_prob = 0.5

        # 2. GAN Classifier
        try:
            gan_result = predict_with_classifier("image_onnx_gan", image_path)
            gan_ai_prob = resolve_ai_probability(
                gan_result["label"], gan_result["confidence"], "gan_classifier"
            )
            signals.append({"name": "GAN Classifier", "ai_probability": gan_ai_prob, "weight": 0.20})
            detailed_results["gan_classifier_raw"] = gan_result
        except Exception as e:
            print(f"[predict_image] GAN classifier failed: {e}")

        # 3. ELA (Multi-quality)
        try:
            ela_result = analyze_ela(image_path)
            signals.append({"name": "Error Level Analysis", "ai_probability": ela_result.get("ela_score", 0.5), "weight": 0.20})
            detailed_results["ela_output"] = ela_result
        except Exception as e:
            print(f"[predict_image] ELA failed: {e}")

        # 4. Fourier Frequency Analysis
        try:
            freq_result = compute_frequency_scores(image_path)
            signals.append({"name": "Fourier Spectrum", "ai_probability": freq_result.get("frequency_score", 0.5), "weight": 0.25})
            detailed_results["frequency_output"] = freq_result
        except Exception as e:
            print(f"[predict_image] Frequency analysis failed: {e}")

        if not signals:
            raise ValueError("All image detection signals failed.")

        ensemble_result = combine_signals(signals)
        verdict = ensemble_result["verdict"]

        if verdict == "inconclusive":
            explanation = (
                f"The detection signals disagreed with each other (agreement: "
                f"{ensemble_result['agreement']*100:.0f}%), so this is reported as inconclusive. "
                f"Combined AI-likelihood: {ensemble_result['final_ai_probability']*100:.0f}%."
            )
        elif verdict == "ai_generated":
            explanation = (
                f"High probability of being AI-generated (score: {ensemble_result['final_ai_probability']:.2f}, "
                f"signal agreement: {ensemble_result['agreement']*100:.0f}%). Multiple signals "
                f"including spatial classifiers and frequency/compression forensics point to synthetic origin."
            )
        else:
            explanation = (
                f"High probability of being human-made/real (score: {ensemble_result['final_ai_probability']:.2f}, "
                f"signal agreement: {ensemble_result['agreement']*100:.0f}%). Image structure, "
                f"compression artifacts, and high-frequency spectrum appear natural."
            )
            
        heatmap_url = None
        if verdict == "ai_generated":
            def heatmap_predict_fn(p):
                try:
                    res = predict_with_classifier("image_onnx_diffusion", p)
                    prob = resolve_ai_probability(res["label"], res["confidence"], "diffusion_classifier")
                    v = "ai_generated" if prob > 0.5 else "human_made"
                    return {"confidence": prob if prob > 0.5 else (1-prob), "verdict": v}
                except:
                    return {"confidence": 0.5, "verdict": "inconclusive"}
                
            heatmap_url = generate_heatmap(image_path, diffusion_ai_prob, heatmap_predict_fn)

        detailed_results["signals"] = ensemble_result["breakdown"]
        detailed_results["agreement"] = ensemble_result["agreement"]
        detailed_results["final_ai_probability"] = ensemble_result["final_ai_probability"]
        detailed_results["heatmap"] = heatmap_url

        final_result = {
            "verdict": verdict,
            "confidence": ensemble_result["confidence"],
            "explanation": explanation,
            "detailed_results": detailed_results,
        }
        
        # Save to O(1) LRU Cache
        prediction_cache.put(img_hash, final_result)
        
        return final_result
    except Exception as e:
        return {
            "verdict": "inconclusive",
            "confidence": 0.0,
            "explanation": f"Failed to analyze image: {str(e)}",
            "detailed_results": {},
        }

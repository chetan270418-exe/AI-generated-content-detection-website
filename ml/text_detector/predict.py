from .model import predict_with_classifier
from .perplexity import compute_perplexity_scores
from .stylometry import predict_stylometric
from .entropy import compute_entropy_scores
from .repetition import compute_repetition_scores
from ..common.label_config import resolve_ai_probability
from ..common.ensemble import combine_signals


import re

def predict_text(text: str) -> dict:
    """
    Runs an advanced 7-signal ensemble to detect AI-generated text.
    Combines transformer classifiers (deep learning) with multiple statistical
    and linguistic signals (entropy, repetition, stylometry) for high robustness
    against paraphrasing and modern LLMs (GPT-4, Claude).
    """
    try:
        # Sanitize text: strip conversational framing often pasted by users
        # e.g., "Here's a sample paragraph you can use for testing: \n\n >"
        sanitized_text = re.sub(r'(?i)^(here.*?|sure.*?|certainly.*?)(:\s*|\n)+', '', text.strip())
        sanitized_text = re.sub(r'^>\s*', '', sanitized_text).strip()
        
        # Fallback if somehow it stripped everything
        if len(sanitized_text) < 10:
            sanitized_text = text

        signals = []
        detailed_results = {}

        # 1. HC3 (RoBERTa-base, ChatGPT-3.5 trained)
        try:
            qa_result = predict_with_classifier("text_onnx_qa", sanitized_text)
            qa_prob = resolve_ai_probability(qa_result["label"], qa_result["confidence"], "hc3")
            signals.append({"name": "HC3 Classifier", "ai_probability": qa_prob, "weight": 0.25})
            detailed_results["hc3_raw"] = qa_result
        except Exception as e:
            print(f"[predict_text] HC3 failed: {e}")

        # 3. GPT-2 era (RoBERTa-base, downweighted as it's outdated)
        try:
            gpt2_result = predict_with_classifier("text_onnx_gpt2", sanitized_text)
            gpt2_prob = resolve_ai_probability(gpt2_result["label"], gpt2_result["confidence"], "gpt2_classifier")
            signals.append({"name": "GPT-2 Classifier", "ai_probability": gpt2_prob, "weight": 0.15})
            detailed_results["gpt2_classifier_raw"] = gpt2_result
        except Exception as e:
            print(f"[predict_text] GPT-2 classifier failed: {e}")

        # 4 & 5. Perplexity & Burstiness (Calibrated Statistical)
        try:
            ppl_result = compute_perplexity_scores(sanitized_text)
            signals.append({"name": "Perplexity", "ai_probability": ppl_result["perplexity_score"], "weight": 0.15})
            signals.append({"name": "Burstiness", "ai_probability": ppl_result["burstiness_score"], "weight": 0.10})
            detailed_results["perplexity_output"] = ppl_result
        except Exception as e:
            print(f"[predict_text] Perplexity failed: {e}")

        # 6. Entropy (Token-level log-probability)
        try:
            entropy_result = compute_entropy_scores(sanitized_text)
            signals.append({"name": "Token Entropy", "ai_probability": entropy_result["entropy_score"], "weight": 0.15})
            detailed_results["entropy_output"] = entropy_result
        except Exception as e:
            print(f"[predict_text] Entropy failed: {e}")

        # 7. Repetition & N-gram Clichés
        try:
            rep_result = compute_repetition_scores(sanitized_text)
            signals.append({"name": "Repetition & Clichés", "ai_probability": rep_result["repetition_score"], "weight": 0.05})
            detailed_results["repetition_output"] = rep_result
        except Exception as e:
            print(f"[predict_text] Repetition failed: {e}")

        # 8. Stylometric Classifier (14-feature GBM)
        try:
            stylometric_result = predict_stylometric(sanitized_text)
            signals.append({"name": "Stylometric Classifier", "ai_probability": stylometric_result["ai_probability"], "weight": 0.10})
            detailed_results["stylometric_output"] = stylometric_result
        except Exception as e:
            print(f"[predict_text] Stylometric failed: {e}")

        if not signals:
            raise ValueError("All detection signals failed.")

        # Combine all successful signals
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
                f"High probability of AI generation (score: {ensemble_result['final_ai_probability']:.2f}, "
                f"signal agreement: {ensemble_result['agreement']*100:.0f}%). The text exhibits strong "
                f"synthetic patterns across structural, statistical, and semantic markers."
            )
        else:
            explanation = (
                f"High probability of being human-written (score: {ensemble_result['final_ai_probability']:.2f}, "
                f"signal agreement: {ensemble_result['agreement']*100:.0f}%). The text shows natural "
                f"human variation in entropy, vocabulary, and sentence structure."
            )

        detailed_results["signals"] = ensemble_result["breakdown"]
        detailed_results["agreement"] = ensemble_result["agreement"]
        detailed_results["final_ai_probability"] = ensemble_result["final_ai_probability"]

        return {
            "verdict": verdict,
            "confidence": ensemble_result["confidence"],
            "explanation": explanation,
            "detailed_results": detailed_results,
        }
    except Exception as e:
        return {
            "verdict": "inconclusive",
            "confidence": 0.0,
            "explanation": f"Failed to analyze text: {str(e)}",
            "detailed_results": {},
        }

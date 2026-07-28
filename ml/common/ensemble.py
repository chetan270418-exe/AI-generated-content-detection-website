"""
Generic multi-signal ensemble combiner, used by both the image and text detectors.

DESIGN RATIONALE:
Detection literature consistently favors combining several independent signals
(different model paradigms, forensic vs. semantic vs. statistical methods) over
relying on any single classifier — different techniques catch different
generator types, and no single method generalizes to everything. Real-world
detection systems also report a confidence score rather than a forced binary
answer, and should be willing to say "inconclusive" when signals disagree
rather than confidently guessing wrong. This module implements both ideas:
weighted signal combination AND an explicit disagreement-aware verdict.
"""

from typing import List, Dict
import os

AI_THRESHOLD = 0.52          # was 0.55 — easier to flag AI
HUMAN_THRESHOLD = 0.38       # was 0.45 — much harder to call human (avoids false negatives on diffusion images)
DISAGREEMENT_THRESHOLD = 0.18  # slightly more tolerant of signal spread

# Path to an optional learned combiner trained by
# ml/common/train_ensemble_combiner.py. If this file exists and its feature
# set matches the signals passed in, we use it instead of the heuristic
# weight-multiplier logic below. If it's missing (fresh clone, or you haven't
# trained one yet), everything falls back to the original heuristic exactly
# as before -- this is purely additive.
_COMBINER_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "ensemble_combiner.joblib"
)
_combiner_cache = {"loaded": False, "model": None, "signal_names": None}


def _get_learned_combiner():
    """Lazily loads the learned combiner once per process. Returns
    (model, signal_names) or (None, None) if no trained combiner exists yet."""
    if not _combiner_cache["loaded"]:
        _combiner_cache["loaded"] = True
        if os.path.exists(_COMBINER_PATH):
            try:
                import joblib
                bundle = joblib.load(_COMBINER_PATH)
                _combiner_cache["model"] = bundle["model"]
                _combiner_cache["signal_names"] = bundle["signal_names"]
                print(f"[ensemble] Loaded learned combiner from {_COMBINER_PATH} "
                      f"({len(bundle['signal_names'])} signals).")
            except Exception as e:
                print(f"[ensemble] Failed to load learned combiner, falling back to heuristic: {e}")
    return _combiner_cache["model"], _combiner_cache["signal_names"]

def combine_signals(signals: List[Dict]) -> Dict:
    """
    signals: list of {"name": str, "ai_probability": float (0-1), "weight": float}

    Returns:
      {
        "final_ai_probability": float (0-1),
        "verdict": "ai_generated" | "human_made" | "inconclusive",
        "confidence": float (0-1),
        "agreement": float (0-1, 1.0 = all signals fully agree),
        "breakdown": [{"name", "ai_probability", "weight"}]
      }
    """
    if not signals:
        return {
            "final_ai_probability": 0.5,
            "verdict": "inconclusive",
            "confidence": 0.0,
            "agreement": 0.0,
            "used_learned_combiner": False,
            "breakdown": [],
        }

    import copy
    # Make a copy of signals to avoid mutating the original inputs
    signals_copy = copy.deepcopy(signals)

    # --- Decision-Tree Aggregation Logic ---
    # Not all signals are created equal. Forensic signals (ELA, Fourier, Perplexity)
    # often catch artifacts that semantic classifiers (ViT, RoBERTa) miss.
    for s in signals_copy:
        # Boost weight if a signal is extremely confident (>90% or <10%)
        if s["ai_probability"] > 0.90 or s["ai_probability"] < 0.10:
            s["weight"] *= 1.5

        # Decision Node: If there's a strong conflict between classifiers and forensics,
        # we trust forensics more for deepfakes.
        # Modern diffusion models (DALL-E 3, Midjourney) have very clean forensics,
        # so we also upweight the neural classifier signal in those cases.
        is_forensic = any(name in s["name"].lower() for name in ["ela", "fourier", "error", "spectrum", "burstiness", "perplexity"])
        is_classifier = any(name in s["name"].lower() for name in ["classifier", "diffusion", "gan"])
        if is_forensic:
            # If a forensic signal strongly suspects AI, double its weight
            if s["ai_probability"] > 0.75:
                s["weight"] *= 2.0
            # Even moderate forensic suspicion (>0.55) gets a boost for diffusion-model detection
            elif s["ai_probability"] > 0.55:
                s["weight"] *= 1.3
        if is_classifier and s["ai_probability"] > 0.60:
            # Neural classifiers trained on diffusion data — trust them more at moderate confidence
            s["weight"] *= 1.2

    # Outlier rejection: Downweight signals that completely contradict the consensus
    if len(signals_copy) >= 3:
        raw_mean = sum(s["ai_probability"] for s in signals_copy) / len(signals_copy)
        for s in signals_copy:
            if abs(s["ai_probability"] - raw_mean) > 0.4:
                s["weight"] *= 0.5

    total_weight = sum(s["weight"] for s in signals_copy) or 1.0
    heuristic_score = sum(s["ai_probability"] * s["weight"] for s in signals_copy) / total_weight

    # If a learned combiner has been trained (see train_ensemble_combiner.py)
    # and this call's signal names match what it was trained on, prefer its
    # output over the hand-tuned heuristic above. The heuristic still runs
    # unconditionally so `breakdown` and agreement stay identical either way.
    final_score = heuristic_score
    used_learned_combiner = False
    combiner_model, combiner_signal_names = _get_learned_combiner()
    if combiner_model is not None:
        raw_probs = {s["name"]: s["ai_probability"] for s in signals}
        if set(combiner_signal_names) <= set(raw_probs.keys()):
            feature_vector = [[raw_probs[name] for name in combiner_signal_names]]
            final_score = float(combiner_model.predict_proba(feature_vector)[0][1])
            used_learned_combiner = True

    # Agreement = how tightly clustered the individual signal scores are.
    mean = sum(s["ai_probability"] for s in signals_copy) / len(signals_copy)
    variance = sum((s["ai_probability"] - mean) ** 2 for s in signals_copy) / len(signals_copy)
    spread = variance ** 0.5
    agreement = max(0.0, 1.0 - (spread / 0.5))

    # Adaptive thresholds: if agreement is very high, we can be more decisive
    dynamic_ai_thresh = AI_THRESHOLD - 0.05 if agreement > 0.85 else AI_THRESHOLD
    dynamic_hum_thresh = HUMAN_THRESHOLD + 0.05 if agreement > 0.85 else HUMAN_THRESHOLD

    if agreement < DISAGREEMENT_THRESHOLD:
        verdict = "inconclusive"
    elif final_score >= dynamic_ai_thresh:
        verdict = "ai_generated"
    elif final_score <= dynamic_hum_thresh:
        verdict = "human_made"
    else:
        verdict = "inconclusive"

    # The frontend gauge now acts as an "AI Probability" gauge rather than a distance-from-50% confidence.
    # Therefore, confidence is simply the final AI probability.
    confidence = round(final_score, 4)

    return {
        "final_ai_probability": round(final_score, 4),
        "verdict": verdict,
        "confidence": confidence,
        "agreement": round(agreement, 3),
        "used_learned_combiner": used_learned_combiner,
        "breakdown": [
            {"name": s["name"], "ai_probability": round(s["ai_probability"], 4), "weight": s["weight"]}
            for s in signals_copy
        ],
    }

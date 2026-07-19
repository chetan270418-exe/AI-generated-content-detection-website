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

AI_THRESHOLD = 0.62
HUMAN_THRESHOLD = 0.38
DISAGREEMENT_THRESHOLD = 0.35  # agreement below this = signals don't agree enough to trust


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
            "breakdown": [],
        }

    # Outlier rejection (robust ensemble): If we have many signals, 
    # downweight ones that completely contradict the consensus.
    if len(signals) >= 3:
        raw_mean = sum(s["ai_probability"] for s in signals) / len(signals)
        for s in signals:
            # If a signal is more than 0.4 away from the mean, halve its weight
            if abs(s["ai_probability"] - raw_mean) > 0.4:
                s["weight"] *= 0.5

    total_weight = sum(s["weight"] for s in signals) or 1.0
    final_score = sum(s["ai_probability"] * s["weight"] for s in signals) / total_weight

    # Agreement = how tightly clustered the individual signal scores are.
    mean = sum(s["ai_probability"] for s in signals) / len(signals)
    variance = sum((s["ai_probability"] - mean) ** 2 for s in signals) / len(signals)
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
        "breakdown": [
            {"name": s["name"], "ai_probability": round(s["ai_probability"], 4), "weight": s["weight"]}
            for s in signals
        ],
    }

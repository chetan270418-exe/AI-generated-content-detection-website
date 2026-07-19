"""
Centralized AI/human label resolution for every classifier used in this project.

WHY THIS FILE EXISTS:
We were bitten twice by the same bug: a pretrained model's output label
("Generated"/"Real", "artificial"/"human", etc.) didn't match whatever
substring check was hardcoded in that detector's predict.py, silently
flipping every prediction for that model. Centralizing the keyword list
here means:
  1. There's exactly one place to update when you plug in a new model.
  2. Every detector logs a clear warning instead of guessing when a label
     doesn't match anything known, instead of silently inverting.

If you swap ANY model in this project, run a quick manual test and check
the terminal for "[label_config] WARNING" — if you see it, add the new
label wording to the lists below.
"""

AI_KEYWORDS = ["artificial", "ai", "fake", "generated", "synthetic", "chatgpt", "gpt", "machine"]
HUMAN_KEYWORDS = ["human", "real", "authentic"]


def resolve_ai_probability(label: str, confidence: float, source: str = "") -> float:
    """
    Given a classifier's predicted label and its confidence in that label,
    return the probability that the content IS AI-generated, on a 0.0-1.0 scale.

    This is the ONLY place in the codebase that should interpret label wording —
    every detector should call this instead of doing its own substring matching.
    """
    normalized = str(label).lower()

    if any(kw in normalized for kw in AI_KEYWORDS):
        return float(confidence)

    if any(kw in normalized for kw in HUMAN_KEYWORDS):
        return 1.0 - float(confidence)

    print(
        f"[label_config] WARNING: unrecognized label '{label}' from '{source}'. "
        f"Add this wording to AI_KEYWORDS or HUMAN_KEYWORDS in ml/common/label_config.py. "
        f"Defaulting to AI-side to surface the issue rather than silently inverting."
    )
    return float(confidence)

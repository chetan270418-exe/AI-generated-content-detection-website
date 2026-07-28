"""
Trains a learned ensemble combiner for the text detector, replacing the
hand-tuned heuristic weights in ensemble.py (the *1.5, *2.0 multipliers and
fixed 0.52/0.38 thresholds).

WHY: those heuristic weights were guessed, not fit to data. This script
instead runs the full 7-signal pipeline over a labeled dataset, collects
each signal's raw ai_probability as a feature, and fits a small Logistic
Regression that learns how much to trust each signal from the data itself.

This only touches the text detector for now (same signal set every time).
The image detector's forensic signals differ per-call, so it keeps the
heuristic combiner unless you build an equivalent training set for it.

Usage:
    python -m ml.common.train_ensemble_combiner --dataset ml/data/text_eval_dataset.jsonl

IMPORTANT: use a held-out dataset here that's DIFFERENT from the one you
use in evaluate.py afterwards, or your reported accuracy will be optimistic
(the combiner will have already seen those exact examples). Easiest way:
build two datasets with ml/build_eval_dataset.py using different --skip-rows,
train on one, evaluate on the other.
"""

import argparse
import json
import os

import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report


def load_dataset(path: str):
    texts, labels = [], []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            row = json.loads(line)
            texts.append(row["input"])
            labels.append(1 if row["label"] == "ai_generated" else 0)
    return texts, labels


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", required=True,
                         help="JSONL with {'input':..., 'label': 'ai_generated'|'human_made'} lines. "
                              "Use a TRAINING split here, separate from what you'll evaluate on.")
    parser.add_argument("--out", default=os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models", "ensemble_combiner.joblib"))
    args = parser.parse_args()

    # Imported lazily so this file can be syntax-checked without the full ml/
    # dependency stack (torch, onnxruntime, transformers) installed.
    from ml.text_detector.predict import predict_text

    texts, labels = load_dataset(args.dataset)
    print(f"Loaded {len(texts)} samples ({sum(labels)} AI, {len(labels) - sum(labels)} human).")

    signal_names = None
    X, y = [], []

    for i, (text, label) in enumerate(zip(texts, labels)):
        result = predict_text(text)
        breakdown = result.get("detailed_results", {}).get("signals", [])
        if not breakdown:
            print(f"[{i+1}/{len(texts)}] No signals returned, skipping.")
            continue

        row = {sig["name"]: sig["ai_probability"] for sig in breakdown}

        if signal_names is None:
            # Lock in the feature order from the first successful sample.
            signal_names = sorted(row.keys())

        # Missing signals (a classifier failed on this sample) get a neutral
        # 0.5 rather than being dropped, so the feature vector stays fixed-size.
        X.append([row.get(name, 0.5) for name in signal_names])
        y.append(label)

        if (i + 1) % 25 == 0:
            print(f"[{i+1}/{len(texts)}] processed...")

    if not X:
        raise RuntimeError("No usable samples -- check that predict_text is working.")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    clf = LogisticRegression(max_iter=1000, class_weight="balanced")
    clf.fit(X_train, y_train)

    print("\nHeld-out slice of the training set (sanity check, NOT your real eval number):")
    print(classification_report(y_test, clf.predict(X_test), target_names=["human", "ai_generated"]))

    print("\nLearned weight per signal (higher magnitude = more influence):")
    for name, coef in sorted(zip(signal_names, clf.coef_[0]), key=lambda t: -abs(t[1])):
        print(f"  {name:30s} {coef:+.3f}")

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    joblib.dump({"model": clf, "signal_names": signal_names}, args.out)
    print(f"\nSaved learned ensemble combiner to {args.out}")
    print("ensemble.py will pick this up automatically on next run -- no code changes needed.")


if __name__ == "__main__":
    main()

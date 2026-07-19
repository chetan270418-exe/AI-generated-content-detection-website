"""
One-time training script for the stylometric classifier -- the 4th signal in
the text-detection ensemble (see predict.py). Trains a simple, interpretable
Logistic Regression on hand-crafted stylometric features (sentence-length
variance, vocabulary diversity, function-word usage, punctuation patterns)
extracted from HC3 (Human-ChatGPT Comparison Corpus): real human answers vs
ChatGPT answers to the same questions.

This is intentionally lightweight -- CPU-only, trains in well under a minute.
The goal is an interpretable, INDEPENDENTLY-trained signal to combine with
the pretrained transformer classifiers, not to beat them on raw accuracy.

Requires: pip install datasets  (added to ml/requirements.txt)

Run once:
    python ml/text_detector/train_stylometric_classifier.py
"""

import os
import sys
import joblib
from datasets import load_dataset
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from stylometry import extract_features, features_to_vector  # noqa: E402


import json
from huggingface_hub import hf_hub_download


def load_hc3_samples(max_samples: int = 4000):
    """Returns (texts, labels) where label 1 = AI-generated (ChatGPT), 0 = human.

    NOTE: we deliberately do NOT use datasets.load_dataset() here. The
    `datasets` library detects the presence of HC3.py (an old-style loading
    script) in the Hello-SimpleAI/HC3 repo and refuses to proceed -- even
    when data_files= is passed to force the generic JSON loader instead.
    Downloading the raw all.jsonl file directly via huggingface_hub and
    parsing it ourselves sidesteps that check completely and works
    regardless of which datasets version is installed.
    """
    print("Downloading HC3 dataset file (cached locally after the first run)...")
    file_path = hf_hub_download(
        repo_id="Hello-SimpleAI/HC3",
        filename="all.jsonl",
        repo_type="dataset",
    )

    texts, labels = [], []
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            if len(texts) >= max_samples:
                break
            row = json.loads(line)
            for human_answer in (row.get("human_answers") or [])[:1]:
                if human_answer and len(human_answer.split()) > 15:
                    texts.append(human_answer)
                    labels.append(0)
            for ai_answer in (row.get("chatgpt_answers") or [])[:1]:
                if ai_answer and len(ai_answer.split()) > 15:
                    texts.append(ai_answer)
                    labels.append(1)

    print(f"Loaded {len(texts)} samples ({sum(labels)} AI, {len(labels) - sum(labels)} human).")
    return texts, labels


def main():
    texts, labels = load_hc3_samples()

    print("Extracting stylometric features...")
    X = [features_to_vector(extract_features(t)) for t in texts]
    y = labels

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", GradientBoostingClassifier(n_estimators=100, max_depth=4, random_state=42)),
    ])
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    print("\nHeld-out test performance:")
    print(classification_report(y_test, y_pred, target_names=["human", "ai_generated"]))

    models_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
    os.makedirs(models_dir, exist_ok=True)
    out_path = os.path.join(models_dir, "stylometric_classifier.joblib")
    joblib.dump(pipeline, out_path)
    print(f"\nSaved trained stylometric classifier to {out_path}")


if __name__ == "__main__":
    main()
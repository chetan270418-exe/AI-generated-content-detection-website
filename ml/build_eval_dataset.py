"""
Builds a larger, held-out evaluation dataset for the text detector.

WHY: ml/reports/text_eval.md was generated from a 10-sample dataset -- not
enough to draw any real conclusion about accuracy. This script pulls a
much bigger balanced sample from HC3 (same source used to train the
stylometric classifier) while deliberately skipping the rows that
train_stylometric_classifier.py already consumed, so this eval set is
NOT the same data the stylometric signal was trained on. Reusing training
rows for evaluation would make the reported accuracy meaningless (it
would just show the model remembering its own training data).

Usage:
    python ml/build_eval_dataset.py --n 300 --skip-rows 8000

Output:
    ml/data/text_eval_dataset.jsonl
    Each line: {"input": "<text>", "label": "ai_generated" | "human_made"}

Requires: pip install huggingface_hub  (same dependency train script uses)
"""

import argparse
import json
import os

from huggingface_hub import hf_hub_download


def build_dataset(n: int, skip_rows: int, out_path: str):
    print("Downloading HC3 dataset file (cached locally after the first run)...")
    file_path = hf_hub_download(
        repo_id="Hello-SimpleAI/HC3",
        filename="all.jsonl",
        repo_type="dataset",
    )

    per_class_target = n // 2
    human, ai = [], []

    with open(file_path, "r", encoding="utf-8") as f:
        for row_idx, line in enumerate(f):
            if row_idx < skip_rows:
                # Skip rows train_stylometric_classifier.py likely already used,
                # so this eval set stays disjoint from that training data.
                continue
            if len(human) >= per_class_target and len(ai) >= per_class_target:
                break

            row = json.loads(line)
            if len(human) < per_class_target:
                for human_answer in (row.get("human_answers") or [])[:1]:
                    if human_answer and len(human_answer.split()) > 15:
                        human.append(human_answer)
                        break
            if len(ai) < per_class_target:
                for ai_answer in (row.get("chatgpt_answers") or [])[:1]:
                    if ai_answer and len(ai_answer.split()) > 15:
                        ai.append(ai_answer)
                        break

    print(f"Collected {len(human)} human samples and {len(ai)} AI samples "
          f"(target was {per_class_target} each).")

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        for text in human:
            f.write(json.dumps({"input": text, "label": "human_made"}) + "\n")
        for text in ai:
            f.write(json.dumps({"input": text, "label": "ai_generated"}) + "\n")

    print(f"Wrote {len(human) + len(ai)} samples to {out_path}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--n", type=int, default=300,
                         help="Total samples to collect (split evenly AI/human).")
    parser.add_argument("--skip-rows", type=int, default=8000,
                         help="Skip this many HC3 rows first, to stay disjoint "
                              "from what train_stylometric_classifier.py (max_samples=4000) consumed.")
    parser.add_argument("--out", default=os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "data", "text_eval_dataset.jsonl"))
    args = parser.parse_args()

    build_dataset(args.n, args.skip_rows, args.out)

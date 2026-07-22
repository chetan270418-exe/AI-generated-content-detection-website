import json
import os
import sys
from sklearn.metrics import precision_score, recall_score, f1_score, confusion_matrix, accuracy_score
from collections import Counter
import time

def evaluate_modality(modality: str, dataset_path: str, predict_fn):
    """
    Evaluates a specific modality against a labeled dataset.
    dataset_path should point to a JSONL file where each line is:
    {"input": "text or path", "label": "ai_generated" | "human_made"}
    """
    if not os.path.exists(dataset_path):
        print(f"Dataset {dataset_path} not found.")
        return

    y_true = []
    y_pred = []
    inconclusive_count = 0
    agreements = []
    
    start_time = time.time()
    
    print(f"Starting evaluation for {modality}...")
    
    with open(dataset_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    for i, line in enumerate(lines):
        data = json.loads(line)
        inp = data["input"]
        label = data["label"]
        
        try:
            result = predict_fn(inp)
            verdict = result.get("verdict")
            
            # Record agreement distribution
            detailed = result.get("detailed_results", {})
            if "agreement" in detailed:
                agreements.append(detailed["agreement"])
                
            if verdict == "inconclusive":
                inconclusive_count += 1
                # For strict metric calculation, we might ignore inconclusive, 
                # but to be rigorous, we treat inconclusive as a failure to detect AI (if it was AI) 
                # or failure to detect human (if it was human). We'll exclude them from standard P/R,
                # but report the raw inconclusive rate.
                continue
                
            y_true.append(label)
            y_pred.append(verdict)
            
            print(f"[{i+1}/{len(lines)}] {label} -> {verdict}")
        except Exception as e:
            print(f"[{i+1}/{len(lines)}] Error processing: {e}")

    exec_time = time.time() - start_time
    
    # Calculate Metrics
    classes = ["ai_generated", "human_made"]
    
    if len(y_true) == 0:
        print("No successful conclusive predictions.")
        return
        
    # Map to binary (1 = AI, 0 = Human) for sklearn
    y_true_bin = [1 if y == "ai_generated" else 0 for y in y_true]
    y_pred_bin = [1 if y == "ai_generated" else 0 for y in y_pred]
    
    precision = precision_score(y_true_bin, y_pred_bin, zero_division=0)
    recall = recall_score(y_true_bin, y_pred_bin, zero_division=0)
    f1 = f1_score(y_true_bin, y_pred_bin, zero_division=0)
    accuracy = accuracy_score(y_true_bin, y_pred_bin)
    
    cm = confusion_matrix(y_true_bin, y_pred_bin, labels=[1, 0])
    
    avg_agreement = sum(agreements) / len(agreements) if agreements else 0
    
    report = f"""# 📊 Evaluation Report: {modality.capitalize()} Detector

**Date:** {time.strftime("%Y-%m-%d %H:%M:%S")}
**Total Samples:** {len(lines)}
**Conclusive Predictions:** {len(y_true)}
**Inconclusive Predictions:** {inconclusive_count} ({inconclusive_count/len(lines)*100:.1f}%)
**Execution Time:** {exec_time:.2f}s

## 🎯 Primary Metrics (Conclusive only)
- **Accuracy:** {accuracy*100:.2f}%
- **Precision (AI):** {precision*100:.2f}%
- **Recall (AI):** {recall*100:.2f}%
- **F1 Score:** {f1*100:.2f}%

## 📉 Confusion Matrix
| | Predicted AI | Predicted Human |
|---|---|---|
| **Actual AI** | {cm[0][0]} (TP) | {cm[0][1]} (FN) |
| **Actual Human** | {cm[1][0]} (FP) | {cm[1][1]} (TN) |

## 🧠 Ensemble Confidence
- **Average Signal Agreement:** {avg_agreement*100:.2f}%

*Note: Inconclusive results occur when the ensemble's signals disagree significantly, prioritizing safety over forcing a wrong guess.*
"""

    report_path = f"ml/reports/{modality}_eval.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report)
        
    print(f"\nEvaluation complete! Report saved to {report_path}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--modality", choices=["text", "image"], required=True)
    parser.add_argument("--dataset", required=True)
    args = parser.parse_args()
    
    # Add root dir to sys path
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    
    if args.modality == "text":
        from ml.text_detector.predict import predict_text
        evaluate_modality("text", args.dataset, predict_text)
    elif args.modality == "image":
        from ml.image_detector.predict import predict_image
        evaluate_modality("image", args.dataset, predict_image)

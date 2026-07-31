# 📊 Evaluation Report: Text Detector

**Date:** 2026-07-28 15:44:17
**Total Samples:** 300
**Conclusive Predictions:** 300
**Inconclusive Predictions:** 0 (0.0%)
**Execution Time:** 617.87s

## 🎯 Primary Metrics (Conclusive only)
- **Accuracy:** 98.33%
- **Precision (AI):** 100.00%
- **Recall (AI):** 96.67%
- **F1 Score:** 98.31%

## 📉 Confusion Matrix
| | Predicted AI | Predicted Human |
|---|---|---|
| **Actual AI** | 145 (TP) | 5 (FN) |
| **Actual Human** | 0 (FP) | 150 (TN) |

## 🧠 Ensemble Confidence
- **Average Signal Agreement:** 52.27%

## 🔍 Per-Signal Breakdown (each signal alone, thresholded at 0.5)
| Signal | Accuracy | Precision (AI) | Recall (AI) | N |
|---|---|---|---|---|
| Burstiness | 42.5% | 28.3% | 10.3% | 292 |
| GPT-2 Classifier | 96.0% | 97.9% | 94.0% | 300 |
| HC3 Classifier | 98.3% | 100.0% | 96.7% | 300 |
| Perplexity | 75.0% | 90.0% | 55.9% | 292 |
| Repetition & Clichés | 50.3% | 54.5% | 4.0% | 300 |
| Stylometric Classifier | 87.7% | 91.9% | 82.7% | 300 |
| Token Entropy | 67.3% | 81.7% | 44.7% | 300 |

*Note: Inconclusive results occur when the ensemble's signals disagree significantly, prioritizing safety over forcing a wrong guess. Use the per-signal table above to decide which signals deserve more ensemble weight and which are dragging accuracy down.*

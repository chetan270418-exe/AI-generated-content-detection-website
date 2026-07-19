"""
Benchmark script for the new text detection ensemble.
Runs the ensemble against a small set of known AI and Human text samples.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.text_detector.model import preload_all
from ml.text_detector.predict import predict_text

AI_SAMPLES = [
    "It is important to note that the intricate tapestry of human experience is multifaceted. Delving into this topic, we find a robust synergy between various paradigms.",
    "In today's fast-paced digital landscape, leveraging comprehensive strategies is pivotal. Furthermore, it goes without saying that meticulous planning fosters success.",
    "As an AI language model, I don't have personal opinions, but I can provide an objective overview of the situation. It's crucial to understand both sides of the argument.",
    "The rapid advancement of artificial intelligence underscores the need for robust ethical frameworks. In summary, navigating these challenges requires a holistic approach.",
]

HUMAN_SAMPLES = [
    "I literally can't even right now. Did you see what happened at the store? Some guy just walked in and took like 10 bags of chips without paying lol.",
    "So I was thinking about what you said yesterday, and I think you're right. We should probably delay the launch until next week just to be safe. Let me know what you think.",
    "Just finished watching the new episode! Omg the twist at the end was crazy. I didn't see that coming at all. We need to talk about it tomorrow.",
    "Hey, just checking in. Are we still on for lunch at 12? I might be like 5 mins late because of traffic, but I'm leaving now.",
]

def run_benchmark():
    print("Preloading models...")
    preload_all()
    
    print("\n" + "="*50)
    print("TESTING KNOWN AI SAMPLES")
    print("="*50)
    
    ai_correct = 0
    for i, text in enumerate(AI_SAMPLES):
        print(f"\n[AI Sample {i+1}]")
        print(f"Text: '{text[:80]}...'")
        res = predict_text(text)
        print(f"Verdict: {res['verdict']} (Confidence: {res['confidence']:.2f})")
        print(f"AI Probability: {res['detailed_results'].get('final_ai_probability', 0):.2f}")
        
        if res['verdict'] == 'ai_generated':
            ai_correct += 1
            
    print("\n" + "="*50)
    print("TESTING KNOWN HUMAN SAMPLES")
    print("="*50)
    
    human_correct = 0
    for i, text in enumerate(HUMAN_SAMPLES):
        print(f"\n[Human Sample {i+1}]")
        print(f"Text: '{text[:80]}...'")
        res = predict_text(text)
        print(f"Verdict: {res['verdict']} (Confidence: {res['confidence']:.2f})")
        print(f"AI Probability: {res['detailed_results'].get('final_ai_probability', 0):.2f}")
        
        if res['verdict'] == 'human_made':
            human_correct += 1
            
    print("\n" + "="*50)
    print("BENCHMARK RESULTS")
    print("="*50)
    print(f"AI Detection Accuracy: {ai_correct}/{len(AI_SAMPLES)} ({ai_correct/len(AI_SAMPLES)*100:.0f}%)")
    print(f"Human Detection Accuracy: {human_correct}/{len(HUMAN_SAMPLES)} ({human_correct/len(HUMAN_SAMPLES)*100:.0f}%)")
    print(f"Total Accuracy: {(ai_correct + human_correct)}/{len(AI_SAMPLES) + len(HUMAN_SAMPLES)}")

if __name__ == "__main__":
    run_benchmark()

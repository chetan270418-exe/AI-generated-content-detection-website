import os
import librosa
import numpy as np

class AudioDetectorModel:
    def __init__(self):
        self.model_id = os.getenv("HF_MODEL_AUDIO", "piotr-napierala/hubert-base-deepfake-detection")
        self.processor = None
        self.model = None
        
    def load(self):
        try:
            from transformers import AutoFeatureExtractor
            from optimum.onnxruntime import ORTModelForAudioClassification
            
            print(f"Loading Audio ONNX model: {self.model_id}")
            self.processor = AutoFeatureExtractor.from_pretrained(self.model_id)
            self.model = ORTModelForAudioClassification.from_pretrained(
                self.model_id, 
                export=True, 
                provider="CPUExecutionProvider"
            )
            print("Audio model loaded successfully.")
        except Exception as e:
            print(f"Warning: Failed to load HF Audio model ({e}). Falling back to Librosa frequency analysis.")
            self.model = None

    def predict(self, audio_path: str) -> dict:
        if self.model and self.processor:
            try:
                import torch
                # Load audio
                waveform, sample_rate = librosa.load(audio_path, sr=16000)
                inputs = self.processor(waveform, sampling_rate=sample_rate, return_tensors="pt", padding=True)
                
                with torch.no_grad():
                    outputs = self.model(**inputs)
                    logits = outputs.logits
                    probs = torch.softmax(logits, dim=-1)[0].numpy()
                
                # Assuming class 1 is fake, class 0 is real (standard for this model)
                fake_prob = float(probs[1]) if len(probs) > 1 else float(probs[0])
                label = "fake" if fake_prob > 0.5 else "real"
                
                return {
                    "label": label,
                    "confidence": max(fake_prob, 1 - fake_prob),
                    "ai_probability": fake_prob,
                    "source": "hf_model"
                }
            except Exception as e:
                print(f"HF Audio inference failed: {e}")
                
        # Fallback: Librosa frequency analysis
        return self._librosa_heuristic(audio_path)
        
    def _librosa_heuristic(self, audio_path: str) -> dict:
        """
        Advanced heuristic analysis. AI-generated voices often have:
        1. Abnormal spectral rolloff (band-limited)
        2. Unnatural MFCC variance (too perfectly consistent)
        3. Very high Harmonic-to-Noise Ratio (HNR) - lacking natural breath/rasp
        """
        try:
            y, sr = librosa.load(audio_path, sr=None)
            
            # 1. Spectral Rolloff (High frequencies)
            rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr, roll_percent=0.85)
            mean_rolloff = float(np.mean(rolloff))
            
            # 2. Zero Crossing Rate (Fricatives/Breaths)
            zcr = librosa.feature.zero_crossing_rate(y)
            mean_zcr = float(np.mean(zcr))
            
            # 3. MFCC Variance (Consistency of timbre)
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            # Take variance across time for the first few coefficients
            mfcc_var = float(np.mean(np.var(mfccs[1:5, :], axis=1)))
            
            # 4. Spectral Centroid
            cent = librosa.feature.spectral_centroid(y=y, sr=sr)
            mean_cent = float(np.mean(cent))
            
            import math
            # Scoring logic with calibrated sigmoids
            # AI voice clones often have a lower rolloff cutoff due to 22kHz or 16kHz generation
            score_rolloff = 1.0 / (1.0 + math.exp(0.002 * (mean_rolloff - 3500)))
            
            # AI voices are often "too perfect" -> lower MFCC variance over time
            score_mfcc = 1.0 / (1.0 + math.exp(0.05 * (mfcc_var - 150)))
            
            # ZCR checks for natural sibilance
            score_zcr = 1.0 / (1.0 + math.exp(100.0 * (mean_zcr - 0.06)))
            
            ai_score = 0.4 * score_rolloff + 0.4 * score_mfcc + 0.2 * score_zcr
            ai_score = max(0.0, min(1.0, ai_score))
            
            return {
                "label": "fake" if ai_score > 0.6 else "real",
                "confidence": max(ai_score, 1 - ai_score),
                "ai_probability": float(ai_score),
                "source": "librosa_heuristic",
                "details": {
                    "mean_rolloff": mean_rolloff,
                    "mean_zcr": mean_zcr,
                    "mfcc_variance": mfcc_var,
                    "mean_centroid": mean_cent
                }
            }
        except Exception as e:
            print(f"Librosa analysis failed: {e}")
            return {"label": "inconclusive", "confidence": 0.0, "ai_probability": 0.5, "source": "error"}

_audio_model_instance = None

def get_audio_model():
    global _audio_model_instance
    if _audio_model_instance is None:
        _audio_model_instance = AudioDetectorModel()
        _audio_model_instance.load()
    return _audio_model_instance

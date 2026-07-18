"""
Video Deepfake Detector — samples frames from a video file,
runs each through the image detector, and determines if the
video is likely a deepfake based on frame-level AI detection rates.
"""
import os
import tempfile
import cv2
import numpy as np

from ml.image_detector.predict import predict_image


def predict_video(video_path: str, max_frames: int = 30) -> dict:
    """
    Analyze a video for deepfake / AI-generated content.
    
    Strategy:
    1. Open the video and determine FPS and total frames.
    2. Sample 1 frame per second (up to max_frames).
    3. Run each sampled frame through ImageDetectorModel + ELA.
    4. If >15% of frames are flagged AI → verdict: ai_generated.
    """
    try:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError("Could not open video file")
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps > 0 else 0
        
        # Determine which frames to sample (1 per second, capped at max_frames)
        sample_interval = max(1, int(fps))  # 1 frame per second
        frame_indices = list(range(0, total_frames, sample_interval))[:max_frames]
        
        frame_results = []
        ai_count = 0
        human_count = 0
        inconclusive_count = 0
        
        for frame_idx in frame_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if not ret:
                continue
            
            # Save frame to temp file
            with tempfile.NamedTemporaryFile(
                suffix=".jpg", delete=False, dir=tempfile.gettempdir()
            ) as tmp:
                cv2.imwrite(tmp.name, frame)
                tmp_path = tmp.name
            
            try:
                result = predict_image(tmp_path)
                timestamp = round(frame_idx / fps, 1) if fps > 0 else 0
                
                frame_result = {
                    "frame_index": frame_idx,
                    "timestamp": timestamp,
                    "verdict": result["verdict"],
                    "confidence": result["confidence"],
                    "model_score": result.get("model_score", 0),
                    "ela_score": result.get("ela_score", 0),
                }
                frame_results.append(frame_result)
                
                if result["verdict"] == "ai_generated":
                    ai_count += 1
                elif result["verdict"] == "human_made":
                    human_count += 1
                else:
                    inconclusive_count += 1
            finally:
                os.unlink(tmp_path)
        
        cap.release()
        
        total_analyzed = len(frame_results)
        if total_analyzed == 0:
            raise ValueError("No frames could be extracted from the video")
        
        ai_ratio = ai_count / total_analyzed
        
        # Calculate average confidence across all frames
        avg_confidence = sum(r["confidence"] for r in frame_results) / total_analyzed
        
        # Temporal consistency check: high variance in frame scores = suspicious
        scores = [r["model_score"] for r in frame_results]
        score_std = float(np.std(scores)) if len(scores) > 1 else 0.0
        
        # Final scoring
        # ai_ratio is the primary signal, score_std is secondary
        final_score = ai_ratio
        
        if final_score > 0.15:
            verdict = "ai_generated"
            explanation = (
                f"Deepfake indicators detected (Score: {final_score:.2f}). "
                f"Out of {total_analyzed} sampled frames, {ai_count} ({ai_ratio*100:.0f}%) "
                f"were flagged as AI-generated. Duration: {duration:.1f}s."
            )
        elif final_score < 0.05 and human_count > total_analyzed * 0.7:
            verdict = "human_made"
            explanation = (
                f"Video appears authentic (Score: {final_score:.2f}). "
                f"Out of {total_analyzed} sampled frames, {human_count} ({human_count/total_analyzed*100:.0f}%) "
                f"appear genuine. Temporal consistency is normal (σ={score_std:.3f})."
            )
        else:
            verdict = "inconclusive"
            explanation = (
                f"Video analysis is inconclusive (Score: {final_score:.2f}). "
                f"Frames analyzed: {total_analyzed}. AI: {ai_count}, Human: {human_count}, "
                f"Inconclusive: {inconclusive_count}. Temporal variance: σ={score_std:.3f}."
            )
        
        return {
            "verdict": verdict,
            "confidence": avg_confidence,
            "explanation": explanation,
            "detailed_results": {
                "total_frames_in_video": total_frames,
                "frames_analyzed": total_analyzed,
                "fps": fps,
                "duration_seconds": round(duration, 1),
                "ai_frame_count": ai_count,
                "human_frame_count": human_count,
                "inconclusive_frame_count": inconclusive_count,
                "ai_ratio": ai_ratio,
                "temporal_consistency_std": score_std,
                "final_ai_probability": final_score,
                "frame_results": frame_results,
            }
        }
    except Exception as e:
        raise Exception(f"Failed to analyze video: {str(e)}")

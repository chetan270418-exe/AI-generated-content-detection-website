"""
PDF Document Detector — extracts text and images from PDFs,
routes them through existing text and image detectors,
and produces an aggregate AI-generation score.
"""
import os
import tempfile
import fitz  # PyMuPDF

from ml.text_detector.predict import predict_text
from ml.image_detector.predict import predict_image


def predict_pdf(pdf_path: str) -> dict:
    """
    Analyze a PDF document for AI-generated content.
    
    Strategy:
    1. Extract all text blocks from every page.
    2. Extract all embedded images from every page.
    3. Run text through TextDetectorModel, images through ImageDetectorModel.
    4. Weighted aggregate → final verdict.
    """
    try:
        doc = fitz.open(pdf_path)
        
        all_text = ""
        image_results = []
        page_details = []
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            
            # --- Extract text ---
            page_text = page.get_text("text").strip()
            if page_text:
                all_text += page_text + "\n\n"
            
            # --- Extract images ---
            image_list = page.get_images(full=True)
            for img_idx, img_info in enumerate(image_list):
                xref = img_info[0]
                try:
                    base_image = doc.extract_image(xref)
                    if base_image and base_image["image"]:
                        # Save image to temp file for analysis
                        ext = base_image.get("ext", "png")
                        with tempfile.NamedTemporaryFile(
                            suffix=f".{ext}", delete=False, dir=tempfile.gettempdir()
                        ) as tmp:
                            tmp.write(base_image["image"])
                            tmp_path = tmp.name
                        
                        try:
                            img_result = predict_image(tmp_path)
                            image_results.append({
                                "page": page_num + 1,
                                "image_index": img_idx + 1,
                                "verdict": img_result["verdict"],
                                "confidence": img_result["confidence"],
                            })
                        finally:
                            os.unlink(tmp_path)
                except Exception:
                    continue
            
            page_details.append({
                "page": page_num + 1,
                "text_length": len(page_text),
                "image_count": len(image_list),
            })
        
        doc.close()
        
        # --- Analyze aggregated text ---
        text_result = None
        text_ai_prob = 0.5  # neutral default
        if len(all_text.strip()) > 50:
            text_result = predict_text(all_text[:10000])  # cap at 10k chars
            verdict_t = text_result.get("verdict", "")
            conf_t = text_result.get("confidence", 0.5)
            if verdict_t == "ai_generated":
                text_ai_prob = conf_t
            elif verdict_t == "human_made":
                text_ai_prob = 1.0 - conf_t
            else:
                text_ai_prob = 0.5
        
        # --- Aggregate image scores ---
        image_ai_prob = 0.5
        if image_results:
            ai_probs = []
            for ir in image_results:
                if ir["verdict"] == "ai_generated":
                    ai_probs.append(ir["confidence"])
                elif ir["verdict"] == "human_made":
                    ai_probs.append(1.0 - ir["confidence"])
                else:
                    ai_probs.append(0.5)
            image_ai_prob = sum(ai_probs) / len(ai_probs)
        
        # --- Weighted final score ---
        has_text = len(all_text.strip()) > 50
        has_images = len(image_results) > 0
        
        if has_text and has_images:
            final_score = 0.6 * text_ai_prob + 0.4 * image_ai_prob
        elif has_text:
            final_score = text_ai_prob
        elif has_images:
            final_score = image_ai_prob
        else:
            final_score = 0.5
        
        # --- Verdict ---
        if final_score > 0.7:
            verdict = "ai_generated"
            explanation = (
                f"High probability of AI-generated content detected in this PDF (Score: {final_score:.2f}). "
                f"Analyzed {len(page_details)} pages, {len(all_text)} chars of text, and {len(image_results)} embedded images."
            )
        elif final_score < 0.3:
            verdict = "human_made"
            explanation = (
                f"This PDF appears to contain human-made content (Score: {final_score:.2f}). "
                f"Analyzed {len(page_details)} pages with natural text patterns and authentic imagery."
            )
        else:
            verdict = "inconclusive"
            explanation = (
                f"The analysis is inconclusive for this PDF (Score: {final_score:.2f}). "
                f"Some elements appear AI-generated while others seem authentic."
            )
        
        return {
            "verdict": verdict,
            "confidence": final_score if verdict == "ai_generated" else (
                1 - final_score if verdict == "human_made" else max(final_score, 1 - final_score)
            ),
            "explanation": explanation,
            "detailed_results": {
                "total_pages": len(page_details),
                "total_text_chars": len(all_text),
                "total_images_analyzed": len(image_results),
                "text_ai_probability": text_ai_prob,
                "image_ai_probability": image_ai_prob,
                "final_ai_probability": final_score,
                "text_result": text_result,
                "image_results": image_results,
                "page_details": page_details,
            }
        }
    except Exception as e:
        raise Exception(f"Failed to analyze PDF: {str(e)}")

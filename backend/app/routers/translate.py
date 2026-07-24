from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from deep_translator import GoogleTranslator
from ..models.user import User
from ..utils.jwt import get_current_user
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class TranslateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="Text to translate")
    target_language: str = Field(..., description="Target language code (e.g., 'en', 'hi', 'es')")

class TranslateResponse(BaseModel):
    translated_text: str
    detected_source_language: str = "auto"

@router.post("/", response_model=TranslateResponse)
async def translate_text(data: TranslateRequest, current_user: User = Depends(get_current_user)):
    """
    Translate text using deep-translator (Google Translate).
    """
    if not data.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
        
    try:
        # We use deep_translator's GoogleTranslator
        translator = GoogleTranslator(source='auto', target=data.target_language)
        
        import asyncio
        translated_text = await asyncio.to_thread(translator.translate, data.text)
        
        if not translated_text:
            raise HTTPException(status_code=500, detail="Translation failed (empty result).")
            
        return TranslateResponse(
            translated_text=translated_text,
            detected_source_language="auto" # GoogleTranslator auto-detects, but doesn't easily expose the detected lang code in this wrapper
        )
    except Exception as e:
        logger.error(f"Translation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Translation service error: {str(e)}")

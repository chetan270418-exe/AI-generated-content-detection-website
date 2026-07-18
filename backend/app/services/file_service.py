import os
import uuid
import aiofiles
from fastapi import UploadFile
from ..config import get_settings

settings = get_settings()

async def save_upload(file: UploadFile, user_id: str) -> str:
    user_dir = os.path.join(settings.upload_dir, user_id)
    os.makedirs(user_dir, exist_ok=True)
    
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(user_dir, filename)
    
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
        
    return file_path

def cleanup_file(file_path: str):
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"Failed to delete {file_path}: {e}")

from typing import Optional

def detect_category(content: bytes) -> Optional[str]:
    """
    Inspects the first ~16 bytes of a file to determine its real type
    based on magic bytes (file signatures), ignoring spoofable Content-Type headers.
    Returns "image", "pdf", "video", "audio", or None.
    """
    if len(content) < 16:
        return None
        
    # Image Magic Bytes
    if content.startswith(b'\xff\xd8\xff'):
        return "image" # JPEG
    if content.startswith(b'\x89PNG\r\n\x1a\n'):
        return "image" # PNG
    if content.startswith(b'GIF87a') or content.startswith(b'GIF89a'):
        return "image" # GIF
    if content[0:4] == b'RIFF' and content[8:12] == b'WEBP':
        return "image" # WEBP
    if content.startswith(b'BM'):
        return "image" # BMP

    # PDF Magic Bytes
    if content.startswith(b'%PDF-'):
        return "pdf"

    # Video Magic Bytes
    if content[4:8] == b'ftyp':
        return "video" # MP4 / MOV
    if content.startswith(b'\x1a\x45\xdf\xa3'):
        return "video" # WEBM / MKV
    if content[0:4] == b'RIFF' and content[8:12] == b'AVI ':
        return "video" # AVI

    # Audio Magic Bytes
    if content.startswith(b'ID3') or content.startswith(b'\xff\xfb') or content.startswith(b'\xff\xf3') or content.startswith(b'\xff\xf2'):
        return "audio" # MP3
    if content[0:4] == b'RIFF' and content[8:12] == b'WAVE':
        return "audio" # WAV
    if content.startswith(b'OggS'):
        return "audio" # OGG
    if content.startswith(b'fLaC'):
        return "audio" # FLAC

    return None

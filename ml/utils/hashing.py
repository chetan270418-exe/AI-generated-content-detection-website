import cv2
import numpy as np
import hashlib

def compute_dhash(image_path: str) -> str:
    """
    Computes a Difference Hash (dHash) for an image.
    This creates a 64-bit string that is robust to minor compressions,
    resizing, or slight color shifts.
    """
    try:
        # 1. Read image as grayscale
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            # Fallback to standard SHA-256 if OpenCV fails
            return _compute_sha256(image_path)
            
        # 2. Resize to 9x8 pixels (so we can compare 8 adjacent pixels in 8 rows)
        resized = cv2.resize(img, (9, 8), interpolation=cv2.INTER_AREA)
        
        # 3. Compare adjacent pixels
        hash_bits = []
        for row in range(8):
            for col in range(8):
                # If left pixel is brighter than right pixel -> 1 else 0
                hash_bits.append('1' if resized[row, col] > resized[row, col + 1] else '0')
                
        # 4. Convert 64 bits to hexadecimal string
        hash_str = ''.join(hash_bits)
        # Convert binary string to integer, then to hex string, pad to 16 chars
        return f"{int(hash_str, 2):016x}"
    except Exception as e:
        print(f"[dHash] Error hashing image {image_path}: {e}")
        return _compute_sha256(image_path)

def _compute_sha256(file_path: str) -> str:
    """Fallback standard hash for text/files that cannot be structurally hashed."""
    h = hashlib.sha256()
    with open(file_path, 'rb') as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

def hamming_distance(hash1: str, hash2: str) -> int:
    """
    Calculate the Hamming distance between two hex strings (dHashes).
    A distance of 0 means identical. < 10 means likely variations of same image.
    """
    if len(hash1) != len(hash2):
        return 999
        
    try:
        # Convert hex strings back to integers
        val1 = int(hash1, 16)
        val2 = int(hash2, 16)
        # XOR to find differing bits, then count set bits (bin().count('1'))
        return bin(val1 ^ val2).count('1')
    except ValueError:
        return 999

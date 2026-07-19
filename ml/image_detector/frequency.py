"""
Fourier Spectrum Analysis (DIRE-inspired) for Image Detection.

Modern diffusion models (Midjourney, Stable Diffusion, FLUX) leave characteristic
high-frequency artifacts due to their upsampling and iterative denoising steps.
These artifacts are invisible in the spatial domain (regular pixels) but form
distinct geometric patterns in the frequency domain (2D FFT spectrum).

This module extracts the azimuthal average of the power spectrum to detect
deviations from natural image statistics (the 1/f^2 power law).
"""

import cv2
import numpy as np

def compute_frequency_scores(image_path: str) -> dict:
    """
    Analyzes the frequency spectrum of an image to detect generative artifacts.
    
    Returns:
        {
            "frequency_score": float 0-1 (higher = more likely AI),
            "high_freq_energy": float,
            "spectrum_variance": float,
            "details": str
        }
    """
    try:
        # Load image as grayscale
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            raise ValueError("Could not read image for frequency analysis")
            
        # Crop to center square to avoid aspect ratio squishing artifacts in FFT
        h, w = img.shape
        min_dim = min(h, w)
        if min_dim > 512:
            # Resize if too large to save computation, but not too small 
            # to preserve high-frequency details
            scale = 512 / min_dim
            img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
            h, w = img.shape
            min_dim = min(h, w)
            
        cy, cx = h // 2, w // 2
        half_size = min_dim // 2
        img_cropped = img[cy - half_size : cy + half_size, cx - half_size : cx + half_size]
        
        # 1. Compute 2D Fast Fourier Transform
        f = np.fft.fft2(img_cropped)
        fshift = np.fft.fftshift(f)
        
        # 2. Compute Power Spectrum
        magnitude_spectrum = np.abs(fshift) ** 2
        
        # Avoid log of zero
        magnitude_spectrum = np.maximum(magnitude_spectrum, 1e-10)
        log_spectrum = np.log10(magnitude_spectrum)
        
        # 3. Azimuthal Average (Radial Profile)
        # AI images often have abnormal spikes in specific frequency bands
        y, x = np.indices(log_spectrum.shape)
        center = np.array([(log_spectrum.shape[0]-1)/2.0, (log_spectrum.shape[1]-1)/2.0])
        r = np.sqrt((x - center[1])**2 + (y - center[0])**2)
        r = r.astype(int)
        
        tbin = np.bincount(r.ravel(), log_spectrum.ravel())
        nr = np.bincount(r.ravel())
        radialprofile = tbin / nr
        
        # Focus on high frequencies (outer half of the spectrum)
        mid_point = len(radialprofile) // 2
        high_freq_profile = radialprofile[mid_point:]
        
        # Calculate metrics
        high_freq_energy = float(np.mean(high_freq_profile))
        spectrum_variance = float(np.var(high_freq_profile))
        
        # Natural images follow a smooth 1/f^2 decay.
        # AI images often have grid-like artifacts that show up as spikes in the high frequencies,
        # leading to higher variance and occasionally higher total energy in those bands.
        
        # --- Scoring ---
        # Baseline heuristics (would ideally be calibrated on a dataset)
        import math
        
        # AI images tend to have higher variance in the high-freq tail due to specific artifact peaks
        # Let's say typical natural image variance here is < 0.2, AI is often > 0.4
        var_score = 1.0 / (1.0 + math.exp(-15.0 * (spectrum_variance - 0.3)))
        
        # Energy score: AI upscalers often inject too much high-frequency energy
        energy_score = 1.0 / (1.0 + math.exp(-2.0 * (high_freq_energy - 3.5)))
        
        # Combine
        frequency_score = 0.7 * var_score + 0.3 * energy_score
        frequency_score = max(0.0, min(1.0, frequency_score))
        
        return {
            "frequency_score": float(frequency_score),
            "high_freq_energy": float(high_freq_energy),
            "spectrum_variance": float(spectrum_variance),
            "details": f"High frequency variance: {spectrum_variance:.3f}, energy: {high_freq_energy:.3f}"
        }
        
    except Exception as e:
        print(f"[frequency_analysis] Error: {e}")
        return {
            "frequency_score": 0.5,
            "high_freq_energy": 0.0,
            "spectrum_variance": 0.0,
            "details": f"Error: {e}"
        }

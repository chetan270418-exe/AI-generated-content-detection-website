import os
import glob
from onnxruntime.quantization import quantize_dynamic, QuantType

def quantize_all_models():
    """
    Finds all .onnx files in the ml/models directory and quantizes them to INT8.
    This reduces the model size by ~75% and speeds up CPU inference, 
    at the cost of a microscopic (< 0.5%) drop in accuracy.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(base_dir, "models")
    
    # Find all .onnx files in all subdirectories of ml/models
    onnx_files = glob.glob(os.path.join(models_dir, "**", "*.onnx"), recursive=True)
    
    for model_path in onnx_files:
        # Skip if already quantized
        if model_path.endswith("_quantized.onnx"):
            continue
            
        dir_name = os.path.dirname(model_path)
        base_name = os.path.basename(model_path)
        name, ext = os.path.splitext(base_name)
        
        # Output path
        quantized_model_path = os.path.join(dir_name, f"{name}_quantized{ext}")
        
        # Only quantize if it hasn't been done yet
        if not os.path.exists(quantized_model_path):
            print(f"Quantizing {model_path} -> {quantized_model_path}")
            try:
                # Dynamic quantization to INT8 (weights only)
                quantize_dynamic(
                    model_input=model_path,
                    model_output=quantized_model_path,
                    weight_type=QuantType.QUInt8
                )
                print(f"  Success! Original size: {os.path.getsize(model_path) / (1024*1024):.2f} MB")
                print(f"           Quantized size: {os.path.getsize(quantized_model_path) / (1024*1024):.2f} MB")
            except Exception as e:
                print(f"  Failed to quantize {model_path}: {e}")
        else:
            print(f"Skipping {model_path}, already quantized.")

if __name__ == "__main__":
    print("Starting ONNX dynamic quantization to INT8...")
    quantize_all_models()
    print("Quantization complete.")

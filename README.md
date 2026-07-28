# 🛡️ DICTATOR — AI Content Authenticity Detector

**Dictator** is a full-stack AI-powered platform that detects AI-generated content across **text, images, PDFs, video, and audio**. It uses a multi-signal ensemble approach combining deep learning classifiers with statistical forensic analysis for high accuracy and robustness.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://python.org)
[![Next.js 14](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📝 **Text Detection** | 7-signal ensemble: HC3 classifier, GPT-2 classifier, perplexity, burstiness, entropy, repetition analysis, and stylometric classifier |
| 🖼️ **Image Detection** | Swin Transformer + Error Level Analysis (ELA) + DCT frequency analysis + AI anomaly heatmaps |
| 📄 **PDF Detection** | Extracts text and images from PDFs, analyzes both independently |
| 🎬 **Video Detection** | Frame-by-frame AI analysis with temporal consistency checking |
| 🎵 **Audio Detection** | Spectral analysis for AI-generated speech/audio detection |
| 📊 **Detailed Breakdown** | Per-signal scoring with visual charts and AI probability gauge |
| 📥 **PDF Reports** | Downloadable forensic analysis reports |
| 🔐 **Authentication** | JWT-based auth with user accounts and analysis history |
| 👑 **Admin Dashboard** | Real-time monitoring with WebSocket updates |

---

## 🏗️ Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Next.js 14     │────▶│   FastAPI         │────▶│   ML Engine      │
│   Frontend       │◀────│   Backend         │◀────│   (ONNX Runtime) │
│   Port 3000      │     │   Port 8000       │     │   INT8 Quantized │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                              │                         │
                              ▼                         │
                         ┌──────────┐                   │
                         │ MongoDB  │◀──────────────────┘
                         │ Atlas    │
                         └──────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **MongoDB Atlas** account (free tier)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/chetan270418-exe/AI-generated-content-detection-website.git
cd AI-generated-content-detection-website
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, etc.
```

### 3. Backend Setup

```bash
# Create Python virtual environment
python -m venv .venv

# Activate it
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
pip install -r ml/requirements.txt
```

> **Have a CUDA GPU?** After the step above, run
> `pip uninstall onnxruntime && pip install -r ml/requirements-gpu.txt`.
> `model.py`'s `_get_provider()` auto-detects `CUDAExecutionProvider` and
> switches to it — no other code changes needed. Skip this if you're on CPU only.

### 4. Download & Export ML Models

```bash
# Export models to ONNX format (first run only)
python ml/export_models.py

# Quantize models to INT8 for low memory usage (optional but recommended)
python ml/quantize_models.py
```

### 4b. Evaluate & Improve Accuracy (optional)

```bash
# Build a larger, held-out benchmark instead of guessing accuracy from a handful of examples
python ml/build_eval_dataset.py --n 300 --skip-rows 8000 --out ml/data/text_eval_dataset.jsonl
python ml/build_eval_dataset.py --n 150 --skip-rows 20000 --out ml/data/text_train_split.jsonl

# See overall AND per-signal accuracy (which of the 7 text signals is actually helping)
python ml/evaluate.py --modality text --dataset ml/data/text_eval_dataset.jsonl

# Optional: replace the hand-tuned ensemble weights in ensemble.py with weights
# learned from data (train on the *_train_split, keep *_eval_dataset untouched for reporting)
python -m ml.common.train_ensemble_combiner --dataset ml/data/text_train_split.jsonl
python ml/evaluate.py --modality text --dataset ml/data/text_eval_dataset.jsonl  # re-check with the learned combiner
```

### 5. Frontend Setup

```bash
cd frontend
npm install
cd ..
```

### 6. Run the Application

**Windows (recommended):**
```bash
start.bat
```

**Manual start:**
```bash
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

Visit **http://localhost:3000** in your browser.

---

## 🧠 ML Models

| Model | Purpose | Size (INT8) |
|-------|---------|-------------|
| `umm-maybe/AI-image-detector` | Image AI detection (Swin Transformer) | ~90 MB |
| `Hello-SimpleAI/chatgpt-qa-detector-roberta` | Text AI detection (HC3/ChatGPT) | ~60 MB |
| `openai-community/roberta-base-openai-detector` | Text AI detection (GPT-2 era) | ~60 MB |
| `gpt2` (124M) | Perplexity & entropy analysis | ~500 MB |
| Custom GBM | Stylometric classifier (14 features) | ~50 KB |

All models are automatically downloaded from HuggingFace on first run, exported to ONNX, and optionally quantized to INT8 for 70%+ memory savings.

---

## 📁 Project Structure

```
AI-image-detection/
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── main.py           # App entry point
│   │   ├── config.py         # Pydantic settings
│   │   ├── database.py       # MongoDB/Beanie init
│   │   ├── models/           # Beanie document models
│   │   ├── routers/          # API routes (auth, analyze, results, admin)
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── services/         # File handling services
│   │   ├── tasks/            # Celery task definitions
│   │   └── utils/            # JWT, security, pubsub utilities
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                 # Next.js 14 frontend
│   ├── src/
│   │   ├── app/              # Pages (upload, result, history, about, admin)
│   │   ├── components/       # UI components (Navbar, Gauge, Charts, etc.)
│   │   └── lib/              # API client, auth context, types
│   ├── Dockerfile
│   └── package.json
├── ml/                       # ML detection engine
│   ├── image_detector/       # Image: model, ELA, frequency, heatmap
│   ├── text_detector/        # Text: model, perplexity, entropy, stylometry
│   ├── audio_detector/       # Audio: spectral analysis
│   ├── video_detector/       # Video: frame analysis
│   ├── pdf_detector/         # PDF: text+image extraction
│   ├── common/               # Shared: ensemble combiner, label config
│   ├── export_models.py      # HuggingFace → ONNX export
│   ├── quantize_models.py    # ONNX → INT8 quantization
│   └── requirements.txt
├── docker-compose.yml        # Production Docker orchestration
├── start.bat                 # One-click Windows launcher
├── .env.example              # Environment variable template
└── README.md
```

---

## 🐳 Docker Deployment (AWS)

```bash
# Build and run all services
docker-compose up -d --build

# View logs
docker-compose logs -f
```

See the [AWS Deployment Guide](docs/aws_deployment_guide.md) for detailed instructions on deploying to AWS EC2 free tier.

---

## 🔧 Memory Optimization

This project is optimized for **low-memory environments** (2-4 GB RAM):

- **INT8 Quantization**: Models compressed from ~2.5 GB to ~700 MB
- **Lazy Loading**: Only one model loaded at a time with automatic garbage collection
- **Single-threaded ONNX**: `intra_op_num_threads = 1` to prevent memory spikes
- **Production Next.js**: Static build instead of dev server (saves ~1.5 GB RAM)

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Built with ❤️ using FastAPI, Next.js, ONNX Runtime, and MongoDB**

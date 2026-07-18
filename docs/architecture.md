# Dictator Architecture

This document outlines the architecture for the **Dictator — AI Content Authenticity Detector**.

## High-Level Architecture

The platform uses a decoupled architecture with a Next.js frontend, a FastAPI backend, and an asynchronous ML inference layer.

```mermaid
graph TD
    Client[Next.js Frontend] -->|REST API via Axios| API[FastAPI Backend]
    
    API -->|Motor Async Driver| DB[(MongoDB Atlas)]
    
    API -.->|Currently bypassed for MVP| Celery[Celery Workers]
    Celery -.->|Uses| Redis[(Redis Broker)]
    
    API --> ML_Image[Image ML Pipeline]
    API --> ML_Text[Text ML Pipeline]
    
    ML_Image --> ViT[ONNX ViT Classifier]
    ML_Image --> ELA[OpenCV ELA Analysis]
    
    ML_Text --> RoBERTa[ONNX RoBERTa Classifier]
    ML_Text --> GPT2[Perplexity/Burstiness Scoring]
```

## Machine Learning Pipeline

The ML pipeline is optimized for CPU inference using ONNX Runtime.

### Image Detection
```mermaid
flowchart LR
    Upload[Image Upload] --> Resize[Resize & Normalize]
    
    Resize --> ViT[ONNX Vision Transformer]
    ViT --> Conf_Model[Model Confidence Score]
    
    Resize --> ELA[Error Level Analysis]
    ELA --> ELA_Score[Forensic Anomaly Score]
    
    Conf_Model --> Weights{Weighted Combination}
    ELA_Score --> Weights
    
    Weights --> Result[Final Verdict]
```

### Text Detection
```mermaid
flowchart LR
    Input[Text Input] --> Clean[Sanitize Text]
    
    Clean --> RoBERTa[ONNX RoBERTa]
    RoBERTa --> Conf_Model[Classification Score]
    
    Clean --> GPT2[GPT-2 Evaluator]
    GPT2 --> Perplexity[Perplexity Score]
    GPT2 --> Burstiness[Burstiness Score]
    
    Conf_Model --> Weights{Weighted Combination}
    Perplexity --> Weights
    Burstiness --> Weights
    
    Weights --> Result[Final Verdict]
```

## Data Models

The database relies on MongoDB. We use `Beanie` as an asynchronous ODM (Object Document Mapper).

```mermaid
erDiagram
    USER ||--o{ ANALYSIS : creates
    USER {
        string email
        string hashed_password
        string plan
        datetime trial_start
        int analyses_count
    }
    ANALYSIS {
        string user_id
        string file_type
        string status
        string verdict
        float confidence_score
        json detailed_results
    }
```

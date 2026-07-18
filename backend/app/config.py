from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "dictator"
    redis_url: str = "redis://localhost:6379/0"
    
    jwt_secret: str = "supersecretkey"
    jwt_algorithm: str = "HS256"
    jwt_expiry_hours: int = 24
    
    upload_dir: str = "./uploads"
    max_file_size_mb: int = 10
    
    hf_model_image: str = "umm-maybe/AI-image-detector"
    hf_model_text: str = "openai-community/roberta-base-openai-detector"
    
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    
    frontend_url: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", extra='ignore')

@lru_cache
def get_settings() -> Settings:
    return Settings()

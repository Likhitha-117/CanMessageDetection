"""
Application configuration loaded from environment variables.
"""
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # MongoDB
    MONGODB_URL: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "can_ids"

    # JWT
    SECRET_KEY: str = "super-secret-change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Model
    MODEL_PATH: str = "log_model/lstm_model.pth"
    SEQ_LENGTH: int = 10
    FEATURE_COUNT: int = 10

    class Config:
        env_file = ".env"


settings = Settings()

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    APP_NAME: str = "Technical Documentation Generator"
    DEBUG: bool = False
    API_VERSION: str = "v1"

    DATABASE_URL: str = "sqlite:///./data/docs.db"

    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "deepseek-coder:6.7b"
    OLLAMA_TIMEOUT: int = 300

    MAX_FILE_SIZE: int = 52428800  # 50 MB
    UPLOAD_DIR: str = "./uploads"

    GITHUB_TOKEN: str = ""

    ALLOWED_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]

    ALLOWED_CODE_EXTENSIONS: List[str] = [
        ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".cpp", ".c", ".h",
        ".cs", ".go", ".rs", ".php", ".rb", ".swift", ".kt", ".scala",
        ".r", ".m", ".sh", ".yaml", ".yml", ".json", ".xml", ".html",
        ".css", ".scss", ".sass", ".sql", ".md", ".vue", ".dart",
    ]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs("data", exist_ok=True)

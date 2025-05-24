from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./app.db"
    EXCEL_DATA_PATH: str = "./data"
    CORS_ORIGINS: str = "http://localhost:3000"
    
    @property
    def cors_origins_list(self) -> List[str]:
        if self.CORS_ORIGINS.startswith('['):
            # Handle JSON array format
            import json
            return json.loads(self.CORS_ORIGINS)
        else:
            # Handle comma-separated format
            return [origin.strip() for origin in self.CORS_ORIGINS.split(',')]
    
    class Config:
        env_file = ".env"

settings = Settings()
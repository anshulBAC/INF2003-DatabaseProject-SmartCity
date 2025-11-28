from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # App Configuration
    APP_NAME: str = "Smart City Framework API"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    PORT: int = 8000
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # MariaDB Configuration
    MARIADB_HOST: str = "localhost"
    MARIADB_PORT: int = 3306
    MARIADB_USER: str
    MARIADB_PASSWORD: str
    MARIADB_DATABASE: str = "smart_city"
    
    # MongoDB Configuration
    MONGODB_USER: str
    MONGODB_PASSWORD: str
    MONGODB_CLUSTER: str
    MONGODB_NAME: str
    
    # Redis Configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None

    # Neo4j Configuration
    NEO4J_URI: str
    NEO4J_USER: str
    NEO4J_PASSWORD: str
    
    # External APIs
    LTA_API_KEY: str
    LTA_BASE_URL: str = "http://datamall2.mytransport.sg/ltaodataservice"
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100
    RATE_LIMIT_BURST: int = 200
    
    # Cache TTL (seconds)
    CACHE_TTL_SHORT: int = 60      # 1 minute for real-time data
    CACHE_TTL_MEDIUM: int = 300    # 5 minutes for semi-static data
    CACHE_TTL_LONG: int = 3600     # 1 hour for static data
    
    # Background Tasks
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    
    @property
    def mariadb_url(self) -> str:
        return f"mysql+pymysql://{self.MARIADB_USER}:{self.MARIADB_PASSWORD}@{self.MARIADB_HOST}:{self.MARIADB_PORT}/{self.MARIADB_DATABASE}"
    
    @property
    def mongodb_uri(self) -> str:
        return f"mongodb+srv://{self.MONGODB_USER}:{self.MONGODB_PASSWORD}@{self.MONGODB_CLUSTER}/?retryWrites=true&w=majority&appName={self.MONGODB_NAME}"
    
    @property
    def redis_url(self) -> str:
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
    
    @property
    def neo4j_url(self) -> str:
        return self.NEO4J_URI
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from motor.motor_asyncio import AsyncIOMotorClient
import redis.asyncio as redis
from .settings import settings
import logging

logger = logging.getLogger(__name__)

# MariaDB Configuration
engine = create_engine(
    settings.mariadb_url,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=settings.DEBUG,
    max_overflow=20,
    pool_size=10
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# MongoDB Configuration
class MongoDB:
    client: AsyncIOMotorClient = None
    database = None

mongodb = MongoDB()

async def connect_to_mongo():
    """Create database connection"""
    try:
        mongodb.client = AsyncIOMotorClient(settings.mongodb_uri)
        mongodb.database = mongodb.client[settings.MONGODB_NAME]
        
        # Test connection
        await mongodb.client.admin.command('ismaster')
        logger.info("Successfully connected to MongoDB")
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close database connection"""
    if mongodb.client:
        mongodb.client.close()
        logger.info("MongoDB connection closed")

# Redis Configuration
class RedisClient:
    redis_client: redis.Redis = None

redis_client = RedisClient()

async def connect_to_redis():
    """Create Redis connection"""
    try:
        redis_client.redis_client = redis.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
            max_connections=20
        )
        
        # Test connection
        await redis_client.redis_client.ping()
        logger.info("Successfully connected to Redis")
        
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        raise

async def close_redis_connection():
    """Close Redis connection"""
    if redis_client.redis_client:
        await redis_client.redis_client.close()
        logger.info("Redis connection closed")

# Database dependencies for FastAPI
def get_db():
    """Dependency for getting MariaDB session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_mongo_db():
    """Dependency for getting MongoDB database"""
    return mongodb.database

def get_redis():
    """Dependency for getting Redis client"""
    return redis_client.redis_client
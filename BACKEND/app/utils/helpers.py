"""
Consolidated Smart City Framework Utilities

This file contains all utility functions:
- Exception classes
- Authentication utilities
- Validation functions
- Caching utilities
"""

import re
import json
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Tuple
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
import structlog

from app.config.settings import settings

logger = structlog.get_logger(__name__)

# ================================
# EXCEPTION CLASSES
# ================================

class SmartCityException(Exception):
    """Base exception class for all Smart City Framework errors"""
    def __init__(self, message: str, error_code: str = None):
        self.message = message
        self.error_code = error_code
        super().__init__(self.message)


class ExternalAPIError(SmartCityException):
    """Raised when external API calls fail"""
    def __init__(self, message: str, api_name: str = None, status_code: int = None):
        self.api_name = api_name
        self.status_code = status_code
        super().__init__(message, "EXTERNAL_API_ERROR")


class DataNotFoundError(SmartCityException):
    """Raised when requested data is not found"""
    def __init__(self, message: str, resource_type: str = None):
        self.resource_type = resource_type
        super().__init__(message, "DATA_NOT_FOUND")


class ValidationError(SmartCityException):
    """Raised when data validation fails"""
    def __init__(self, message: str, field_name: str = None):
        self.field_name = field_name
        super().__init__(message, "VALIDATION_ERROR")


class AuthenticationError(SmartCityException):
    """Raised when authentication fails"""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, "AUTHENTICATION_ERROR")


# ================================
# AUTHENTICATION UTILITIES
# ================================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)


class User:
    """Simple user model for authentication"""
    def __init__(self, user_id: str, email: str, role: str = "user", permissions: list = None):
        self.id = user_id
        self.email = email
        self.role = role
        self.permissions = permissions or []


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc)() + expires_delta
    else:
        expire = datetime.now(timezone.utc)() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    try:
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        logger.info("Access token created", user_id=data.get("sub"))
        return encoded_jwt
    except Exception as e:
        logger.error("Failed to create access token", error=str(e))
        raise AuthenticationError("Failed to create access token")


def verify_token(token: str) -> Dict[str, Any]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        exp = payload.get("exp")
        if exp and datetime.fromtimestamp(exp) < datetime.now(timezone.utc)():
            raise AuthenticationError("Token has expired")
        return payload
    except JWTError as e:
        logger.warning("JWT verification failed", error=str(e))
        raise AuthenticationError("Invalid token")


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current authenticated user from JWT token"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = verify_token(credentials.credentials)
        user_id = payload.get("sub")
        
        if not user_id:
            raise AuthenticationError("Invalid token payload")
        
        user = User(
            user_id=user_id,
            email=payload.get("email", "demo@smartcity.sg"),
            role=payload.get("role", "user"),
            permissions=payload.get("permissions", [])
        )
        
        logger.debug("User authenticated", user_id=user_id, role=user.role)
        return user
        
    except AuthenticationError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user_optional(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[User]:
    """Get current user if authenticated, None if not"""
    if not credentials:
        return None
    
    try:
        return get_current_user(credentials)
    except HTTPException:
        return None


# ================================
# VALIDATION FUNCTIONS
# ================================

def validate_coordinates(latitude: float, longitude: float) -> bool:
    """Validate latitude and longitude coordinates"""
    if not isinstance(latitude, (int, float)):
        raise ValidationError("Latitude must be a number", "latitude")
    
    if not isinstance(longitude, (int, float)):
        raise ValidationError("Longitude must be a number", "longitude")
    
    if not -90 <= latitude <= 90:
        raise ValidationError(f"Latitude must be between -90 and 90, got {latitude}", "latitude")
    
    if not -180 <= longitude <= 180:
        raise ValidationError(f"Longitude must be between -180 and 180, got {longitude}", "longitude")
    
    return True


def validate_singapore_coordinates(latitude: float, longitude: float) -> bool:
    """Validate coordinates are within Singapore bounds"""
    validate_coordinates(latitude, longitude)
    
    if not 1.16 <= latitude <= 1.48:
        raise ValidationError(f"Latitude {latitude} is outside Singapore bounds", "latitude")
    
    if not 103.59 <= longitude <= 104.04:
        raise ValidationError(f"Longitude {longitude} is outside Singapore bounds", "longitude")
    
    return True


def validate_date_range(start_date: datetime, end_date: datetime, max_days: int = 365) -> bool:
    """Validate date range for queries"""
    if not isinstance(start_date, datetime):
        raise ValidationError("Start date must be a datetime object", "start_date")
    
    if not isinstance(end_date, datetime):
        raise ValidationError("End date must be a datetime object", "end_date")
    
    if start_date >= end_date:
        raise ValidationError("Start date must be before end date", "date_range")
    
    if end_date > datetime.now(timezone.utc)():
        raise ValidationError("End date cannot be in the future", "end_date")
    
    days_diff = (end_date - start_date).days
    if days_diff > max_days:
        raise ValidationError(f"Date range too large. Maximum {max_days} days allowed", "date_range")
    
    return True


def validate_pagination(skip: int, limit: int, max_limit: int = 1000) -> Tuple[int, int]:
    """Validate and normalize pagination parameters"""
    if not isinstance(skip, int) or skip < 0:
        raise ValidationError("Skip must be a non-negative integer", "skip")
    
    if not isinstance(limit, int) or limit < 1:
        raise ValidationError("Limit must be a positive integer", "limit")
    
    if limit > max_limit:
        raise ValidationError(f"Limit cannot exceed {max_limit}", "limit")
    
    return skip, limit


# ================================
# CACHING UTILITIES
# ================================

# Simple in-memory cache for development (replace with Redis in production)
_cache = {}
_cache_timestamps = {}


async def cache_get(key: str) -> Optional[Any]:
    """Get value from cache"""
    try:
        if key in _cache:
            # Check if cache entry is still valid (5 minutes TTL)
            timestamp = _cache_timestamps.get(key, 0)
            if datetime.now(timezone.utc)().timestamp() - timestamp < 300:  # 5 minutes
                logger.debug("Cache hit", key=key)
                return _cache[key]
            else:
                # Expired, remove from cache
                _cache.pop(key, None)
                _cache_timestamps.pop(key, None)
                logger.debug("Cache expired", key=key)
        
        logger.debug("Cache miss", key=key)
        return None
        
    except Exception as e:
        logger.error("Cache get error", key=key, error=str(e))
        return None


async def cache_set(key: str, value: Any, ttl: int = 300) -> bool:
    """Set value in cache"""
    try:
        _cache[key] = value
        _cache_timestamps[key] = datetime.now(timezone.utc)().timestamp()
        
        logger.debug("Cache set", key=key, ttl=ttl)
        return True
        
    except Exception as e:
        logger.error("Cache set error", key=key, error=str(e))
        return False


async def cache_delete(key: str) -> bool:
    """Delete key from cache"""
    try:
        _cache.pop(key, None)
        _cache_timestamps.pop(key, None)
        
        logger.debug("Cache delete", key=key)
        return True
        
    except Exception as e:
        logger.error("Cache delete error", key=key, error=str(e))
        return False


async def cache_clear() -> bool:
    """Clear all cache entries"""
    try:
        _cache.clear()
        _cache_timestamps.clear()
        
        logger.info("Cache cleared")
        return True
        
    except Exception as e:
        logger.error("Cache clear error", error=str(e))
        return False


# ================================
# UTILITY FUNCTIONS
# ================================

def sanitize_string(text: str, max_length: int = 1000) -> str:
    """Sanitize and validate string input"""
    if not isinstance(text, str):
        raise ValidationError("Input must be a string", "text")
    
    # Remove control characters
    sanitized = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    
    # Remove HTML tags
    sanitized = re.sub(r'<[^>]*>', '', sanitized)
    
    # Trim whitespace
    sanitized = sanitized.strip()
    
    if len(sanitized) > max_length:
        raise ValidationError(f"Text too long. Maximum {max_length} characters allowed", "text")
    
    return sanitized


def format_datetime(dt: datetime) -> str:
    """Format datetime for API responses"""
    return dt.isoformat() if dt else None


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates in kilometers (simplified)"""
    # Simplified calculation - in production use proper geospatial libraries
    lat_diff = abs(lat1 - lat2)
    lon_diff = abs(lon1 - lon2)
    
    # Rough approximation: 1 degree ≈ 111 km
    distance = ((lat_diff ** 2) + (lon_diff ** 2)) ** 0.5 * 111
    return round(distance, 2)
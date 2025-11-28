"""Smart City Framework Utilities

This package contains utility functions and helpers:
- helpers.py: Authentication, validation, caching, and exceptions
"""

from .helpers import (
    # Authentication
    create_access_token,
    verify_token,
    get_current_user,
    get_current_user_optional,
    
    # Validation
    validate_coordinates,
    validate_singapore_coordinates,
    validate_date_range,
    validate_pagination,
    
    # Caching
    cache_get,
    cache_set,
    cache_delete,
    
    # Exceptions
    SmartCityException,
    ExternalAPIError,
    DataNotFoundError,
    ValidationError,
    AuthenticationError
)

__all__ = [
    # Authentication
    "create_access_token",
    "verify_token", 
    "get_current_user",
    "get_current_user_optional",
    
    # Validation
    "validate_coordinates",
    "validate_singapore_coordinates",
    "validate_date_range",
    "validate_pagination",
    
    # Caching
    "cache_get",
    "cache_set",
    "cache_delete",
    
    # Exceptions
    "SmartCityException",
    "ExternalAPIError",
    "DataNotFoundError", 
    "ValidationError",
    "AuthenticationError"
]
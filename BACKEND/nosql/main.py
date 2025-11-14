from fastapi import FastAPI, HTTPException, Depends, Request, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import structlog
import time
from contextlib import asynccontextmanager

from app.config.settings import settings
from app.config.database import connect_to_mongo, close_mongo_connection, connect_to_redis, close_redis_connection
from app.services import traffic_service, parking_service, planning_service, analytics_service
from app.utils.helpers import (
    ExternalAPIError, DataNotFoundError, ValidationError, 
    get_current_user_optional, validate_coordinates, validate_pagination
)

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    logger.info("Starting Smart City Framework API", version=settings.VERSION)
    
    try:
        # Initialize database connections
        await connect_to_mongo()
        await connect_to_redis()
        
        logger.info("Application startup completed successfully")
        
        yield
        
    except Exception as e:
        logger.error("Failed to start application", error=str(e))
        raise
    
    finally:
        # Shutdown
        logger.info("Shutting down Smart City Framework API")
        await close_mongo_connection()
        await close_redis_connection()
        logger.info("Application shutdown completed")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="A comprehensive smart city framework for traffic management and urban planning",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.smart-city-framework.com"]
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Log all HTTP requests with timing"""
    start_time = time.time()
    
    logger.info(
        "HTTP request started",
        method=request.method,
        url=str(request.url),
        client_ip=request.client.host
    )
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        
        logger.info(
            "HTTP request completed",
            method=request.method,
            url=str(request.url),
            status_code=response.status_code,
            process_time_ms=round(process_time * 1000, 2)
        )
        
        response.headers["X-Process-Time"] = str(process_time)
        return response
        
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(
            "HTTP request failed",
            method=request.method,
            url=str(request.url),
            error=str(e),
            process_time_ms=round(process_time * 1000, 2)
        )
        raise


# Exception handlers
@app.exception_handler(ExternalAPIError)
async def external_api_exception_handler(request: Request, exc: ExternalAPIError):
    logger.error("External API error", error=str(exc), url=str(request.url))
    return JSONResponse(
        status_code=503,
        content={
            "error": "external_service_unavailable",
            "message": "External data service is temporarily unavailable",
            "detail": str(exc) if settings.DEBUG else None
        }
    )


@app.exception_handler(DataNotFoundError)
async def data_not_found_exception_handler(request: Request, exc: DataNotFoundError):
    return JSONResponse(
        status_code=404,
        content={
            "error": "data_not_found",
            "message": str(exc)
        }
    )


@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "error": "validation_error", 
            "message": str(exc)
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(
        "Unexpected error",
        error=str(exc),
        error_type=type(exc).__name__,
        url=str(request.url)
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "message": "An unexpected error occurred",
            "detail": str(exc) if settings.DEBUG else None
        }
    )


# ================================
# BASIC ENDPOINTS
# ================================

@app.get("/")
async def root():
    """API root endpoint with basic information"""
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "description": "Smart City Framework API for traffic management and urban planning",
        "docs_url": "/docs" if settings.DEBUG else None,
        "health_check": "/health",
        "api_v1": "/api/v1"
    }


@app.get("/health")
async def health_check():
    """Basic health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": settings.VERSION
    }


# ================================
# TRAFFIC ENDPOINTS
# ================================

@app.get("/api/v1/traffic/overview", tags=["Traffic Management"])
async def get_traffic_overview(current_user = Depends(get_current_user_optional)):
    """
    Get comprehensive real-time traffic overview for the main dashboard.
    
    Returns traffic health metrics, congestion distribution, and most congested roads.
    Updates every 30 seconds with intelligent caching.
    """
    try:
        overview = await traffic_service.get_real_time_traffic_overview()
        
        logger.info(
            "Traffic overview requested",
            user_id=getattr(current_user, 'id', 'anonymous'),
            total_roads=overview.get('total_monitored_roads', 0)
        )
        
        return overview
        
    except Exception as e:
        logger.error("Failed to get traffic overview", error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve traffic overview"
        )


@app.get("/api/v1/traffic/speeds", tags=["Traffic Management"])
async def get_traffic_speeds(
    skip: int = Query(0, ge=0, description="Number of records to skip for pagination"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of records to return"),
    road_name: Optional[str] = Query(None, description="Filter by road name (partial match)"),
    current_user = Depends(get_current_user_optional)
):
    """
    Get real-time traffic speeds with filtering and pagination.
    
    - **skip**: Pagination offset
    - **limit**: Maximum records per page  
    - **road_name**: Filter by road name (case-insensitive partial match)
    """
    try:
        # Validate pagination
        validate_pagination(skip, limit, max_limit=500)
        
        # Get traffic speeds from service
        all_speeds = await traffic_service.lta_service.get_all_traffic_speeds()
        
        # Apply road name filter
        if road_name:
            all_speeds = [
                speed for speed in all_speeds 
                if road_name.lower() in speed.road_name.lower()
            ]
        
        # Apply pagination
        paginated_speeds = all_speeds[skip:skip + limit]
        
        # Convert to dict for JSON response
        result = {
            "total_count": len(all_speeds),
            "returned_count": len(paginated_speeds),
            "skip": skip,
            "limit": limit,
            "data": [speed.dict() for speed in paginated_speeds]
        }
        
        logger.info(
            "Traffic speeds requested",
            user_id=getattr(current_user, 'id', 'anonymous'),
            total_results=len(all_speeds),
            returned_count=len(paginated_speeds)
        )
        
        return result
        
    except Exception as e:
        logger.error("Failed to get traffic speeds", error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve traffic speeds"
        )


@app.get("/api/v1/traffic/predictions", tags=["Traffic Management"])
async def get_traffic_predictions(
    road_name: Optional[str] = Query(None, description="Filter predictions for specific road"),
    horizon_minutes: int = Query(30, ge=15, le=120, description="Prediction time horizon in minutes"),
    current_user = Depends(get_current_user_optional)
):
    """
    Get AI-powered traffic predictions for the next 15-120 minutes.
    """
    try:
        predictions = await traffic_service.get_traffic_predictions(
            road_name=road_name,
            horizon_minutes=horizon_minutes
        )
        
        result = {
            "prediction_count": len(predictions),
            "horizon_minutes": horizon_minutes,
            "road_filter": road_name,
            "generated_at": datetime.utcnow().isoformat(),
            "predictions": [pred.dict() for pred in predictions]
        }
        
        logger.info(
            "Traffic predictions requested",
            user_id=getattr(current_user, 'id', 'anonymous'),
            prediction_count=len(predictions)
        )
        
        return result
        
    except Exception as e:
        logger.error("Failed to get traffic predictions", error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Failed to generate traffic predictions"
        )


@app.get("/api/v1/traffic/incidents", tags=["Traffic Management"])
async def get_traffic_incidents(
    active_only: bool = Query(True, description="Return only active incidents"),
    hours_back: int = Query(24, ge=1, le=168, description="Hours of incident history"),
    current_user = Depends(get_current_user_optional)
):
    """Get traffic incidents and alerts (demo data for now)"""
    try:
        # Demo incidents data
        current_time = datetime.utcnow()
        
        sample_incidents = [
            {
                "incident_id": "INC_001",
                "type": "Vehicle Breakdown",
                "severity": "medium",
                "road_name": "Orchard Road",
                "description": "Vehicle breakdown blocking left lane",
                "latitude": 1.3048,
                "longitude": 103.8318,
                "start_time": (current_time - timedelta(hours=2)).isoformat(),
                "is_active": True,
                "reported_by": "Traffic Camera System"
            },
            {
                "incident_id": "INC_002",
                "type": "Road Works", 
                "severity": "high",
                "road_name": "Marina Bay Area",
                "description": "Emergency road repairs causing lane closures",
                "latitude": 1.2966,
                "longitude": 103.8547,
                "start_time": (current_time - timedelta(hours=6)).isoformat(),
                "is_active": True,
                "reported_by": "Road Maintenance Team"
            }
        ]
        
        # Apply filters
        filtered_incidents = sample_incidents
        if active_only:
            filtered_incidents = [inc for inc in filtered_incidents if inc.get("is_active", True)]
        
        return {
            "incident_count": len(filtered_incidents),
            "active_only": active_only,
            "hours_back": hours_back,
            "incidents": filtered_incidents
        }
        
    except Exception as e:
        logger.error("Failed to get traffic incidents", error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve traffic incidents"
        )


# ================================
# PARKING ENDPOINTS
# ================================

@app.get("/api/v1/parking/overview", tags=["Parking Management"])
async def get_parking_overview(current_user = Depends(get_current_user_optional)):
    """Get comprehensive parking availability overview"""
    try:
        overview = await parking_service.get_parking_overview()
        
        logger.info(
            "Parking overview requested",
            user_id=getattr(current_user, 'id', 'anonymous')
        )
        
        return overview
        
    except Exception as e:
        logger.error("Failed to get parking overview", error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve parking overview"
        )


# ================================
# PLANNING ENDPOINTS  
# ================================

@app.get("/api/v1/planning/overview", tags=["Urban Planning"])
async def get_planning_overview(current_user = Depends(get_current_user_optional)):
    """Get urban planning data overview"""
    try:
        overview = await planning_service.get_planning_overview()
        
        logger.info(
            "Planning overview requested",
            user_id=getattr(current_user, 'id', 'anonymous')
        )
        
        return overview
        
    except Exception as e:
        logger.error("Failed to get planning overview", error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve planning overview"
        )


# ================================
# ANALYTICS ENDPOINTS
# ================================

@app.get("/api/v1/analytics/overview", tags=["Analytics & Predictions"])
async def get_analytics_overview(current_user = Depends(get_current_user_optional)):
    """Get analytics overview"""
    try:
        overview = await analytics_service.get_analytics_overview()
        
        logger.info(
            "Analytics overview requested",
            user_id=getattr(current_user, 'id', 'anonymous')
        )
        
        return overview
        
    except Exception as e:
        logger.error("Failed to get analytics overview", error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve analytics overview"
        )


# ================================
# UTILITY ENDPOINTS
# ================================

@app.get("/api/v1/routes/optimize", tags=["Traffic Management"])
async def optimize_route(
    start_lat: float = Query(..., ge=-90, le=90, description="Starting latitude"),
    start_lon: float = Query(..., ge=-180, le=180, description="Starting longitude"),
    end_lat: float = Query(..., ge=-90, le=90, description="Destination latitude"),
    end_lon: float = Query(..., ge=-180, le=180, description="Destination longitude"),
    vehicle_type: str = Query("car", regex="^(car|truck|motorcycle)$", description="Vehicle type"),
    current_user = Depends(get_current_user_optional)
):
    """Get optimized route recommendations based on real-time traffic"""
    try:
        validate_coordinates(start_lat, start_lon)
        validate_coordinates(end_lat, end_lon)
        
        # Demo route optimization
        routes = [
            {
                "route_id": "route_1",
                "name": "Fastest Route",
                "distance_km": 12.5,
                "estimated_duration_minutes": 18,
                "congestion_level": "low"
            },
            {
                "route_id": "route_2",
                "name": "Alternative Route", 
                "distance_km": 15.2,
                "estimated_duration_minutes": 22,
                "congestion_level": "medium"
            }
        ]
        
        return {
            "start_location": {"latitude": start_lat, "longitude": start_lon},
            "end_location": {"latitude": end_lat, "longitude": end_lon},
            "vehicle_type": vehicle_type,
            "generated_at": datetime.utcnow().isoformat(),
            "routes": routes
        }
        
    except Exception as e:
        logger.error("Failed to optimize route", error=str(e))
        raise HTTPException(
            status_code=500,
            detail="Failed to generate optimized routes"
        )


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
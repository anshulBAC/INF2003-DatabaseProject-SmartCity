from fastapi import FastAPI, HTTPException, Depends, Request, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any, ClassVar
from neo4j import AsyncGraphDatabase, AsyncDriver
from datetime import datetime, timedelta
import structlog
import time
import math
from contextlib import asynccontextmanager
from pydantic import BaseModel, Field


from app.config.settings import settings
from app.config.database import connect_to_mongo, close_mongo_connection, connect_to_redis, close_redis_connection
from app.services import traffic_service, parking_service, planning_service, analytics_service
from app.utils.helpers import (
    ExternalAPIError, DataNotFoundError, ValidationError, 
    get_current_user_optional, validate_coordinates, validate_pagination
)

logger = structlog.get_logger(__name__)
neo4j_driver: Optional[AsyncDriver] = None

def calculate_bearing(lat1, lon1, lat2, lon2):
    """Calculate bearing between two points in degrees (0-360)"""
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    dlon = lon2 - lon1
    x = math.sin(dlon) * math.cos(lat2)
    y = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
    
    bearing = math.atan2(x, y)
    bearing = math.degrees(bearing)
    bearing = (bearing + 360) % 360
    
    return bearing

def get_turn_instruction(bearing1, bearing2):
    """Determine turn instruction based on angle between two bearings"""
    angle = (bearing2 - bearing1 + 360) % 360
    
    if angle < 10 or angle > 350:
        return "Continue"
    elif 10 <= angle < 45:
        return "Bear right"
    elif 45 <= angle < 135:
        return "Turn right"
    elif 135 <= angle < 170:
        return "Sharp right"
    elif 170 <= angle <= 190:
        return "Make a U-turn"
    elif 190 < angle < 225:
        return "Sharp left"
    elif 225 <= angle < 315:
        return "Turn left"
    elif 315 <= angle < 350:
        return "Bear left"
    else:
        return "Continue"

class OptimizedRoute(BaseModel):
    """Defines a single optimized route result."""
    route_id: str
    name: str
    distance_km: float
    estimated_duration_minutes: float
    congestion_level: str
    path_coordinates: List[List[float]] = Field(default_factory=list)
    segment_details: List[Dict[str, Any]] = Field(default_factory=list)
    directions: List[str] = Field(default_factory=list)

class OptimizedRouteResponse(BaseModel):
    """Defines the overall response structure for route optimization."""
    start_location: dict 
    end_location: dict 
    vehicle_type: str
    generated_at: str
    routes: List[OptimizedRoute]

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    # Startup
    logger.info("Starting Smart City Framework API", version=settings.VERSION)
    
    try:
        # Initialize database connections
        await connect_to_mongo()
        await connect_to_redis()

        global neo4j_driver
        uri = settings.NEO4J_URI  
        user = settings.NEO4J_USER
        password = settings.NEO4J_PASSWORD
        
        neo4j_driver = AsyncGraphDatabase.driver(uri, auth=(user, password))
        await neo4j_driver.verify_connectivity()
        logger.info("Connected to Neo4j Graph Database")    

        logger.info("Application startup completed successfully")
        
        yield
        
    except Exception as e:
        logger.error("Failed to start application", error=str(e))
        raise
    
    finally:
        # Shutdown
        logger.info("Shutting down Smart City Framework API")
        if neo4j_driver:
            await neo4j_driver.close()
            logger.info("Disconnected from Neo4j")
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
# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000", 
        "http://localhost:8080",
        "http://localhost:5500",
        "http://127.0.0.1:5500",  
        "http://127.0.0.1:5000",     
    ],
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

@app.get("/api/routing/optimize", response_model=OptimizedRouteResponse, summary="Optimized Route Recommendations")
async def get_optimized_route_recommendations(
    start_lat: float = Query(..., description="Start latitude"),
    start_lon: float = Query(..., description="Start longitude"),
    end_lat: float = Query(..., description="End latitude"),
    end_lon: float = Query(..., description="End longitude"),
    vehicle_type: str = Query("car", description="Vehicle type (car, bus/train)"),
):
    """Get optimized route recommendations based on real-time traffic using Neo4j"""
    try:
        validate_coordinates(start_lat, start_lon)
        validate_coordinates(end_lat, end_lon)
        
        if not neo4j_driver:
            raise HTTPException(status_code=503, detail="Routing Service unavailable - Graph DB not connected")
        
        async with neo4j_driver.session() as session:
            query = """
            // Find nearest start point
            MATCH (start:Point)
            WITH start, point.distance(
                point({latitude: start.lat, longitude: start.lon}),
                point({latitude: $start_lat, longitude: $start_lon})
            ) AS start_distance
            ORDER BY start_distance ASC
            LIMIT 1
            
            // Find nearest end point
            MATCH (end:Point)
            WITH start, end, point.distance(
                point({latitude: end.lat, longitude: end.lon}),
                point({latitude: $end_lat, longitude: $end_lon})
            ) AS end_distance
            ORDER BY end_distance ASC
            LIMIT 1
            
            WHERE start <> end
            
            // Use native Cypher shortest path
            MATCH path = shortestPath((start)-[:ROAD_SEGMENT*]-(end))
            WITH path, relationships(path) AS rels, nodes(path) AS nodes
            
            RETURN 
                reduce(duration = 0, r IN rels | duration + coalesce(r.duration_sec, 0)) AS total_duration,
                reduce(distance = 0, r IN rels | distance + coalesce(r.distance_km, 0)) AS total_distance,
                [n IN nodes | [n.lat, n.lon]] AS path_coordinates,
                [r IN rels | {
                    road_name: r.road_name, 
                    speed: r.current_speed_kph,
                    distance: r.distance_km
                }] AS segment_details
            """
            
            result = await session.run(query, start_lat=start_lat, start_lon=start_lon, 
                                      end_lat=end_lat, end_lon=end_lon)
            records = await result.data()
            logger.info(f'Found {len(records)} routes')
        
        routes = []
        if records and len(records) > 0:
            record = records[0]
            total_duration = record["total_duration"]
            total_distance = record["total_distance"]
            path_coords = record["path_coordinates"]
            segments = record.get("segment_details", [])
            
            # Calculate congestion level and build directions
            segment_details = []
            directions = []
            
            if segments:
                # Calculate average speed
                avg_speed = sum(s['speed'] for s in segments) / len(segments)
                if avg_speed < 20:
                    congestion = "Heavy"
                elif avg_speed < 40:
                    congestion = "Moderate"
                else:
                    congestion = "Light"
                
                # Build segment details and directions
                current_accumulated_distance = 0
                last_road_name = None

                for i, seg in enumerate(segments):
                    segment_details.append({
                        'road_name': seg['road_name'],
                        'speed': seg['speed'],
                        'distance': seg['distance']
                    })
                    
                    current_road = seg['road_name']
                    
                    # First segment
                    if i == 0:
                        last_road_name = current_road
                        current_accumulated_distance = seg['distance']
                    
                    # Road name changed - add instruction for previous road
                    elif current_road != last_road_name:
                        # Calculate bearing for turn instruction
                        if i < len(path_coords) - 1 and i > 0:
                            prev_lat1, prev_lon1 = path_coords[i-1]
                            prev_lat2, prev_lon2 = path_coords[i]
                            curr_lat1, curr_lon1 = path_coords[i]
                            curr_lat2, curr_lon2 = path_coords[i+1]
                            
                            prev_bearing = calculate_bearing(prev_lat1, prev_lon1, prev_lat2, prev_lon2)
                            curr_bearing = calculate_bearing(curr_lat1, curr_lon1, curr_lat2, curr_lon2)
                            turn_instruction = get_turn_instruction(prev_bearing, curr_bearing)
                        else:
                            turn_instruction = "Continue"
                        
                        # Format accumulated distance
                        distance_m = int(current_accumulated_distance * 1000)
                        if distance_m < 1000:
                            distance_str = f"{distance_m}m"
                        else:
                            distance_km = round(current_accumulated_distance, 1)
                            distance_str = f"{distance_km}km"
                        
                        # Add direction for the accumulated road we just left
                        directions.append(f"{turn_instruction} onto {current_road} ({distance_str})")
                        
                        # Reset for new road
                        last_road_name = current_road
                        current_accumulated_distance = seg['distance']
                    else:
                        # Same road - accumulate distance
                        current_accumulated_distance += seg['distance']

                # Add final road segment (the last accumulated distance)
                if last_road_name and current_accumulated_distance > 0:
                    distance_m = int(current_accumulated_distance * 1000)
                    if distance_m < 1000:
                        distance_str = f"{distance_m}m"
                    else:
                        distance_km = round(current_accumulated_distance, 1)
                        distance_str = f"{distance_km}km"
                    
                    # This is the LAST segment, so we don't have a "turn" - just continuing to destination
                    directions.append(f"Continue to destination on {last_road_name} ({distance_str})")

                # Add arrival message
                directions.append("You have arrived at your destination")

            else:
                congestion = "Unknown"

            routes.append({
                "route_id": "graph_route_1",
                "name": "Fastest Route",
                "distance_km": round(total_distance, 2), 
                "estimated_duration_minutes": round(total_duration / 60, 1),
                "congestion_level": congestion,
                "path_coordinates": path_coords,
                "segment_details": segment_details,
                "directions": directions
            })
        else:
            raise DataNotFoundError("No viable route found between the points.")
        
        return {
            "start_location": {"latitude": start_lat, "longitude": start_lon},
            "end_location": {"latitude": end_lat, "longitude": end_lon},
            "vehicle_type": vehicle_type,
            "generated_at": datetime.utcnow().isoformat(),
            "routes": routes
        }
    
    except DataNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("Failed to optimize route", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to generate optimized routes: {e.__class__.__name__}")

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
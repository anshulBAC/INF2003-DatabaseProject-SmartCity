"""
Smart City Framework - FastAPI Backend
RESTful API for Singapore Transportation Infrastructure Data
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import mysql.connector
from mysql.connector import Error
import os
import requests

# Database Configuration
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': 'zixin',  
    'database': 'smart_city'
}

# LTA API Configuration for live data
LTA_API_KEY = "UBeaFtamQiicQpl/8AAZfA=="
# Initialize FastAPI app
app = FastAPI(
    title="Smart City API",
    description="RESTful API for Singapore Transportation Infrastructure",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models for API responses
class BusStop(BaseModel):
    BusStopCode: str
    RoadName: str
    Description: str
    Latitude: float
    Longitude: float

class BusRoute(BaseModel):
    ServiceNo: str
    Operator: str
    Direction: int
    StopSequence: int
    BusStopCode: str
    Distance: float
    WD_FirstBus: str
    WD_LastBus: str
    SAT_FirstBus: str
    SAT_LastBus: str
    SUN_FirstBus: str
    SUN_LastBus: str

class Carpark(BaseModel):
    CarParkID: str
    Area: str
    Development: str
    Location: str
    AvailableLots: int
    LotType: str
    Agency: str

class TrainStation(BaseModel):
    StationCode: str
    StationName: str
    Line: str
    Latitude: float
    Longitude: float

class TaxiStop(BaseModel):
    TaxiCode: str
    Latitude: float
    Longitude: float

class TrafficCamera(BaseModel):
    CameraID: str
    Latitude: float
    Longitude: float
    ImageLink: str

# Database connection helper
def get_db_connection():
    """Get database connection"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Smart City Framework API",
        "version": "1.0.0",
        "endpoints": {
            "bus_stops": "/api/bus-stops",
            "bus_routes": "/api/bus-routes",
            "carparks": "/api/carparks",
            "train_stations": "/api/train-stations",
            "taxi_stops": "/api/taxi-stops",
            "traffic_cameras": "/api/traffic-cameras",
            "stats": "/api/stats"
        }
    }

# Bus Stops Endpoints
@app.get("/api/bus-stops", response_model=List[BusStop])
async def get_bus_stops(
    limit: int = Query(100, ge=1, le=10000),
    offset: int = Query(0, ge=0),
    road_name: Optional[str] = None
):
    """Get all bus stops with optional filtering"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        if road_name:
            query = """
                SELECT BusStopCode, RoadName, Description, Latitude, Longitude 
                FROM bus_stops 
                WHERE RoadName LIKE %s
                LIMIT %s OFFSET %s
            """
            cursor.execute(query, (f"%{road_name}%", limit, offset))
        else:
            query = """
                SELECT BusStopCode, RoadName, Description, Latitude, Longitude 
                FROM bus_stops 
                LIMIT %s OFFSET %s
            """
            cursor.execute(query, (limit, offset))
        
        results = cursor.fetchall()
        return results
    finally:
        cursor.close()
        conn.close()

@app.get("/api/bus-stops/{bus_stop_code}", response_model=BusStop)
async def get_bus_stop(bus_stop_code: str):
    """Get a specific bus stop by code"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        query = """
            SELECT BusStopCode, RoadName, Description, Latitude, Longitude 
            FROM bus_stops 
            WHERE BusStopCode = %s
        """
        cursor.execute(query, (bus_stop_code,))
        result = cursor.fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Bus stop not found")
        
        return result
    finally:
        cursor.close()
        conn.close()

# Bus Routes Endpoints
@app.get("/api/bus-routes", response_model=List[BusRoute])
async def get_bus_routes(
    service_no: Optional[str] = None,
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """Get bus routes with optional filtering by service number"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        if service_no:
            query = """
                SELECT * FROM bus_routes 
                WHERE ServiceNo = %s
                ORDER BY Direction, StopSequence
                LIMIT %s OFFSET %s
            """
            cursor.execute(query, (service_no, limit, offset))
        else:
            query = """
                SELECT * FROM bus_routes 
                ORDER BY ServiceNo, Direction, StopSequence
                LIMIT %s OFFSET %s
            """
            cursor.execute(query, (limit, offset))
        
        results = cursor.fetchall()
        return results
    finally:
        cursor.close()
        conn.close()

@app.get("/api/bus-services")
async def get_bus_services():
    """Get unique bus service numbers"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        query = """
            SELECT DISTINCT ServiceNo, Operator 
            FROM bus_routes 
            ORDER BY ServiceNo
        """
        cursor.execute(query)
        results = cursor.fetchall()
        return results
    finally:
        cursor.close()
        conn.close()

# Carparks Endpoints
@app.get("/api/carparks", response_model=List[Carpark])
async def get_carparks(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    area: Optional[str] = None
):
    """Get all carparks with optional filtering"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        if area:
            query = """
                SELECT * FROM carparks 
                WHERE Area LIKE %s
                LIMIT %s OFFSET %s
            """
            cursor.execute(query, (f"%{area}%", limit, offset))
        else:
            query = """
                SELECT * FROM carparks 
                LIMIT %s OFFSET %s
            """
            cursor.execute(query, (limit, offset))
        
        results = cursor.fetchall()
        return results
    finally:
        cursor.close()
        conn.close()

@app.get("/api/carparks/{carpark_id}", response_model=Carpark)
async def get_carpark(carpark_id: str):
    """Get a specific carpark by ID"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        query = "SELECT * FROM carparks WHERE CarParkID = %s"
        cursor.execute(query, (carpark_id,))
        result = cursor.fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Carpark not found")
        
        return result
    finally:
        cursor.close()
        conn.close()

# Train Stations Endpoints
@app.get("/api/train-stations")
async def get_train_stations(
    line_code: Optional[str] = None,
    limit: int = Query(200, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """Get all train stations with optional filtering by line"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        if line_code:
            query = """
                SELECT StationCode, StationName, Line, Latitude, Longitude 
                FROM train_stations 
                WHERE Line = %s
                LIMIT %s OFFSET %s
            """
            cursor.execute(query, (line_code, limit, offset))
        else:
            query = """
                SELECT StationCode, StationName, Line, Latitude, Longitude 
                FROM train_stations 
                LIMIT %s OFFSET %s
            """
            cursor.execute(query, (limit, offset))
        
        results = cursor.fetchall()
        return results
    finally:
        cursor.close()
        conn.close()

# Taxi Stops Endpoints
@app.get("/api/taxi-stops", response_model=List[TaxiStop])
async def get_taxi_stops(
    limit: int = Query(500, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """Get all taxi stops"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        query = """
            SELECT TaxiCode, Latitude, Longitude 
            FROM taxi_stops 
            LIMIT %s OFFSET %s
        """
        cursor.execute(query, (limit, offset))
        results = cursor.fetchall()
        return results
    finally:
        cursor.close()
        conn.close()

# Traffic Cameras Endpoints
@app.get("/api/traffic-cameras", response_model=List[TrafficCamera])
async def get_traffic_cameras(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """Get all traffic cameras"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        query = """
            SELECT CameraID, Latitude, Longitude, ImageLink 
            FROM traffic_cameras 
            LIMIT %s OFFSET %s
        """
        cursor.execute(query, (limit, offset))
        results = cursor.fetchall()
        return results
    finally:
        cursor.close()
        conn.close()

@app.get("/api/traffic-cameras/live")
async def get_live_traffic_cameras(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """Get live traffic camera data with fresh image links from LTA API"""
    if not LTA_API_KEY:
        raise HTTPException(status_code=500, detail="LTA API key not configured")
    
    headers = {
        'AccountKey': LTA_API_KEY,
        'accept': 'application/json'
    }
    
    try:
        response = requests.get(
            "https://datamall2.mytransport.sg/ltaodataservice/Traffic-Imagesv2",
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            cameras = data.get('value', [])
            
            # Apply limit and offset
            start = offset
            end = offset + limit
            return cameras[start:end]
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"LTA API error: {response.status_code}"
            )
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch live data: {str(e)}")

@app.get("/api/traffic-cameras/{camera_id}", response_model=TrafficCamera)
async def get_traffic_camera(camera_id: str):
    """Get a specific traffic camera by ID"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        query = """
            SELECT CameraID, Latitude, Longitude, ImageLink 
            FROM traffic_cameras 
            WHERE CameraID = %s
        """
        cursor.execute(query, (camera_id,))
        result = cursor.fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Traffic camera not found")
        
        return result
    finally:
        cursor.close()
        conn.close()

@app.get("/api/traffic-cameras/{camera_id}/live")
async def get_live_traffic_camera(camera_id: str):
    """Get a specific traffic camera with live image link from LTA API"""
    if not LTA_API_KEY:
        raise HTTPException(status_code=500, detail="LTA API key not configured")
    
    headers = {
        'AccountKey': LTA_API_KEY,
        'accept': 'application/json'
    }
    
    try:
        response = requests.get(
            "https://datamall2.mytransport.sg/ltaodataservice/Traffic-Imagesv2",
            headers=headers,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            cameras = data.get('value', [])
            
            # Find the specific camera
            camera = next((c for c in cameras if c['CameraID'] == camera_id), None)
            
            if camera:
                return camera
            else:
                raise HTTPException(status_code=404, detail="Camera not found")
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"LTA API error: {response.status_code}"
            )
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch live data: {str(e)}")

# Statistics Endpoint
@app.get("/api/stats")
async def get_statistics():
    """Get database statistics"""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    try:
        stats = {}
        
        # Count records in each table
        tables = ['bus_stops', 'bus_routes', 'carparks', 'train_stations', 'taxi_stops', 'traffic_cameras']
        
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
            result = cursor.fetchone()
            stats[table] = result['count']
        
        return {
            "total_bus_stops": stats['bus_stops'],
            "total_bus_routes": stats['bus_routes'],
            "total_carparks": stats['carparks'],
            "total_train_stations": stats['train_stations'],
            "total_taxi_stops": stats['taxi_stops'],
            "total_traffic_cameras": stats['traffic_cameras'],
            "last_updated": datetime.now().isoformat()
        }
    finally:
        cursor.close()
        conn.close()

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        conn = get_db_connection()
        conn.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unavailable: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
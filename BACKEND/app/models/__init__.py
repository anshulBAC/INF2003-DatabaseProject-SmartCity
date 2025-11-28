"""Smart City Framework Data Models

This package contains all database models:
- sql_models.py: MariaDB/MySQL models for structured historical data
- nosql_models.py: MongoDB models for real-time flexible data
"""

# Import commonly used models for easy access
from .sql_models import (
    PlanningArea,
    RoadNetwork, 
    TrafficLight,
    BusStop,
    BusRoute,
    RoadWork,
    VehicleStatistics,
    TrafficAccident
)

from .nosql_models import (
    RealTimeTrafficSpeed,
    CarParkAvailability,
    TrafficIncident,
    WeatherData,
    IoTSensorReading,
    CitizenReport,
    PredictiveAnalytics,
    SystemMetrics,
    TrafficSpeedBand,
    ParkingStatus,
    IncidentSeverity,
    WeatherCondition
)

__all__ = [
    # SQL Models
    "PlanningArea",
    "RoadNetwork", 
    "TrafficLight",
    "BusStop",
    "BusRoute", 
    "RoadWork",
    "VehicleStatistics",
    "TrafficAccident",
    
    # NoSQL Models
    "RealTimeTrafficSpeed",
    "CarParkAvailability",
    "TrafficIncident",
    "WeatherData",
    "IoTSensorReading",
    "CitizenReport",
    "PredictiveAnalytics",
    "SystemMetrics",
    
    # Enums
    "TrafficSpeedBand",
    "ParkingStatus", 
    "IncidentSeverity",
    "WeatherCondition"
]
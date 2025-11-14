from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class TrafficSpeedBand(str, Enum):
    """Traffic speed band categories from LTA"""
    GREEN = "green"      # > 40 km/h
    YELLOW = "yellow"    # 20-40 km/h  
    RED = "red"         # < 20 km/h


class ParkingStatus(str, Enum):
    """Carpark availability status"""
    AVAILABLE = "available"
    FULL = "full"
    CLOSED = "closed"
    UNKNOWN = "unknown"


class IncidentSeverity(str, Enum):
    """Traffic incident severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class WeatherCondition(str, Enum):
    """Weather condition types"""
    CLEAR = "clear"
    CLOUDY = "cloudy"
    RAINY = "rainy"
    THUNDERSTORM = "thunderstorm"
    HAZY = "hazy"


class RealTimeTrafficSpeed(BaseModel):
    """Real-time traffic speed data from LTA Traffic Speed Bands API"""
    link_id: str = Field(..., description="Unique road link identifier")
    road_name: str = Field(..., description="Name of the road segment")
    start_lat: float = Field(..., ge=-90, le=90)
    start_lon: float = Field(..., ge=-180, le=180)
    end_lat: float = Field(..., ge=-90, le=90)
    end_lon: float = Field(..., ge=-180, le=180)
    current_speed: Optional[float] = Field(None, ge=0, description="Current average speed km/h")
    free_flow_speed: float = Field(..., ge=0, description="Free flow speed km/h")
    speed_band: TrafficSpeedBand = Field(..., description="Traffic congestion level")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    data_source: str = Field(default="LTA_API", description="Source of the data")
    
    class Config:
        collection_name = "traffic_speeds"
        indexes = [
            [("link_id", 1), ("timestamp", -1)],
            [("speed_band", 1), ("timestamp", -1)],
            [("road_name", 1)],
        ]


class CarParkAvailability(BaseModel):
    """Real-time carpark availability from LTA"""
    carpark_id: str = Field(..., description="Unique carpark identifier")
    carpark_name: str = Field(..., description="Carpark name")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    total_lots: int = Field(..., ge=0)
    available_lots: int = Field(..., ge=0)
    lot_type: str = Field(..., description="C (Car), H (Heavy Vehicle), Y (Motorcycle)")
    status: ParkingStatus = Field(...)
    pricing_scheme: Optional[str] = Field(None)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    data_source: str = Field(default="LTA_API")
    
    @validator('available_lots')
    def validate_available_lots(cls, v, values):
        if 'total_lots' in values and v > values['total_lots']:
            raise ValueError('Available lots cannot exceed total lots')
        return v
    
    class Config:
        collection_name = "carpark_availability"
        indexes = [
            [("carpark_id", 1), ("timestamp", -1)],
            [("status", 1), ("lot_type", 1)],
            [("latitude", 1), ("longitude", 1)],
        ]


class TrafficIncident(BaseModel):
    """Real-time traffic incidents and alerts"""
    incident_id: str = Field(..., description="Unique incident identifier")
    incident_type: str = Field(..., description="Type of incident")
    severity: IncidentSeverity = Field(...)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    road_name: str = Field(..., description="Affected road")
    direction: Optional[str] = Field(None, description="Traffic direction affected")
    description: str = Field(..., description="Detailed incident description")
    start_time: datetime = Field(...)
    estimated_end_time: Optional[datetime] = Field(None)
    lanes_affected: Optional[int] = Field(None, ge=0)
    is_active: bool = Field(default=True)
    reported_by: str = Field(default="SYSTEM", description="Source of report")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        collection_name = "traffic_incidents"
        indexes = [
            [("is_active", 1), ("severity", 1)],
            [("road_name", 1), ("start_time", -1)],
            [("latitude", 1), ("longitude", 1)],
        ]


class WeatherData(BaseModel):
    """Real-time weather conditions affecting traffic"""
    station_id: str = Field(..., description="Weather station identifier")
    station_name: str = Field(..., description="Weather station name")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    temperature: Optional[float] = Field(None, description="Temperature in Celsius")
    humidity: Optional[float] = Field(None, ge=0, le=100, description="Humidity percentage")
    rainfall: Optional[float] = Field(None, ge=0, description="Rainfall in mm")
    wind_speed: Optional[float] = Field(None, ge=0, description="Wind speed in km/h")
    wind_direction: Optional[str] = Field(None, description="Wind direction")
    visibility: Optional[float] = Field(None, ge=0, description="Visibility in km")
    condition: WeatherCondition = Field(...)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    data_source: str = Field(default="NEA_API")
    
    class Config:
        collection_name = "weather_data"
        indexes = [
            [("station_id", 1), ("timestamp", -1)],
            [("condition", 1), ("timestamp", -1)],
        ]


class IoTSensorReading(BaseModel):
    """Simulated IoT sensor data for enhanced analytics"""
    sensor_id: str = Field(..., description="Unique sensor identifier")
    sensor_type: str = Field(..., description="Type of sensor")
    location_name: str = Field(..., description="Sensor location description")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    readings: Dict[str, Any] = Field(..., description="Sensor-specific readings")
    quality_score: float = Field(default=1.0, ge=0, le=1, description="Data quality score")
    battery_level: Optional[float] = Field(None, ge=0, le=100)
    is_online: bool = Field(default=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        collection_name = "iot_sensors"
        indexes = [
            [("sensor_id", 1), ("timestamp", -1)],
            [("sensor_type", 1), ("is_online", 1)],
            [("latitude", 1), ("longitude", 1)],
        ]


class CitizenReport(BaseModel):
    """Citizen-generated traffic and infrastructure reports"""
    report_id: str = Field(..., description="Unique report identifier")
    report_type: str = Field(..., description="Type of report")
    category: str = Field(..., description="Report category")
    title: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10, max_length=1000)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    location_description: str = Field(..., description="Human-readable location")
    priority: str = Field(default="medium", regex="^(low|medium|high|urgent)$")
    status: str = Field(default="pending", regex="^(pending|investigating|resolved|closed)$")
    photo_urls: Optional[List[str]] = Field(default=[], description="Attached photo URLs")
    reporter_contact: Optional[str] = Field(None, description="Contact info (anonymized)")
    assigned_to: Optional[str] = Field(None, description="Assigned department/officer")
    resolution_notes: Optional[str] = Field(None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    resolved_at: Optional[datetime] = Field(None)
    
    class Config:
        collection_name = "citizen_reports"
        indexes = [
            [("status", 1), ("priority", 1)],
            [("report_type", 1), ("created_at", -1)],
            [("latitude", 1), ("longitude", 1)],
        ]


class PredictiveAnalytics(BaseModel):
    """AI-generated predictions and analytics"""
    prediction_id: str = Field(..., description="Unique prediction identifier")
    prediction_type: str = Field(..., description="Type of prediction")
    target_location: str = Field(..., description="Location being predicted")
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    prediction_time_horizon: int = Field(..., ge=1, description="Minutes into future")
    confidence_score: float = Field(..., ge=0, le=1, description="Prediction confidence")
    predicted_values: Dict[str, Any] = Field(..., description="Predicted metrics")
    historical_accuracy: Optional[float] = Field(None, ge=0, le=1)
    model_version: str = Field(..., description="ML model version used")
    input_features: Dict[str, Any] = Field(..., description="Features used for prediction")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    valid_until: datetime = Field(..., description="When prediction expires")
    
    class Config:
        collection_name = "predictive_analytics"
        indexes = [
            [("prediction_type", 1), ("created_at", -1)],
            [("target_location", 1), ("valid_until", -1)],
            [("confidence_score", -1)],
        ]


class SystemMetrics(BaseModel):
    """System performance and health metrics"""
    metric_id: str = Field(..., description="Unique metric identifier")
    service_name: str = Field(..., description="Service being monitored")
    metric_type: str = Field(..., description="Type of metric")
    value: float = Field(..., description="Metric value")
    unit: str = Field(..., description="Unit of measurement")
    threshold_warning: Optional[float] = Field(None)
    threshold_critical: Optional[float] = Field(None)
    status: str = Field(default="normal", regex="^(normal|warning|critical)$")
    tags: Dict[str, str] = Field(default={}, description="Additional metadata")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        collection_name = "system_metrics"
        indexes = [
            [("service_name", 1), ("metric_type", 1), ("timestamp", -1)],
            [("status", 1), ("timestamp", -1)],
        ]


# Aggregation schemas for complex queries
class TrafficSpeedSummary(BaseModel):
    """Aggregated traffic speed statistics"""
    road_name: str
    time_period: str  # "hourly", "daily", "weekly"
    period_start: datetime
    period_end: datetime
    avg_speed: float
    min_speed: float
    max_speed: float
    congestion_duration_minutes: int
    speed_band_distribution: Dict[TrafficSpeedBand, float]
    sample_count: int


class ParkingUtilization(BaseModel):
    """Parking utilization analytics"""
    carpark_id: str
    carpark_name: str
    time_period: str
    period_start: datetime
    period_end: datetime
    avg_utilization: float  # percentage
    peak_utilization: float
    off_peak_utilization: float
    turnover_rate: Optional[float]  # cars per hour
    revenue_estimate: Optional[float]


class IncidentAnalytics(BaseModel):
    """Traffic incident analytics and patterns"""
    location: str
    time_period: str
    incident_count: int
    avg_duration_minutes: float
    severity_distribution: Dict[IncidentSeverity, int]
    common_causes: List[str]
    peak_hours: List[int]  # Hours of day with most incidents
    weather_correlation: Dict[WeatherCondition, int]
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Boolean, Text, 
    ForeignKey, Index, CheckConstraint, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.config.database import Base


class PlanningArea(Base):
    """Singapore planning areas for demographic and urban planning data"""
    __tablename__ = "planning_areas"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    region = Column(String(50), nullable=False, index=True)
    area_km2 = Column(Float, nullable=False)
    population = Column(Integer, nullable=True)
    density_per_km2 = Column(Float, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    road_networks = relationship("RoadNetwork", back_populates="planning_area")
    traffic_lights = relationship("TrafficLight", back_populates="planning_area")
    
    __table_args__ = (
        CheckConstraint('area_km2 > 0', name='check_positive_area'),
        CheckConstraint('population >= 0', name='check_positive_population'),
    )


class RoadNetwork(Base):
    """Road network topology and infrastructure"""
    __tablename__ = "road_networks"
    
    id = Column(Integer, primary_key=True, index=True)
    road_name = Column(String(200), nullable=False, index=True)
    road_type = Column(String(50), nullable=False)  # Highway, Arterial, Local
    start_latitude = Column(Float, nullable=False)
    start_longitude = Column(Float, nullable=False)
    end_latitude = Column(Float, nullable=False)
    end_longitude = Column(Float, nullable=False)
    length_km = Column(Float, nullable=False)
    lanes = Column(Integer, nullable=False)
    speed_limit = Column(Integer, nullable=False)
    planning_area_id = Column(Integer, ForeignKey("planning_areas.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    planning_area = relationship("PlanningArea", back_populates="road_networks")
    traffic_lights = relationship("TrafficLight", back_populates="road")
    road_works = relationship("RoadWork", back_populates="road")
    
    __table_args__ = (
        CheckConstraint('length_km > 0', name='check_positive_length'),
        CheckConstraint('lanes > 0', name='check_positive_lanes'),
        CheckConstraint('speed_limit > 0', name='check_positive_speed_limit'),
        Index('idx_road_coordinates', 'start_latitude', 'start_longitude'),
        Index('idx_road_type_active', 'road_type', 'is_active'),
    )


class TrafficLight(Base):
    """Traffic light locations and configurations"""
    __tablename__ = "traffic_lights"
    
    id = Column(Integer, primary_key=True, index=True)
    junction_name = Column(String(200), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    road_id = Column(Integer, ForeignKey("road_networks.id"))
    planning_area_id = Column(Integer, ForeignKey("planning_areas.id"))
    signal_type = Column(String(50), nullable=False)  # Standard, Pedestrian, Smart
    cycle_time_seconds = Column(Integer, nullable=True)
    is_smart_enabled = Column(Boolean, default=False)
    installation_date = Column(DateTime, nullable=True)
    last_maintenance = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    road = relationship("RoadNetwork", back_populates="traffic_lights")
    planning_area = relationship("PlanningArea", back_populates="traffic_lights")
    
    __table_args__ = (
        CheckConstraint('cycle_time_seconds > 0', name='check_positive_cycle_time'),
        Index('idx_traffic_light_location', 'latitude', 'longitude'),
        Index('idx_traffic_light_smart', 'is_smart_enabled', 'is_active'),
    )


class BusStop(Base):
    """Bus stop locations and routes"""
    __tablename__ = "bus_stops"
    
    id = Column(Integer, primary_key=True, index=True)
    bus_stop_code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(200), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    road_name = Column(String(200), nullable=True)
    has_shelter = Column(Boolean, default=False)
    is_accessible = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    bus_routes = relationship("BusRoute", back_populates="bus_stop")
    
    __table_args__ = (
        Index('idx_bus_stop_location', 'latitude', 'longitude'),
    )


class BusRoute(Base):
    """Bus routes and service information"""
    __tablename__ = "bus_routes"
    
    id = Column(Integer, primary_key=True, index=True)
    service_no = Column(String(10), nullable=False, index=True)
    bus_stop_id = Column(Integer, ForeignKey("bus_stops.id"))
    sequence = Column(Integer, nullable=False)
    direction = Column(String(10), nullable=False)  # Forward, Backward
    distance_km = Column(Float, nullable=True)
    first_bus = Column(String(10), nullable=True)
    last_bus = Column(String(10), nullable=True)
    frequency_peak = Column(Integer, nullable=True)  # minutes
    frequency_offpeak = Column(Integer, nullable=True)  # minutes
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    bus_stop = relationship("BusStop", back_populates="bus_routes")
    
    __table_args__ = (
        UniqueConstraint('service_no', 'bus_stop_id', 'direction', 'sequence', 
                        name='uq_bus_route_sequence'),
        CheckConstraint('sequence > 0', name='check_positive_sequence'),
        Index('idx_bus_route_service', 'service_no', 'is_active'),
    )


class RoadWork(Base):
    """Planned and ongoing road works"""
    __tablename__ = "road_works"
    
    id = Column(Integer, primary_key=True, index=True)
    road_id = Column(Integer, ForeignKey("road_networks.id"))
    work_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)
    impact_level = Column(String(20), nullable=False)  # Low, Medium, High
    lanes_affected = Column(Integer, nullable=True)
    contractor = Column(String(200), nullable=True)
    status = Column(String(20), nullable=False, default='Planned')  # Planned, Active, Completed
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    road = relationship("RoadNetwork", back_populates="road_works")
    
    __table_args__ = (
        CheckConstraint('lanes_affected >= 0', name='check_non_negative_lanes'),
        Index('idx_roadwork_dates', 'start_date', 'end_date'),
        Index('idx_roadwork_status', 'status', 'impact_level'),
    )


class VehicleStatistics(Base):
    """Historical vehicle population and registration data"""
    __tablename__ = "vehicle_statistics"
    
    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    vehicle_type = Column(String(50), nullable=False)  # Car, Motorcycle, Truck, Bus
    fuel_type = Column(String(30), nullable=True)  # Petrol, Diesel, Electric, Hybrid
    total_count = Column(Integer, nullable=False)
    new_registrations = Column(Integer, nullable=True)
    deregistrations = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    
    __table_args__ = (
        UniqueConstraint('year', 'month', 'vehicle_type', 'fuel_type', 
                        name='uq_vehicle_stats_period'),
        CheckConstraint('month >= 1 AND month <= 12', name='check_valid_month'),
        CheckConstraint('year >= 2000', name='check_valid_year'),
        CheckConstraint('total_count >= 0', name='check_non_negative_count'),
        Index('idx_vehicle_stats_period', 'year', 'month'),
    )


class TrafficAccident(Base):
    """Historical traffic accident records"""
    __tablename__ = "traffic_accidents"
    
    id = Column(Integer, primary_key=True, index=True)
    accident_date = Column(DateTime, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    road_name = Column(String(200), nullable=True)
    weather_condition = Column(String(50), nullable=True)
    light_condition = Column(String(50), nullable=True)
    accident_type = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False)  # Fatal, Serious, Minor
    vehicles_involved = Column(Integer, nullable=False)
    casualties = Column(Integer, nullable=False)
    fatalities = Column(Integer, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    __table_args__ = (
        CheckConstraint('vehicles_involved > 0', name='check_positive_vehicles'),
        CheckConstraint('casualties >= 0', name='check_non_negative_casualties'),
        CheckConstraint('fatalities >= 0', name='check_non_negative_fatalities'),
        Index('idx_accident_date_severity', 'accident_date', 'severity'),
        Index('idx_accident_location', 'latitude', 'longitude'),
    )
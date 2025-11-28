"""
Consolidated Smart City Framework Business Logic

This file contains all business logic services:
- LTAAPIService: Singapore LTA API integration
- TrafficService: Traffic analysis and predictions
- ParkingService: Parking management
- PlanningService: Urban planning analytics
- AnalyticsService: Advanced analytics and reporting
"""

import asyncio
import httpx
import structlog
from typing import List, Dict, Optional, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func

from app.config.settings import settings
from app.config.database import get_mongo_db, mongodb
from app.models.nosql_models import (
    RealTimeTrafficSpeed, CarParkAvailability, TrafficIncident,
    PredictiveAnalytics, TrafficSpeedBand, ParkingStatus, IncidentSeverity
)
from app.models.sql_models import RoadNetwork, TrafficLight, TrafficAccident, PlanningArea

logger = structlog.get_logger(__name__)


class LTAAPIService:
    """Singapore Land Transport Authority API integration service"""
    
    def __init__(self):
        self.base_url = settings.LTA_BASE_URL
        self.api_key = settings.LTA_API_KEY
        self.timeout = httpx.Timeout(30.0, connect=10.0)
        
    async def _make_request(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Make authenticated request to LTA API"""
        headers = {
            "AccountKey": self.api_key,
            "Accept": "application/json"
        }
        
        url = f"{self.base_url}/{endpoint}"
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, headers=headers, params=params or {})
                response.raise_for_status()
                
                data = response.json()
                logger.info(
                    "LTA API request successful",
                    endpoint=endpoint,
                    status_code=response.status_code,
                    response_size=len(str(data))
                )
                return data
                
        except Exception as e:
            logger.error("LTA API error", endpoint=endpoint, error=str(e))
            raise Exception(f"LTA API error: {str(e)}")

    async def get_traffic_speed_bands(self, skip: int = 0) -> List[RealTimeTrafficSpeed]:
        """Get real-time traffic speed bands"""
        try:
            params = {"$skip": skip} if skip > 0 else {}
            data = await self._make_request("TrafficSpeedBandsv2", params)
            
            traffic_speeds = []
            current_time = datetime.now(timezone.utc)()
            
            for item in data.get("value", []):
                speed_band_mapping = {
                    1: TrafficSpeedBand.GREEN,   # > 40 km/h
                    2: TrafficSpeedBand.YELLOW,  # 20-40 km/h
                    3: TrafficSpeedBand.RED      # < 20 km/h
                }
                
                traffic_speed = RealTimeTrafficSpeed(
                    link_id=item["LinkID"],
                    road_name=item["RoadName"],
                    start_lat=item["StartLat"],
                    start_lon=item["StartLon"], 
                    end_lat=item["EndLat"],
                    end_lon=item["EndLon"],
                    current_speed=item.get("MinimumSpeed"),
                    free_flow_speed=item.get("MaximumSpeed", 60),
                    speed_band=speed_band_mapping.get(item["SpeedBand"], TrafficSpeedBand.YELLOW),
                    timestamp=current_time,
                    data_source="LTA_TrafficSpeedBands"
                )
                traffic_speeds.append(traffic_speed)
            
            logger.info("Fetched traffic speed bands", count=len(traffic_speeds), skip=skip)
            return traffic_speeds
            
        except Exception as e:
            logger.error("Failed to fetch traffic speed bands", error=str(e))
            raise

    async def get_carpark_availability(self, skip: int = 0) -> List[CarParkAvailability]:
        """Get real-time carpark availability"""
        try:
            params = {"$skip": skip} if skip > 0 else {}
            data = await self._make_request("CarParkAvailabilityv2", params)
            
            carpark_availability = []
            current_time = datetime.now(timezone.utc)()
            
            for item in data.get("value", []):
                total_lots = item["TotalLots"]
                available_lots = item["AvailableLots"]
                
                if available_lots == 0:
                    status = ParkingStatus.FULL
                elif available_lots < 0:
                    status = ParkingStatus.CLOSED
                    available_lots = 0
                else:
                    status = ParkingStatus.AVAILABLE
                
                carpark = CarParkAvailability(
                    carpark_id=item["CarParkID"],
                    carpark_name=item.get("Development", f"Carpark {item['CarParkID']}"),
                    latitude=item["Latitude"],
                    longitude=item["Longitude"],
                    total_lots=total_lots,
                    available_lots=max(0, available_lots),
                    lot_type=item["LotType"],
                    status=status,
                    pricing_scheme=item.get("Agency"),
                    timestamp=current_time,
                    data_source="LTA_CarParkAvailability"
                )
                carpark_availability.append(carpark)
            
            logger.info("Fetched carpark availability", count=len(carpark_availability), skip=skip)
            return carpark_availability
            
        except Exception as e:
            logger.error("Failed to fetch carpark availability", error=str(e))
            raise

    async def get_all_traffic_speeds(self) -> List[RealTimeTrafficSpeed]:
        """Get all traffic speed bands with pagination"""
        all_speeds = []
        skip = 0
        batch_size = 500
        
        while True:
            try:
                batch = await self.get_traffic_speed_bands(skip)
                if not batch:
                    break
                    
                all_speeds.extend(batch)
                if len(batch) < batch_size:
                    break
                    
                skip += batch_size
                await asyncio.sleep(0.1)  # Be respectful to API
                
            except Exception as e:
                logger.error("Error during pagination", skip=skip, error=str(e))
                break
        
        logger.info("Completed fetching all traffic speeds", total_count=len(all_speeds))
        return all_speeds


class TrafficService:
    """Core traffic management and analytics service"""
    
    def __init__(self):
        self.lta_service = LTAAPIService()
        
    async def get_real_time_traffic_overview(self) -> Dict[str, Any]:
        """Get comprehensive real-time traffic overview for dashboard"""
        try:
            traffic_speeds = await self.lta_service.get_all_traffic_speeds()
            
            total_links = len(traffic_speeds)
            if total_links == 0:
                raise Exception("No traffic data available")
            
            # Analyze congestion levels
            green_count = sum(1 for speed in traffic_speeds if speed.speed_band == TrafficSpeedBand.GREEN)
            yellow_count = sum(1 for speed in traffic_speeds if speed.speed_band == TrafficSpeedBand.YELLOW)
            red_count = sum(1 for speed in traffic_speeds if speed.speed_band == TrafficSpeedBand.RED)
            
            # Calculate average speeds
            speeds = [s.current_speed for s in traffic_speeds if s.current_speed is not None]
            avg_speed = sum(speeds) / len(speeds) if speeds else 0
            
            # Most congested roads
            congested_roads = [
                {
                    "road_name": speed.road_name,
                    "current_speed": speed.current_speed,
                    "speed_band": speed.speed_band.value,
                    "coordinates": {
                        "start": {"lat": speed.start_lat, "lon": speed.start_lon},
                        "end": {"lat": speed.end_lat, "lon": speed.end_lon}
                    }
                }
                for speed in sorted(
                    [s for s in traffic_speeds if s.speed_band == TrafficSpeedBand.RED],
                    key=lambda x: x.current_speed or 0
                )[:10]
            ]
            
            overview = {
                "timestamp": datetime.now(timezone.utc)().isoformat(),
                "total_monitored_roads": total_links,
                "overall_traffic_health": self._calculate_traffic_health(green_count, yellow_count, red_count),
                "average_speed_kmh": round(avg_speed, 1),
                "congestion_distribution": {
                    "free_flowing": {"count": green_count, "percentage": round(green_count/total_links*100, 1)},
                    "moderate": {"count": yellow_count, "percentage": round(yellow_count/total_links*100, 1)},
                    "congested": {"count": red_count, "percentage": round(red_count/total_links*100, 1)}
                },
                "most_congested_roads": congested_roads,
                "data_freshness_minutes": 0
            }
            
            logger.info("Generated traffic overview", total_roads=total_links, avg_speed=avg_speed)
            return overview
            
        except Exception as e:
            logger.error("Failed to generate traffic overview", error=str(e))
            raise
    
    def _calculate_traffic_health(self, green: int, yellow: int, red: int) -> str:
        """Calculate overall traffic health score"""
        total = green + yellow + red
        if total == 0:
            return "unknown"
        
        green_pct = green / total * 100
        red_pct = red / total * 100
        
        if green_pct >= 70:
            return "excellent"
        elif green_pct >= 50:
            return "good"
        elif red_pct <= 20:
            return "moderate"
        else:
            return "poor"

    async def get_traffic_predictions(self, road_name: Optional[str] = None, 
                                    horizon_minutes: int = 30) -> List[PredictiveAnalytics]:
        """Generate traffic predictions using historical patterns"""
        try:
            current_traffic = await self.lta_service.get_all_traffic_speeds()
            
            predictions = []
            current_time = datetime.now(timezone.utc)()
            prediction_time = current_time + timedelta(minutes=horizon_minutes)
            
            if road_name:
                current_traffic = [t for t in current_traffic if road_name.lower() in t.road_name.lower()]
            
            for traffic in current_traffic[:20]:  # Limit for demo
                predicted_speed = await self._predict_speed(traffic, current_time, horizon_minutes)
                confidence = self._calculate_prediction_confidence(traffic, horizon_minutes)
                
                prediction = PredictiveAnalytics(
                    prediction_id=f"traffic_speed_{traffic.link_id}_{int(current_time.timestamp())}",
                    prediction_type="traffic_speed",
                    target_location=traffic.road_name,
                    latitude=traffic.start_lat,
                    longitude=traffic.start_lon,
                    prediction_time_horizon=horizon_minutes,
                    confidence_score=confidence,
                    predicted_values={
                        "speed_kmh": predicted_speed,
                        "speed_band": self._speed_to_band(predicted_speed).value,
                        "congestion_level": self._speed_to_congestion_level(predicted_speed)
                    },
                    model_version="simple_pattern_v1.0",
                    input_features={
                        "current_speed": traffic.current_speed,
                        "current_band": traffic.speed_band.value,
                        "time_of_day": current_time.hour,
                        "day_of_week": current_time.weekday()
                    },
                    valid_until=prediction_time
                )
                predictions.append(prediction)
            
            logger.info("Generated traffic predictions", prediction_count=len(predictions))
            return predictions
            
        except Exception as e:
            logger.error("Failed to generate traffic predictions", error=str(e))
            raise
    
    async def _predict_speed(self, traffic: RealTimeTrafficSpeed, 
                           current_time: datetime, horizon_minutes: int) -> float:
        """Simple speed prediction algorithm"""
        current_speed = traffic.current_speed or traffic.free_flow_speed * 0.5
        hour = current_time.hour
        weekday = current_time.weekday()
        
        # Time-based patterns
        if weekday < 5:  # Weekday
            if 7 <= hour <= 9 or 17 <= hour <= 19:  # Rush hours
                prediction_factor = 0.7
            elif 10 <= hour <= 16:  # Mid-day
                prediction_factor = 0.85
            else:  # Off-peak
                prediction_factor = 1.1
        else:  # Weekend
            prediction_factor = 0.95
        
        # Account for current conditions
        if traffic.speed_band == TrafficSpeedBand.RED:
            prediction_factor *= 0.9
        elif traffic.speed_band == TrafficSpeedBand.GREEN:
            prediction_factor *= 1.05
        
        predicted_speed = current_speed * prediction_factor
        return max(5, min(90, predicted_speed))
    
    def _calculate_prediction_confidence(self, traffic: RealTimeTrafficSpeed, 
                                       horizon_minutes: int) -> float:
        """Calculate confidence score for predictions"""
        base_confidence = 0.8
        time_penalty = min(0.3, horizon_minutes / 120)
        
        if traffic.speed_band == TrafficSpeedBand.YELLOW:
            stability_bonus = 0.1
        else:
            stability_bonus = 0.0
        
        return max(0.3, base_confidence - time_penalty + stability_bonus)
    
    def _speed_to_band(self, speed: float) -> TrafficSpeedBand:
        """Convert speed to traffic band"""
        if speed >= 40:
            return TrafficSpeedBand.GREEN
        elif speed >= 20:
            return TrafficSpeedBand.YELLOW
        else:
            return TrafficSpeedBand.RED
    
    def _speed_to_congestion_level(self, speed: float) -> str:
        """Convert speed to congestion level"""
        if speed >= 50:
            return "free_flowing"
        elif speed >= 40:
            return "light"
        elif speed >= 25:
            return "moderate"
        elif speed >= 15:
            return "heavy"
        else:
            return "severe"


class ParkingService:
    """Parking management and analytics service"""
    
    def __init__(self):
        self.lta_service = LTAAPIService()
    
    async def get_parking_overview(self) -> Dict[str, Any]:
        """Get comprehensive parking availability overview"""
        try:
            # For now, return a simple structure
            # In full implementation, this would call LTA carpark APIs
            return {
                "timestamp": datetime.now(timezone.utc)().isoformat(),
                "total_carparks": 0,
                "available_lots": 0,
                "utilization_rate": 0.0,
                "message": "Parking service implementation in progress"
            }
        except Exception as e:
            logger.error("Failed to get parking overview", error=str(e))
            raise


class PlanningService:
    """Urban planning analytics service"""
    
    async def get_planning_overview(self) -> Dict[str, Any]:
        """Get urban planning data overview"""
        try:
            return {
                "timestamp": datetime.now(timezone.utc)().isoformat(),
                "planning_areas": 0,
                "development_projects": 0,
                "message": "Planning service implementation in progress"
            }
        except Exception as e:
            logger.error("Failed to get planning overview", error=str(e))
            raise


class AnalyticsService:
    """Advanced analytics and reporting service"""
    
    async def get_analytics_overview(self) -> Dict[str, Any]:
        """Get analytics overview"""
        try:
            return {
                "timestamp": datetime.now(timezone.utc)().isoformat(),
                "reports_available": 0,
                "insights_generated": 0,
                "message": "Analytics service implementation in progress"
            }
        except Exception as e:
            logger.error("Failed to get analytics overview", error=str(e))
            raise


# Singleton instances
lta_service = LTAAPIService()
traffic_service = TrafficService()
parking_service = ParkingService()
planning_service = PlanningService()
analytics_service = AnalyticsService()
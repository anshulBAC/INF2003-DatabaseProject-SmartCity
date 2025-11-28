from neo4j import AsyncDriver
from app.config.settings import settings
import structlog

logger = structlog.get_logger(__name__)

# --- Graph Data Science (GDS) Configuration ---
# IMPORTANT: These must match the labels and graph name you use in Neo4j Aura.
GRAPH_NAME = "roadGraph"        # Name of the projected graph
NODE_LABEL = "Point"            # Label for intersection/road points
RELATIONSHIP_TYPE = "ROAD_SEGMENT" # Relationship type for roads
WEIGHT_PROPERTY = "duration_sec"    # Relationship property for shortest path algorithm

def get_optimized_route_query(start_lat: float, start_lon: float, 
                               end_lat: float, end_lon: float) -> str:
    return """
    MATCH (start:Point)
    WITH start, point.distance(point({latitude: start.lat, longitude: start.lon}),
                               point({latitude: $start_lat, longitude: $start_lon})) AS dist
    ORDER BY dist LIMIT 1
    
    MATCH (end:Point)
    WITH start, end, point.distance(point({latitude: end.lat, longitude: end.lon}),
                                    point({latitude: $end_lat, longitude: $end_lon})) AS dist
    ORDER BY dist LIMIT 1
    
    MATCH path = shortestPath((start)-[:ROAD_SEGMENT*]-(end))
    RETURN path, 
           reduce(s=0, r in relationships(path) | s + r.duration_sec) as duration,
           reduce(s=0, r in relationships(path) | s + r.distance_km) as distance
    """

async def get_traffic_incidents(driver: AsyncDriver):
    pass
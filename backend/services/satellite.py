"""
Satellite tracking service
Simulated satellite tracking and telemetry
"""
import math
import time
from typing import List, Dict
from datetime import datetime, timedelta
import random


# Default satellites to track
DEFAULT_SATELLITES = [
    {"id": 1, "name": "ISS (ZARYA)", "norad_id": 25544, "color": "#00f0ff"},
    {"id": 2, "name": "HUBBLE", "norad_id": 20580, "color": "#ff00f0"},
    {"id": 3, "name": "Starlink-1007", "norad_id": 44713, "color": "#f0ff00"},
    {"id": 4, "name": "NOAA 18", "norad_id": 28654, "color": "#ff7000"},
    {"id": 5, "name": "Sentinel-2A", "norad_id": 40697, "color": "#60A5FA"},
    {"id": 6, "name": "Landsat-9", "norad_id": 49260, "color": "#34D399"},
    {"id": 7, "name": "TerraSAR-X", "norad_id": 31698, "color": "#F59E0B"},
    {"id": 8, "name": "CARTOSAT-3", "norad_id": 44804, "color": "#EC4899"},
]


def generate_satellite_position(satellite_id: int, t: float = None) -> Dict:
    """
    Generate simulated satellite position using Lissajous curves
    
    Args:
        satellite_id: Unique satellite identifier
        t: Time parameter (uses current time if None)
    
    Returns:
        Dictionary with latitude, longitude, altitude, velocity
    """
    if t is None:
        t = time.time()
    
    # Use satellite_id as seed for unique orbital parameters
    random.seed(satellite_id)
    
    # Orbital parameters (varied per satellite)
    freq_lat = 0.01 + (satellite_id * 0.002)
    freq_lon = 0.015 + (satellite_id * 0.001)
    phase_lat = satellite_id * 0.5
    phase_lon = satellite_id * 0.7
    
    # Calculate position using modified Lissajous curves
    lat = 45 * math.sin(freq_lat * t + phase_lat)
    lon = 180 * math.sin(freq_lon * t + phase_lon)
    
    # Altitude varies based on satellite type (LEO orbit)
    base_altitude = 400 + (satellite_id * 50)
    altitude = base_altitude + 50 * math.sin(freq_lat * t * 0.5)
    
    # Velocity (typical orbital speed for LEO)
    velocity = 7.5 + 0.5 * math.sin(t * 0.1 + satellite_id)
    
    return {
        "latitude": round(lat, 6),
        "longitude": round(lon, 6),
        "altitude_km": round(altitude, 2),
        "velocity_kmh": round(velocity * 1000, 2),
    }


def predict_next_pass(satellite: Dict, observer_lat: float = 26.0, observer_lon: float = 92.0) -> Dict:
    """
    Predict next visible pass for a satellite
    
    Args:
        satellite: Satellite dictionary
        observer_lat: Observer latitude
        observer_lon: Observer longitude
    
    Returns:
        Dictionary with pass prediction details
    """
    # Simulate pass prediction
    now = datetime.now()
    
    # Random pass time between 1-12 hours from now
    random.seed(satellite["norad_id"])
    hours_until_pass = random.uniform(1, 12)
    pass_start = now + timedelta(hours=hours_until_pass)
    
    # Pass duration 2-10 minutes
    duration_minutes = random.randint(2, 10)
    pass_end = pass_start + timedelta(minutes=duration_minutes)
    
    # Maximum elevation angle (10-90 degrees)
    max_elevation = random.randint(10, 90)
    
    # Visibility quality based on elevation
    if max_elevation >= 60:
        visibility = "Excellent"
    elif max_elevation >= 40:
        visibility = "Good"
    elif max_elevation >= 20:
        visibility = "Fair"
    else:
        visibility = "Poor"
    
    return {
        "satellite_name": satellite["name"],
        "start_time": pass_start.isoformat(),
        "end_time": pass_end.isoformat(),
        "duration_seconds": duration_minutes * 60,
        "max_elevation": max_elevation,
        "visibility": visibility,
        "observer_lat": observer_lat,
        "observer_lon": observer_lon,
    }


def get_satellite_telemetry(satellite: Dict) -> Dict:
    """
    Get detailed telemetry data for a satellite
    
    Args:
        satellite: Satellite dictionary
    
    Returns:
        Dictionary with telemetry data
    """
    position = generate_satellite_position(satellite["id"])
    
    # Additional telemetry (simulated)
    random.seed(satellite["norad_id"])
    
    return {
        **position,
        "signal_strength": round(random.uniform(75, 98), 1),
        "battery_level": round(random.uniform(85, 100), 1),
        "temperature_c": round(random.uniform(-20, 45), 1),
        "solar_panel_power_w": round(random.uniform(200, 800), 1),
        "data_rate_mbps": round(random.uniform(10, 150), 2),
        "orbit_number": random.randint(10000, 50000),
        "timestamp": datetime.now().isoformat(),
    }


def calculate_fusion_metrics(satellites: List[Dict]) -> Dict:
    """
    Calculate aggregated data fusion metrics from multiple satellites
    
    Args:
        satellites: List of satellite dictionaries with telemetry
    
    Returns:
        Dictionary with fusion metrics
    """
    if not satellites:
        return {
            "total_coverage_area_km2": 0,
            "average_altitude_km": 0,
            "average_velocity_kmh": 0,
            "fusion_accuracy": 0,
            "data_throughput_mbps": 0,
            "active_satellites_count": 0,
        }
    
    total_altitude = sum(s.get("altitude_km", 0) for s in satellites)
    total_velocity = sum(s.get("velocity_kmh", 0) for s in satellites)
    total_data_rate = sum(s.get("data_rate_mbps", 0) for s in satellites)
    
    # Calculate coverage area (simplified - each satellite covers ~1M km²)
    coverage_per_satellite = 1_000_000  # km²
    total_coverage = len(satellites) * coverage_per_satellite
    
    # Fusion accuracy (improves with more satellites)
    fusion_accuracy = min(95, 70 + (len(satellites) * 3))
    
    return {
        "total_coverage_area_km2": round(total_coverage, 0),
        "average_altitude_km": round(total_altitude / len(satellites), 2),
        "average_velocity_kmh": round(total_velocity / len(satellites), 2),
        "fusion_accuracy": round(fusion_accuracy, 1),
        "data_throughput_mbps": round(total_data_rate, 2),
        "active_satellites_count": len(satellites),
        "timestamp": datetime.now().isoformat(),
    }

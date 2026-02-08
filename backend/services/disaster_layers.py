"""
Disaster Early Warning Data Layers
Lightweight implementation with multiple data sources
"""
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import random

def generate_weather_alerts(lat: float, lon: float, radius: float = 2.0) -> Dict[str, Any]:
    """Generate weather-based alerts (precipitation, storms)"""
    
    # Simulate weather patterns
    num_alerts = random.randint(0, 3)
    alerts = []
    
    weather_types = [
        {"type": "Heavy Rainfall", "severity": "HIGH", "icon": "cloud-rain"},
        {"type": "Thunderstorm", "severity": "MEDIUM", "icon": "cloud-lightning"},
        {"type": "Strong Winds", "severity": "MEDIUM", "icon": "wind"},
        {"type": "Hail Risk", "severity": "LOW", "icon": "cloud-hail"}
    ]
    
    for i in range(num_alerts):
        weather = random.choice(weather_types)
        offset_lat = (random.random() - 0.5) * radius
        offset_lon = (random.random() - 0.5) * radius
        
        alerts.append({
            "id": f"WEATHER-{datetime.now().strftime('%Y%m%d')}-{i:03d}",
            "type": weather["type"],
            "severity": weather["severity"],
            "icon": weather["icon"],
            "latitude": lat + offset_lat,
            "longitude": lon + offset_lon,
            "radius_km": random.uniform(5, 25),
            "confidence": random.randint(70, 95),
            "timestamp": (datetime.now() - timedelta(hours=random.randint(0, 6))).isoformat(),
            "description": f"{weather['type']} detected in the region. Monitor conditions closely.",
            "expected_duration_hours": random.randint(2, 12)
        })
    
    return {
        "alerts": alerts,
        "count": len(alerts),
        "coverage_area_km2": radius * radius * 3.14159
    }


def generate_flood_risk_zones(lat: float, lon: float, grid_size: int = 30) -> Dict[str, Any]:
    """Generate flood risk zones based on terrain and water proximity"""
    
    features = []
    
    # Generate risk zones
    num_zones = random.randint(2, 5)
    
    for i in range(num_zones):
        # Create a small polygon for each risk zone
        center_lat = lat + (random.random() - 0.5) * 1.5
        center_lon = lon + (random.random() - 0.5) * 1.5
        size = random.uniform(0.1, 0.3)
        
        polygon = [
            [center_lon - size, center_lat - size],
            [center_lon + size, center_lat - size],
            [center_lon + size, center_lat + size],
            [center_lon - size, center_lat + size],
            [center_lon - size, center_lat - size]
        ]
        
        risk_levels = ["LOW", "MEDIUM", "HIGH"]
        risk_level = random.choice(risk_levels)
        
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [polygon]
            },
            "properties": {
                "risk_level": risk_level,
                "zone_id": f"FLOOD-{i:03d}",
                "population_at_risk": random.randint(500, 5000),
                "water_level_trend": random.choice(["stable", "rising", "falling"]),
                "last_updated": datetime.now().isoformat()
            }
        })
    
    return {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "total_zones": len(features),
            "high_risk_zones": sum(1 for f in features if f["properties"]["risk_level"] == "HIGH")
        }
    }


def generate_fire_hotspots(lat: float, lon: float, days: int = 1) -> Dict[str, Any]:
    """Generate fire hotspot data"""
    
    num_hotspots = random.randint(0, 8)
    hotspots = []
    
    for i in range(num_hotspots):
        offset_lat = (random.random() - 0.5) * 2.0
        offset_lon = (random.random() - 0.5) * 2.0
        
        confidence = random.randint(60, 100)
        brightness = random.uniform(300, 380)
        
        # High brightness = active fire
        severity = "HIGH" if brightness > 350 else "MEDIUM" if brightness > 320 else "LOW"
        
        hotspots.append({
            "id": f"FIRE-{datetime.now().strftime('%Y%m%d')}-{i:03d}",
            "latitude": lat + offset_lat,
            "longitude": lon + offset_lon,
            "brightness_kelvin": brightness,
            "confidence": confidence,
            "severity": severity,
            "detection_time": (datetime.now() - timedelta(hours=random.randint(0, 24*days))).isoformat(),
            "satellite": random.choice(["VIIRS", "MODIS", "Sentinel-3"]),
            "area_km2": random.uniform(0.1, 2.5)
        })
    
    return {
        "hotspots": hotspots,
        "count": len(hotspots),
        "active_fires": sum(1 for h in hotspots if h["severity"] == "HIGH"),
        "time_range_days": days
    }


def generate_seismic_activity(lat: float, lon: float, days: int = 7) -> Dict[str, Any]:
    """Generate earthquake/seismic activity data"""
    
    num_events = random.randint(0, 5)
    events = []
    
    for i in range(num_events):
        offset_lat = (random.random() - 0.5) * 3.0
        offset_lon = (random.random() - 0.5) * 3.0
        
        magnitude = random.uniform(2.0, 6.5)
        depth_km = random.uniform(5, 50)
        
        # Determine severity based on magnitude
        if magnitude >= 6.0:
            severity = "HIGH"
        elif magnitude >= 4.5:
            severity = "MEDIUM"
        else:
            severity = "LOW"
        
        events.append({
            "id": f"SEISMIC-{datetime.now().strftime('%Y%m%d')}-{i:03d}",
            "latitude": lat + offset_lat,
            "longitude": lon + offset_lon,
            "magnitude": round(magnitude, 1),
            "depth_km": round(depth_km, 1),
            "severity": severity,
            "timestamp": (datetime.now() - timedelta(days=random.random() * days)).isoformat(),
            "type": random.choice(["earthquake", "tremor", "aftershock"]),
            "felt_reports": random.randint(0, 200) if magnitude > 3.5 else 0
        })
    
    # Sort by time (most recent first)
    events.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {
        "events": events,
        "count": len(events),
        "max_magnitude": max([e["magnitude"] for e in events]) if events else 0.0,
        "time_range_days": days
    }


def generate_drought_indicators(lat: float, lon: float, grid_size: int = 40) -> Dict[str, Any]:
    """Generate drought risk indicators based on vegetation health"""
    
    features = []
    
    # Create grid of vegetation health zones
    num_zones = random.randint(3, 6)
    
    for i in range(num_zones):
        center_lat = lat + (random.random() - 0.5) * 1.0
        center_lon = lon + (random.random() - 0.5) * 1.0
        size = random.uniform(0.15, 0.25)
        
        polygon = [
            [center_lon - size, center_lat - size],
            [center_lon + size, center_lat - size],
            [center_lon + size, center_lat + size],
            [center_lon - size, center_lat + size],
            [center_lon - size, center_lat - size]
        ]
        
        # NDVI values: <0.2 = stressed, 0.2-0.4 = moderate, >0.4 = healthy
        ndvi = random.uniform(0.1, 0.7)
        
        if ndvi < 0.2:
            risk_level = "HIGH"
            status = "Severe Stress"
        elif ndvi < 0.4:
            risk_level = "MEDIUM"
            status = "Moderate Stress"
        else:
            risk_level = "LOW"
            status = "Healthy"
        
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [polygon]
            },
            "properties": {
                "zone_id": f"DROUGHT-{i:03d}",
                "ndvi": round(ndvi, 2),
                "risk_level": risk_level,
                "status": status,
                "soil_moisture_percent": random.randint(10, 60),
                "precipitation_deficit_mm": random.randint(0, 150),
                "last_rainfall_days": random.randint(0, 60)
            }
        })
    
    return {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "total_zones": len(features),
            "critical_zones": sum(1 for f in features if f["properties"]["risk_level"] == "HIGH"),
            "average_ndvi": round(sum(f["properties"]["ndvi"] for f in features) / len(features), 2) if features else 0
        }
    }


def generate_cyclone_tracks(lat: float, lon: float) -> Dict[str, Any]:
    """Generate cyclone/hurricane tracking data"""
    
    # Simulate 0-2 active cyclones
    num_cyclones = random.randint(0, 2)
    cyclones = []
    
    categories = ["Tropical Depression", "Tropical Storm", "Category 1", "Category 2", "Category 3"]
    
    for i in range(num_cyclones):
        # Generate a track (past positions)
        num_points = random.randint(5, 12)
        track_points = []
        
        current_lat = lat + (random.random() - 0.5) * 5.0
        current_lon = lon + (random.random() - 0.5) * 5.0
        
        for j in range(num_points):
            track_points.append({
                "latitude": current_lat,
                "longitude": current_lon,
                "timestamp": (datetime.now() - timedelta(hours=(num_points - j) * 6)).isoformat(),
                "wind_speed_kmh": random.randint(80, 200),
                "pressure_mb": random.randint(950, 1000)
            })
            # Move the cyclone
            current_lat += (random.random() - 0.5) * 0.5
            current_lon += (random.random() - 0.3) * 0.8
        
        latest = track_points[-1]
        category = random.choice(categories)
        
        cyclones.append({
            "id": f"CYCLONE-{datetime.now().strftime('%Y')}-{chr(65+i)}",
            "name": f"Storm {chr(65+i)}",
            "category": category,
            "severity": "HIGH" if "Category" in category else "MEDIUM",
            "current_position": {
                "latitude": latest["latitude"],
                "longitude": latest["longitude"]
            },
            "wind_speed_kmh": latest["wind_speed_kmh"],
            "pressure_mb": latest["pressure_mb"],
            "movement_direction": random.choice(["NE", "NW", "SE", "SW", "N", "S", "E", "W"]),
            "movement_speed_kmh": random.randint(15, 45),
            "track": track_points,
            "affected_area_km2": random.randint(5000, 50000)
        })
    
    return {
        "cyclones": cyclones,
        "count": len(cyclones),
        "active_warnings": sum(1 for c in cyclones if c["severity"] == "HIGH")
    }


def generate_landslide_risk(lat: float, lon: float) -> Dict[str, Any]:
    """Generate landslide risk zones"""
    
    features = []
    num_zones = random.randint(1, 4)
    
    for i in range(num_zones):
        center_lat = lat + (random.random() - 0.5) * 1.2
        center_lon = lon + (random.random() - 0.5) * 1.2
        size = random.uniform(0.08, 0.18)
        
        polygon = [
            [center_lon - size, center_lat - size],
            [center_lon + size, center_lat - size],
            [center_lon + size, center_lat + size],
            [center_lon - size, center_lat + size],
            [center_lon - size, center_lat - size]
        ]
        
        slope_angle = random.uniform(15, 50)
        soil_saturation = random.uniform(30, 95)
        
        # Risk calculation based on slope and saturation
        risk_score = (slope_angle / 50) * 50 + (soil_saturation / 100) * 50
        
        if risk_score > 70:
            risk_level = "HIGH"
        elif risk_score > 45:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
        
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [polygon]
            },
            "properties": {
                "zone_id": f"LANDSLIDE-{i:03d}",
                "risk_level": risk_level,
                "risk_score": round(risk_score, 1),
                "slope_angle_degrees": round(slope_angle, 1),
                "soil_saturation_percent": round(soil_saturation, 1),
                "recent_rainfall_mm": random.randint(20, 200),
                "vegetation_cover_percent": random.randint(10, 80)
            }
        })
    
    return {
        "type": "FeatureCollection",
        "features": features,
        "metadata": {
            "total_zones": len(features),
            "high_risk_zones": sum(1 for f in features if f["properties"]["risk_level"] == "HIGH")
        }
    }


def get_all_disaster_layers(lat: float, lon: float) -> Dict[str, Any]:
    """Get summary of all disaster warning layers"""
    
    weather = generate_weather_alerts(lat, lon)
    flood = generate_flood_risk_zones(lat, lon)
    fire = generate_fire_hotspots(lat, lon)
    seismic = generate_seismic_activity(lat, lon)
    drought = generate_drought_indicators(lat, lon)
    cyclone = generate_cyclone_tracks(lat, lon)
    landslide = generate_landslide_risk(lat, lon)
    
    # Count total alerts
    total_alerts = (
        weather["count"] +
        flood["metadata"]["high_risk_zones"] +
        fire["active_fires"] +
        sum(1 for e in seismic["events"] if e["severity"] == "HIGH") +
        drought["metadata"]["critical_zones"] +
        cyclone["active_warnings"] +
        landslide["metadata"]["high_risk_zones"]
    )
    
    # Calculate overall risk level
    if total_alerts >= 5:
        overall_risk = "CRITICAL"
    elif total_alerts >= 3:
        overall_risk = "HIGH"
    elif total_alerts >= 1:
        overall_risk = "MODERATE"
    else:
        overall_risk = "LOW"
    
    return {
        "summary": {
            "overall_risk": overall_risk,
            "total_alerts": total_alerts,
            "location": {"latitude": lat, "longitude": lon},
            "last_updated": datetime.now().isoformat()
        },
        "layers_available": {
            "weather": weather["count"] > 0,
            "flood": flood["metadata"]["total_zones"] > 0,
            "fire": fire["count"] > 0,
            "seismic": seismic["count"] > 0,
            "drought": drought["metadata"]["total_zones"] > 0,
            "cyclone": cyclone["count"] > 0,
            "landslide": landslide["metadata"]["total_zones"] > 0
        },
        "active_threats": {
            "weather_alerts": weather["count"],
            "flood_zones": flood["metadata"]["high_risk_zones"],
            "active_fires": fire["active_fires"],
            "significant_earthquakes": sum(1 for e in seismic["events"] if e["magnitude"] >= 4.5),
            "drought_areas": drought["metadata"]["critical_zones"],
            "active_cyclones": cyclone["count"],
            "landslide_zones": landslide["metadata"]["high_risk_zones"]
        }
    }

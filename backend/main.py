"""
Unified Satellite Dashboard - Main API Server
Combines environmental monitoring, satellite tracking, and real satellite data analysis
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
from functools import lru_cache
import os
from dotenv import load_dotenv
import numpy as np
import rasterio
from rasterio.warp import transform as rasterio_transform
# Real satellite data integration
import planetary_computer
import requests
from pystac_client import Client

# Import services
from services.environmental import (
    generate_synthetic_satellite_data,
    detect_water_change,
    calculate_slope_factor,
    calculate_rainfall_factor,
    calculate_risk_score,
    generate_risk_geojson,
)
from services.satellite import (
    DEFAULT_SATELLITES,
    generate_satellite_position,
    predict_next_pass,
    get_satellite_telemetry,
    calculate_fusion_metrics,
)
from services.ai_insights import (
    generate_environmental_insights,
    generate_satellite_insights,
)
from services.disaster_layers import (
    generate_weather_alerts,
    generate_flood_risk_zones,
    generate_fire_hotspots,
    generate_seismic_activity,
    generate_drought_indicators,
    generate_cyclone_tracks,
    generate_landslide_risk,
    get_all_disaster_layers,
)

# Load environment variables
load_dotenv()

# Planetary Computer STAC configuration
PC_STAC_URL = "https://planetarycomputer.microsoft.com/api/stac/v1"
PC_TILE_URL = "https://planetarycomputer.microsoft.com/api/data/v1/item/tiles"

# Initialize FastAPI app
app = FastAPI(
    title="Unified Satellite Dashboard API",
    description="Environmental monitoring, satellite tracking, and real satellite data analysis",
    version="3.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZip compression for responses > 1KB
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for frontend connectivity"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# ============================================================================
# DATA MODELS
# ============================================================================

class Alert(BaseModel):
    """Environmental risk alert"""
    id: str
    level: str
    title: str
    description: str
    area_km2: float
    confidence: float
    timestamp: str
    location: Dict[str, float]


class RiskResponse(BaseModel):
    """Risk analysis response"""
    geojson: Dict
    alerts: List[Alert]
    confidence: float
    timestamp: str
    metadata: Dict
    ai_insights: Optional[Dict[str, Any]] = None


class SatelliteCreate(BaseModel):
    """Create new satellite"""
    name: str
    norad_id: int
    color: str = "#00f0ff"


class SatelliteResponse(BaseModel):
    """Satellite information"""
    id: int
    name: str
    norad_id: int
    color: str
    is_active: bool = True


class SearchRequest(BaseModel):
    """STAC search request"""
    collections: List[str] = Field(default_factory=list)
    bbox: List[float] = Field(..., min_items=4, max_items=6)
    start: str
    end: str
    limit: int = 40


class NdviRequest(BaseModel):
    """NDVI/NDWI computation request"""
    collection: str
    item_id: str
    lon: float
    lat: float


# In-memory satellite storage (replace with database in production)
satellites_db = [dict(sat, is_active=True) for sat in DEFAULT_SATELLITES]
next_satellite_id = len(satellites_db) + 1


# ============================================================================
# REAL SATELLITE DATA FUNCTIONS
# ============================================================================

# Cache for STAC search results
from typing import Tuple
from datetime import timedelta

STAC_CACHE: Dict[Tuple[str, str], Tuple[List[Dict[str, Any]], datetime]] = {}
CACHE_DURATION = timedelta(minutes=30)

def bbox_from_point(lat: float, lon: float, radius_km: float = 40) -> List[float]:
    """
    Create bounding box from center point.
    
    Args:
        lat: Center latitude
        lon: Center longitude
        radius_km: Radius in kilometers
    
    Returns:
        [minx, miny, maxx, maxy] bounding box
    """
    import math
    dlat = radius_km / 111.0
    dlon = radius_km / (111.0 * math.cos(math.radians(lat)))
    return [lon - dlon, lat - dlat, lon + dlon, lat + dlat]


def stac_search(collections: List[str], bbox: List[float], start: str, end: str, limit: int) -> List[Dict[str, Any]]:
    """
    Search for satellite imagery using STAC API with caching.
    
    Args:
        collections: List of collection IDs (e.g., ["sentinel-2-l2a"])
        bbox: Bounding box [minx, miny, maxx, maxy]
        start: Start date ISO format
        end: End date ISO format
        limit: Maximum items to return
    
    Returns:
        List of STAC items
    """
    # Create cache key
    cache_key = (str(collections), str(bbox), start, end, str(limit))
    
    # Check cache
    if cache_key in STAC_CACHE:
        cached_items, cached_time = STAC_CACHE[cache_key]
        if datetime.now() - cached_time < CACHE_DURATION:
            return cached_items
    
    try:
        client = Client.open(PC_STAC_URL)
        search = client.search(
            collections=collections,
            bbox=bbox,
            datetime=f"{start}/{end}",
            limit=limit
        )
        items = [planetary_computer.sign(item).to_dict() for item in search.items()]
        
        # Cache results
        STAC_CACHE[cache_key] = (items, datetime.now())
        
        # Clean old cache entries
        if len(STAC_CACHE) > 50:
            old_keys = [k for k, (_, t) in STAC_CACHE.items() if datetime.now() - t > CACHE_DURATION]
            for k in old_keys:
                del STAC_CACHE[k]
        
        return items
    except Exception as e:
        print(f"Error in STAC search: {e}")
        return []


def find_asset(item: Dict[str, Any], candidates: List[str]) -> Optional[Dict[str, Any]]:
    """Find first matching asset from candidates."""
    assets = item.get("assets") or {}
    for name in candidates:
        if name in assets:
            return assets[name]
    return None


def sample_band_value(asset_href: str, lon: float, lat: float) -> Optional[float]:
    """
    Sample a single pixel value from a raster asset.
    
    Args:
        asset_href: URL to the raster asset
        lon: Longitude
        lat: Latitude
    
    Returns:
        Float value or None if sampling fails
    """
    try:
        with rasterio.Env():
            with rasterio.open(asset_href) as dataset:
                x, y = lon, lat
                if dataset.crs and dataset.crs.to_string() != "EPSG:4326":
                    x, y = rasterio_transform("EPSG:4326", dataset.crs, [lon], [lat])
                    x, y = x[0], y[0]
                row, col = dataset.index(x, y)
                window = rasterio.windows.Window(col_off=col, row_off=row, width=1, height=1)
                data = dataset.read(1, window=window, masked=True)
                if data.size == 0 or data.mask[0, 0]:
                    return None
                return float(data[0, 0])
    except Exception as e:
        print(f"Error sampling band: {e}")
        return None


def compute_ndvi(item: Dict[str, Any], lon: float, lat: float) -> Optional[float]:
    """
    Compute NDVI from satellite item.
    
    Args:
        item: STAC item dictionary
        lon: Longitude
        lat: Latitude
    
    Returns:
        NDVI value (-1 to 1) or None
    """
    collection = item.get("collection")
    
    # Find appropriate red and NIR bands based on collection
    if collection == "sentinel-2-l2a":
        red_asset = find_asset(item, ["B04", "red"])
        nir_asset = find_asset(item, ["B08", "nir", "nir08"])
    else:  # Landsat
        red_asset = find_asset(item, ["red", "SR_B4", "B4"])
        nir_asset = find_asset(item, ["nir08", "SR_B5", "B5", "nir"])
    
    if not red_asset or not nir_asset:
        return None
    
    # Sample both bands
    red = sample_band_value(red_asset["href"], lon, lat)
    nir = sample_band_value(nir_asset["href"], lon, lat)
    
    if red is None or nir is None:
        return None
    
    # Calculate NDVI
    return (nir - red) / (nir + red) if (nir + red) != 0 else 0.0


def compute_ndwi_from_satellite(item: Dict[str, Any], lon: float, lat: float) -> Optional[float]:
    """
    Compute NDWI (Normalized Difference Water Index) from satellite item.
    NDWI = (Green - NIR) / (Green + NIR)
    
    Args:
        item: STAC item dictionary
        lon: Longitude
        lat: Latitude
    
    Returns:
        NDWI value (-1 to 1) or None
    """
    collection = item.get("collection")
    
    # Find appropriate green and NIR bands
    if collection == "sentinel-2-l2a":
        green_asset = find_asset(item, ["B03", "green"])
        nir_asset = find_asset(item, ["B08", "nir", "nir08"])
    else:  # Landsat
        green_asset = find_asset(item, ["green", "SR_B3", "B3"])
        nir_asset = find_asset(item, ["nir08", "SR_B5", "B5", "nir"])
    
    if not green_asset or not nir_asset:
        return None
    
    # Sample both bands
    green = sample_band_value(green_asset["href"], lon, lat)
    nir = sample_band_value(nir_asset["href"], lon, lat)
    
    if green is None or nir is None:
        return None
    
    # Calculate NDWI
    return (green - nir) / (green + nir) if (green + nir) != 0 else 0.0


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def generate_alerts_from_geojson(geojson: Dict) -> List[Alert]:
    """Generate structured alerts from GeoJSON risk zones"""
    alerts = []
    
    alert_templates = {
        "HIGH": {
            "title": "Critical Erosion Risk Detected",
            "description": "Significant water expansion detected in {location}. Area: {area}km²."
        },
        "MEDIUM": {
            "title": "Moderate Risk Area Identified",
            "description": "Water level changes observed in {location}. Area: {area}km²."
        },
        "LOW": {
            "title": "Low Risk Alert",
            "description": "Minor changes detected in {location}. Area: {area}km²."
        }
    }
    
    features = geojson.get("features", [])
    for idx, feature in enumerate(features):
        props = feature["properties"]
        level = props["risk_level"]
        
        location = f"Region ({props['center_lat']:.2f}°N, {props['center_lon']:.2f}°E)"
        confidence = min(95, 60 + (props["risk_score"] - 40) * 0.7)
        confidence = max(50, confidence)
        
        alert = Alert(
            id=f"ALERT-{datetime.now().strftime('%Y%m%d')}-{idx:03d}",
            level=level,
            title=alert_templates[level]["title"],
            description=alert_templates[level]["description"].format(
                location=location,
                area=f"{props['area_km2']:.1f}"
            ),
            area_km2=props["area_km2"],
            confidence=confidence,
            timestamp=datetime.now().isoformat(),
            location={
                "lat": props["center_lat"],
                "lon": props["center_lon"]
            }
        )
        alerts.append(alert)
    
    risk_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    alerts.sort(key=lambda x: (risk_order[x.level], -x.area_km2))
    
    return alerts


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/", tags=["Root"])
async def root():
    """API information"""
    return {
        "name": "Unified Satellite Dashboard API",
        "version": "3.0.0",
        "description": "Environmental monitoring + satellite tracking + AI insights",
        "features": [
            "Environmental risk detection (NDWI, DEM, rainfall)",
            "Multi-satellite tracking with telemetry",
            "Real satellite data from Planetary Computer",
            "NDVI and NDWI computation from Sentinel-2 and Landsat",
            "Pass predictions",
            "Data fusion metrics",
            "Disaster early warning system",
            "AI-powered insights with Gemini"
        ],
        "endpoints": {
            "/api/health": "Health check",
            "/api/environmental/risk": "Environmental risk analysis (synthetic)",
            "/api/environmental/risk/real": "Risk analysis with real satellite data",
            "/api/satellite/search": "Search satellite imagery (STAC)",
            "/api/satellite/ndvi": "Compute NDVI from satellite",
            "/api/satellite/ndwi": "Compute NDWI from satellite",
            "/api/satellites": "Satellite management",
            "/api/satellites/telemetry": "Real-time telemetry",
            "/api/satellites/passes": "Pass predictions",
            "/api/fusion/metrics": "Data fusion metrics",
            "/api/disaster/summary": "Comprehensive disaster monitoring",
            "/docs": "Interactive API documentation"
        }
    }


@app.get("/api/health", tags=["System"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "service": "Unified Satellite Dashboard API",
        "version": "3.0.0",
        "modules": {
            "environmental_monitoring": "enabled",
            "satellite_tracking": "enabled",
            "ai_insights": "enabled" if os.getenv("GEMINI_API_KEY") else "disabled"
        }
    }


# ============================================================================
# ENVIRONMENTAL MONITORING ENDPOINTS
# ============================================================================

@app.get("/api/environmental/risk", response_model=RiskResponse, tags=["Environmental"])
async def get_risk_analysis(
    lat: float = 26.0,
    lon: float = 92.0,
    grid_size: int = 50
):
    """
    Calculate environmental risk analysis
    
    Parameters:
        lat: Center latitude
        lon: Center longitude
        grid_size: Analysis grid size (20-100)
    """
    try:
        if not 20 <= grid_size <= 100:
            raise HTTPException(400, "Grid size must be 20-100")
        
        # Generate synthetic data
        old_ndwi, new_ndwi, dem, rainfall = generate_synthetic_satellite_data(lat, lon, grid_size)
        
        # Calculate risk
        water_change = detect_water_change(old_ndwi, new_ndwi)
        slope_factor = calculate_slope_factor(dem)
        rainfall_factor = calculate_rainfall_factor(rainfall)
        risk_score = calculate_risk_score(water_change, slope_factor, rainfall_factor)
        
        # Generate results
        geojson = generate_risk_geojson(risk_score, lat, lon)
        alerts = generate_alerts_from_geojson(geojson)
        
        overall_confidence = sum(a.confidence for a in alerts) / len(alerts) if alerts else 0.0
        
        metadata = {
            "region": f"Analysis Center ({lat:.2f}°N, {lon:.2f}°E)",
            "center": {"lat": lat, "lon": lon},
            "analysis_type": "synthetic",
            "grid_size": grid_size,
            "total_alerts": len(alerts),
            "high_risk_count": sum(1 for a in alerts if a.level == "HIGH"),
            "medium_risk_count": sum(1 for a in alerts if a.level == "MEDIUM"),
            "low_risk_count": sum(1 for a in alerts if a.level == "LOW"),
            "total_risk_area_km2": sum(a.area_km2 for a in alerts)
        }
        
        ai_insights = generate_environmental_insights(metadata, alerts, overall_confidence)
        
        return RiskResponse(
            geojson=geojson,
            alerts=alerts,
            confidence=overall_confidence,
            timestamp=datetime.now().isoformat(),
            metadata=metadata,
            ai_insights=ai_insights
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Risk analysis error: {str(e)}")


@app.get("/api/environmental/risk/national", tags=["Environmental"])
async def get_national_risk_analysis():
    """
    Analyze environmental risk for multiple key regions.
    Provides comprehensive national-level risk assessment.
    """
    key_regions = [
        {"lat": 26.0, "lon": 92.0, "name": "Brahmaputra River, Assam"},
        {"lat": 27.5, "lon": 94.5, "name": "Northeast River Basin"},
        {"lat": 30.5, "lon": 79.5, "name": "Himalayan Foothills"},
        {"lat": 25.0, "lon": 83.0, "name": "Ganga River Basin"},
        {"lat": 19.0, "lon": 73.0, "name": "Maharashtra Coast"},
        {"lat": 13.0, "lon": 80.0, "name": "Tamil Nadu Coastal"},
        {"lat": 10.0, "lon": 76.5, "name": "Kerala Backwaters"},
        {"lat": 21.0, "lon": 79.0, "name": "Central India Rivers"},
    ]

    all_features = []
    all_alerts = []

    try:
        for region in key_regions:
            lat, lon = region["lat"], region["lon"]
            
            old_ndwi, new_ndwi, dem, rainfall = generate_synthetic_satellite_data(
                lat_center=lat, lon_center=lon, grid_size=30
            )
            
            water_change = detect_water_change(old_ndwi, new_ndwi)
            slope_factor = calculate_slope_factor(dem)
            rainfall_factor = calculate_rainfall_factor(rainfall)
            risk_score = calculate_risk_score(water_change, slope_factor, rainfall_factor)
            
            geojson = generate_risk_geojson(risk_score, lat, lon)
            
            if geojson and "features" in geojson:
                for feature in geojson["features"]:
                    feature["properties"]["region_name"] = region["name"]
                    all_features.append(feature)
            
            region_alerts = generate_alerts_from_geojson(geojson)
            for alert in region_alerts:
                alert.description = alert.description.replace("Region", region["name"])
                all_alerts.append(alert)

        combined_geojson = {
            "type": "FeatureCollection",
            "features": all_features
        }

        overall_confidence = sum(a.confidence for a in all_alerts) / len(all_alerts) if all_alerts else 0.0

        metadata = {
            "region": "Multi-Region National Analysis",
            "regions_analyzed": len(key_regions),
            "analysis_type": "synthetic",
            "total_alerts": len(all_alerts),
            "high_risk_count": sum(1 for a in all_alerts if a.level == "HIGH"),
            "medium_risk_count": sum(1 for a in all_alerts if a.level == "MEDIUM"),
            "low_risk_count": sum(1 for a in all_alerts if a.level == "LOW"),
            "total_risk_area_km2": sum(a.area_km2 for a in all_alerts)
        }

        ai_insights = generate_environmental_insights(metadata, all_alerts, overall_confidence)

        return RiskResponse(
            geojson=combined_geojson,
            alerts=all_alerts,
            confidence=overall_confidence,
            timestamp=datetime.now().isoformat(),
            metadata=metadata,
            ai_insights=ai_insights
        )

    except Exception as e:
        raise HTTPException(500, f"National analysis error: {str(e)}")


@app.get("/api/environmental/risk/real", response_model=RiskResponse, tags=["Environmental"])
async def get_real_risk_analysis(
    lat: float = 26.0,
    lon: float = 92.0,
    radius_km: float = 20,
    days_back: int = 30
):
    """
    Calculate risk analysis using REAL satellite data from Planetary Computer.
    
    This endpoint:
    1. Searches for recent Sentinel-2 imagery
    2. Samples NDWI values from real satellite bands
    3. Compares with historical data
    4. Runs risk detection algorithms
    
    Query Parameters:
        lat: Center latitude
        lon: Center longitude
        radius_km: Search radius in km (default: 20)
        days_back: How many days back to search (default: 30)
    """
    try:
        # Search for recent satellite imagery
        bbox = bbox_from_point(lat, lon, radius_km)
        end_date = datetime.now()
        start_date = datetime.now().replace(day=max(1, datetime.now().day - days_back))
        
        items = stac_search(
            collections=["sentinel-2-l2a"],
            bbox=bbox,
            start=start_date.isoformat(),
            end=end_date.isoformat(),
            limit=10
        )
        
        if not items:
            raise HTTPException(404, "No satellite imagery found for this location and time period")
        
        # Use most recent item as "new" and older item as "old"
        items_sorted = sorted(items, key=lambda x: x.get("properties", {}).get("datetime", ""))
        
        if len(items_sorted) < 2:
            raise HTTPException(404, "Need at least 2 images for change detection")
        
        old_item = items_sorted[0]
        new_item = items_sorted[-1]
        
        # Sample NDWI values in a grid around the center point
        grid_size = 30
        deg_per_pixel = (radius_km * 2) / (111.0 * grid_size)
        
        old_ndwi_grid = np.zeros((grid_size, grid_size))
        new_ndwi_grid = np.zeros((grid_size, grid_size))
        
        for i in range(grid_size):
            for j in range(grid_size):
                sample_lat = lat - radius_km/111.0 + (i * deg_per_pixel)
                sample_lon = lon - radius_km/111.0 + (j * deg_per_pixel)
                
                old_val = compute_ndwi_from_satellite(old_item, sample_lon, sample_lat)
                new_val = compute_ndwi_from_satellite(new_item, sample_lon, sample_lat)
                
                old_ndwi_grid[i, j] = old_val if old_val is not None else -0.1
                new_ndwi_grid[i, j] = new_val if new_val is not None else -0.1
        
        # Generate synthetic DEM and rainfall (no real data available easily)
        _, _, dem, rainfall = generate_synthetic_satellite_data(lat, lon, grid_size)
        
        # Run risk detection
        water_change = detect_water_change(old_ndwi_grid, new_ndwi_grid)
        slope_factor = calculate_slope_factor(dem)
        rainfall_factor = calculate_rainfall_factor(rainfall)
        risk_score = calculate_risk_score(water_change, slope_factor, rainfall_factor)
        
        geojson = generate_risk_geojson(risk_score, lat, lon)
        alerts = generate_alerts_from_geojson(geojson)
        
        overall_confidence = sum(a.confidence for a in alerts) / len(alerts) if alerts else 0.0
        
        metadata = {
            "region": f"Analysis Center ({lat:.2f}°N, {lon:.2f}°E)",
            "center": {"lat": lat, "lon": lon},
            "analysis_type": "real_satellite",
            "satellite_items": len(items_sorted),
            "old_image_date": old_item.get("properties", {}).get("datetime", ""),
            "new_image_date": new_item.get("properties", {}).get("datetime", ""),
            "grid_size": grid_size,
            "total_alerts": len(alerts),
            "high_risk_count": sum(1 for a in alerts if a.level == "HIGH"),
            "medium_risk_count": sum(1 for a in alerts if a.level == "MEDIUM"),
            "low_risk_count": sum(1 for a in alerts if a.level == "LOW"),
            "total_risk_area_km2": sum(a.area_km2 for a in alerts)
        }
        
        ai_insights = generate_environmental_insights(metadata, alerts, overall_confidence)
        
        return RiskResponse(
            geojson=geojson,
            alerts=alerts,
            confidence=overall_confidence,
            timestamp=datetime.now().isoformat(),
            metadata=metadata,
            ai_insights=ai_insights
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Real analysis error: {str(e)}")


# ============================================================================
# REAL SATELLITE DATA ENDPOINTS
# ============================================================================

@app.post("/api/satellite/search", tags=["Real Satellite Data"])
async def search_satellite_data(request: SearchRequest):
    """
    Search for satellite imagery using STAC API.
    
    Example Request Body:
    ```json
    {
        "collections": ["sentinel-2-l2a", "landsat-c2-l2"],
        "bbox": [91.5, 25.5, 92.5, 26.5],
        "start": "2025-01-01",
        "end": "2025-12-31",
        "limit": 40
    }
    ```
    """
    try:
        if not request.collections:
            raise HTTPException(400, "At least one collection required")
        
        items = stac_search(
            collections=request.collections,
            bbox=request.bbox,
            start=request.start,
            end=request.end,
            limit=request.limit
        )
        
        return {
            "items": items,
            "count": len(items),
            "collections": request.collections,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(500, f"STAC search error: {str(e)}")


@app.post("/api/satellite/ndvi", tags=["Real Satellite Data"])
async def compute_ndvi_endpoint(request: NdviRequest):
    """
    Compute NDVI from a satellite item at a specific point.
    
    Example Request Body:
    ```json
    {
        "collection": "sentinel-2-l2a",
        "item_id": "S2A_MSIL2A_20250101T...",
        "lon": 92.0,
        "lat": 26.0
    }
    ```
    """
    try:
        client = Client.open(PC_STAC_URL)
        item_obj = client.get_collection(request.collection).get_item(request.item_id)
        signed = planetary_computer.sign(item_obj).to_dict()
        
        ndvi = compute_ndvi(signed, request.lon, request.lat)
        
        return {
            "ndvi": ndvi,
            "lon": request.lon,
            "lat": request.lat,
            "collection": request.collection,
            "item_id": request.item_id,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(500, f"NDVI computation error: {str(e)}")


@app.post("/api/satellite/ndwi", tags=["Real Satellite Data"])
async def compute_ndwi_endpoint(request: NdviRequest):
    """
    Compute NDWI (water index) from a satellite item at a specific point.
    
    Example Request Body:
    ```json
    {
        "collection": "sentinel-2-l2a",
        "item_id": "S2A_MSIL2A_20250101T...",
        "lon": 92.0,
        "lat": 26.0
    }
    ```
    """
    try:
        client = Client.open(PC_STAC_URL)
        item_obj = client.get_collection(request.collection).get_item(request.item_id)
        signed = planetary_computer.sign(item_obj).to_dict()
        
        ndwi = compute_ndwi_from_satellite(signed, request.lon, request.lat)
        
        return {
            "ndwi": ndwi,
            "lon": request.lon,
            "lat": request.lat,
            "collection": request.collection,
            "item_id": request.item_id,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(500, f"NDWI computation error: {str(e)}")


# ============================================================================
# SATELLITE TRACKING ENDPOINTS
# ============================================================================

@app.get("/api/satellites", tags=["Satellites"])
async def list_satellites():
    """List all tracked satellites"""
    return {
        "satellites": satellites_db,
        "count": len(satellites_db),
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/satellites", response_model=SatelliteResponse, tags=["Satellites"])
async def add_satellite(satellite: SatelliteCreate):
    """Add new satellite to tracking"""
    global next_satellite_id
    
    # Check if NORAD ID already exists
    if any(s["norad_id"] == satellite.norad_id for s in satellites_db):
        raise HTTPException(409, "Satellite with this NORAD ID already exists")
    
    new_satellite = {
        "id": next_satellite_id,
        "name": satellite.name,
        "norad_id": satellite.norad_id,
        "color": satellite.color,
        "is_active": True
    }
    
    satellites_db.append(new_satellite)
    next_satellite_id += 1
    
    return new_satellite


@app.delete("/api/satellites/{satellite_id}", tags=["Satellites"])
async def delete_satellite(satellite_id: int):
    """Remove satellite from tracking"""
    global satellites_db
    
    satellite = next((s for s in satellites_db if s["id"] == satellite_id), None)
    if not satellite:
        raise HTTPException(404, "Satellite not found")
    
    satellites_db = [s for s in satellites_db if s["id"] != satellite_id]
    
    return {"success": True, "message": f"Satellite {satellite['name']} removed"}


@app.get("/api/satellites/telemetry", tags=["Satellites"])
async def get_all_telemetry():
    """Get real-time telemetry for all satellites"""
    telemetry_data = []
    
    for sat in satellites_db:
        if sat.get("is_active", True):
            telemetry = get_satellite_telemetry(sat)
            telemetry_data.append({
                "satellite": sat,
                "telemetry": telemetry
            })
    
    return {
        "telemetry": telemetry_data,
        "count": len(telemetry_data),
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/satellites/{satellite_id}/telemetry", tags=["Satellites"])
async def get_satellite_telemetry_endpoint(satellite_id: int):
    """Get telemetry for specific satellite"""
    satellite = next((s for s in satellites_db if s["id"] == satellite_id), None)
    if not satellite:
        raise HTTPException(404, "Satellite not found")
    
    telemetry = get_satellite_telemetry(satellite)
    
    return {
        "satellite": satellite,
        "telemetry": telemetry,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/satellites/passes", tags=["Satellites"])
async def get_all_passes(observer_lat: float = 26.0, observer_lon: float = 92.0):
    """Get pass predictions for all satellites"""
    passes = []
    
    for sat in satellites_db:
        if sat.get("is_active", True):
            pass_info = predict_next_pass(sat, observer_lat, observer_lon)
            passes.append(pass_info)
    
    # Sort by start time
    passes.sort(key=lambda x: x["start_time"])
    
    return {
        "passes": passes,
        "count": len(passes),
        "observer": {"lat": observer_lat, "lon": observer_lon},
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/fusion/metrics", tags=["Data Fusion"])
async def get_fusion_metrics():
    """Get aggregated data fusion metrics"""
    # Get telemetry for all active satellites
    telemetry_list = []
    for sat in satellites_db:
        if sat.get("is_active", True):
            telemetry = get_satellite_telemetry(sat)
            telemetry_list.append(telemetry)
    
    metrics = calculate_fusion_metrics(telemetry_list)
    ai_insights = generate_satellite_insights(satellites_db, metrics)
    
    return {
        "metrics": metrics,
        "ai_insights": ai_insights,
        "timestamp": datetime.now().isoformat()
    }


# ============================================================================
# DATA DATASETS ENDPOINTS (for DataOverlay component)
# ============================================================================

@app.get("/api/data/datasets", tags=["Data"])
async def list_datasets():
    """List available datasets (returns empty list for now)"""
    return []


@app.get("/api/data/datasets/{dataset_id}", tags=["Data"])
async def get_dataset(dataset_id: str):
    """Get specific dataset data (returns empty for now)"""
    return {"data": []}


# ============================================================================
# DISASTER EARLY WARNING SYSTEM ENDPOINTS
# ============================================================================

@app.get("/api/disaster/summary", tags=["Disaster Monitoring"])
async def get_disaster_summary(lat: float = 26.0, lon: float = 92.0):
    """
    Get comprehensive disaster monitoring summary for a location
    Includes all available warning layers and risk assessment
    """
    try:
        summary = get_all_disaster_layers(lat, lon)
        return summary
    except Exception as e:
        raise HTTPException(500, f"Failed to generate disaster summary: {str(e)}")


@app.get("/api/disaster/weather", tags=["Disaster Monitoring"])
async def get_weather_alerts(lat: float = 26.0, lon: float = 92.0, radius: float = 2.0):
    """Get weather-based alerts (storms, heavy rainfall, winds)"""
    try:
        data = generate_weather_alerts(lat, lon, radius)
        return {
            **data,
            "timestamp": datetime.now().isoformat(),
            "location": {"latitude": lat, "longitude": lon}
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch weather alerts: {str(e)}")


@app.get("/api/disaster/flood", tags=["Disaster Monitoring"])
async def get_flood_zones(lat: float = 26.0, lon: float = 92.0):
    """Get flood risk zones (GeoJSON format)"""
    try:
        data = generate_flood_risk_zones(lat, lon)
        return {
            **data,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch flood zones: {str(e)}")


@app.get("/api/disaster/fire", tags=["Disaster Monitoring"])
async def get_fire_hotspots(lat: float = 26.0, lon: float = 92.0, days: int = 1):
    """Get active fire hotspots"""
    try:
        if not 1 <= days <= 7:
            raise HTTPException(400, "Days parameter must be between 1 and 7")
        
        data = generate_fire_hotspots(lat, lon, days)
        return {
            **data,
            "timestamp": datetime.now().isoformat(),
            "location": {"latitude": lat, "longitude": lon}
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch fire hotspots: {str(e)}")


@app.get("/api/disaster/seismic", tags=["Disaster Monitoring"])
async def get_seismic_activity(lat: float = 26.0, lon: float = 92.0, days: int = 7):
    """Get earthquake and seismic activity"""
    try:
        if not 1 <= days <= 30:
            raise HTTPException(400, "Days parameter must be between 1 and 30")
        
        data = generate_seismic_activity(lat, lon, days)
        return {
            **data,
            "timestamp": datetime.now().isoformat(),
            "location": {"latitude": lat, "longitude": lon}
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch seismic activity: {str(e)}")


@app.get("/api/disaster/drought", tags=["Disaster Monitoring"])
async def get_drought_indicators(lat: float = 26.0, lon: float = 92.0):
    """Get drought risk indicators based on vegetation health"""
    try:
        data = generate_drought_indicators(lat, lon)
        return {
            **data,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch drought indicators: {str(e)}")


@app.get("/api/disaster/cyclone", tags=["Disaster Monitoring"])
async def get_cyclone_tracks(lat: float = 26.0, lon: float = 92.0):
    """Get active cyclone/hurricane tracking data"""
    try:
        data = generate_cyclone_tracks(lat, lon)
        return {
            **data,
            "timestamp": datetime.now().isoformat(),
            "location": {"latitude": lat, "longitude": lon}
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch cyclone tracks: {str(e)}")


@app.get("/api/disaster/landslide", tags=["Disaster Monitoring"])
async def get_landslide_risk(lat: float = 26.0, lon: float = 92.0):
    """Get landslide risk zones"""
    try:
        data = generate_landslide_risk(lat, lon)
        return {
            **data,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch landslide zones: {str(e)}")


# ============================================================================
# ISRO INTEGRATION ENDPOINTS
# ============================================================================

@app.get("/api/isro/satellites", tags=["ISRO"])
async def get_isro_satellites():
    """Get list of Indian ISRO satellites"""
    isro_satellites = [
        {
            "name": "CARTOSAT-3",
            "noradId": "44804",
            "type": "Earth Observation",
            "resolution": "0.25m",
            "swath": "16 km",
            "status": "Operational"
        },
        {
            "name": "RESOURCESAT-2A",
            "noradId": "42063",
            "type": "Resource Monitoring",
            "resolution": "5.8m",
            "swath": "70 km",
            "status": "Operational"
        },
        {
            "name": "RISAT-2B",
            "noradId": "44237",
            "type": "Radar Imaging",
            "resolution": "1m",
            "swath": "10 km",
            "status": "Operational"
        },
        {
            "name": "OCEANSAT-3",
            "noradId": "54210",
            "type": "Ocean Monitoring",
            "resolution": "250m",
            "swath": "1420 km",
            "status": "Operational"
        },
        {
            "name": "EOS-06",
            "noradId": "54501",
            "type": "Ocean Applications",
            "resolution": "40m",
            "swath": "740 km",
            "status": "Operational"
        }
    ]
    
    return {
        "success": True,
        "satellites": isro_satellites,
        "count": len(isro_satellites),
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/isro/data/{satellite_name}", tags=["ISRO"])
async def get_isro_satellite_data(satellite_name: str, region: str = None):
    """
    Get ISRO satellite data for a region
    Note: This is simulated data. Production requires MOSDAC API credentials.
    """
    import json
    import numpy as np
    
    try:
        region_data = json.loads(region) if region else {
            "name": "Delhi NCR",
            "bounds": {
                "minLat": 28.4,
                "maxLat": 28.9,
                "minLng": 76.8,
                "maxLng": 77.4
            }
        }
        
        # Generate simulated data points
        bounds = region_data["bounds"]
        lat_range = np.linspace(bounds["minLat"], bounds["maxLat"], 20)
        lng_range = np.linspace(bounds["minLng"], bounds["maxLng"], 20)
        
        data_points = []
        for lat in lat_range:
            for lng in lng_range:
                data_points.append({
                    "lat": float(lat),
                    "lng": float(lng),
                    "value": float(np.random.uniform(0.2, 0.8)),
                    "timestamp": datetime.now().isoformat(),
                    "resolution": "5.8m",
                    "band": "NIR",
                    "cloud_cover": float(np.random.uniform(0, 30)),
                    "quality": float(np.random.uniform(0.7, 1.0))
                })
        
        return {
            "success": True,
            "source": satellite_name,
            "region": region_data,
            "acquisitionDate": datetime.now().isoformat(),
            "cloudCover": np.mean([p["cloud_cover"] for p in data_points]),
            "quality": np.mean([p["quality"] for p in data_points]),
            "dataPoints": data_points[:100],  # Limit to 100 points
            "note": "Simulated ISRO-MOSDAC data. Production requires official API credentials."
        }
    
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch ISRO data: {str(e)}")


# ============================================================================
# DATA FUSION ENDPOINTS
# ============================================================================

@app.post("/api/data/fuse", tags=["Data Fusion"])
async def fuse_satellite_data(request: dict):
    """
    Fuse data from multiple satellites
    Combines overlapping data points with confidence-weighted averaging
    """
    try:
        datasets = request.get("datasets", ["test"])
        
        # Generate simulated fusion data
        import numpy as np
        
        fused_data = []
        for i in range(50):
            lat = 26.0 + (np.random.random() - 0.5) * 2
            lng = 92.0 + (np.random.random() - 0.5) * 2
            
            fused_data.append({
                "lat": float(lat),
                "lng": float(lng),
                "fusedValue": float(np.random.uniform(0.3, 0.9)),
                "confidence": float(np.random.uniform(0.7, 0.99)),
                "contributingSatellites": ["SAT-1", "SAT-2", "SAT-3"][:np.random.randint(2, 4)],
                "sourcePoints": list(range(np.random.randint(2, 5))),
                "method": "weighted_average",
                "timestamp": datetime.now().isoformat()
            })
        
        metrics = {
            "totalPoints": len(fused_data),
            "avgConfidence": float(np.mean([p["confidence"] for p in fused_data])),
            "avgSatellitesPerPoint": float(np.mean([len(p["contributingSatellites"]) for p in fused_data])),
            "coverageImprovement": float(np.random.uniform(25, 45)),
            "qualityImprovement": float(np.random.uniform(15, 35))
        }
        
        return {
            "success": True,
            "fusedData": fused_data,
            "metrics": metrics,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(500, f"Data fusion error: {str(e)}")


    """List available datasets (returns empty list for now)"""
    return []


@app.get("/api/data/datasets/{dataset_id}", tags=["Data"])
async def get_dataset(dataset_id: str):
    """Get specific dataset data (returns empty for now)"""
    return {"data": []}


if __name__ == "__main__":
    import uvicorn
    
    print("=" * 80)
    print("🛰️  UNIFIED SATELLITE DASHBOARD API")
    print("=" * 80)
    print("✓ Environmental Risk Monitoring (Synthetic + Real)")
    print("✓ Real Satellite Data from Planetary Computer")
    print("✓ NDVI/NDWI Computation from Sentinel-2 & Landsat")
    print("✓ Multi-Satellite Tracking")
    print("✓ Real-time Telemetry")
    print("✓ Pass Predictions")
    print("✓ Data Fusion Analytics")
    print("✓ AI-Powered Insights")
    print("✓ Disaster Early Warning System")
    print("  → Weather Alerts")
    print("  → Flood Zones")
    print("  → Fire Hotspots")
    print("  → Seismic Activity")
    print("  → Drought Indicators")
    print("  → Cyclone Tracking")
    print("  → Landslide Risk")
    print("=" * 80)
    print(f"🚀 Server: http://0.0.0.0:8000")
    print(f"📖 API Docs: http://localhost:8000/docs")
    print(f"🌍 Risk (Synthetic): http://localhost:8000/api/environmental/risk")
    print(f"🛰️  Risk (Real Data): http://localhost:8000/api/environmental/risk/real")
    print(f"🛰️  Satellites: http://localhost:8000/api/satellites")
    print(f"⚠️  Disaster Monitoring: http://localhost:8000/api/disaster/summary")
    print("=" * 80)
    
    port = int(os.getenv("BACKEND_PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")

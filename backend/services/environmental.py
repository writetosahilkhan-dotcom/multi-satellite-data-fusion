"""
Environmental analysis service - NDWI, DEM, and risk detection algorithms
Merged from jaymit copy project
"""
import numpy as np
from typing import Tuple
from scipy.ndimage import maximum_filter
from skimage import measure
from shapely.geometry import Polygon, mapping


def generate_synthetic_satellite_data(lat_center: float = 26.0,
                                      lon_center: float = 92.0,
                                      grid_size: int = 50) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Generate synthetic satellite data for demo purposes"""
    np.random.seed(42)
    
    x = np.linspace(0, grid_size-1, grid_size)
    y = np.linspace(0, grid_size-1, grid_size)
    xx, yy = np.meshgrid(x, y)
    
    # OLD NDWI (Past water conditions)
    river_mask_old = np.abs(yy - xx * 0.8) < 5
    old_ndwi = np.random.uniform(-0.3, 0.2, (grid_size, grid_size))
    old_ndwi[river_mask_old] = np.random.uniform(0.3, 0.6, np.sum(river_mask_old))
    
    # NEW NDWI (Current water conditions - expanded)
    new_ndwi = old_ndwi.copy()
    river_mask_new = np.abs(yy - xx * 0.8) < 8
    new_ndwi[river_mask_new] = np.random.uniform(0.35, 0.7, np.sum(river_mask_new))
    
    # Add water patches (flood simulation)
    for _ in range(3):
        cx, cy = np.random.randint(10, grid_size-10, 2)
        dist = np.sqrt((xx - cx)**2 + (yy - cy)**2)
        water_patch = dist < 4
        new_ndwi[water_patch] = np.random.uniform(0.4, 0.7, np.sum(water_patch))
    
    # DEM (Digital Elevation Model)
    dem = 100 + 50 * (np.abs(yy - xx * 0.8) / 10)
    dem += np.random.uniform(-5, 5, (grid_size, grid_size))
    
    # Add mountainous regions
    mountain_regions = [(10, 10), (40, 40), (25, 35)]
    for my, mx in mountain_regions:
        dist = np.sqrt((xx - mx)**2 + (yy - my)**2)
        dem += 80 * np.exp(-dist / 8)
    
    # RAINFALL
    rainfall = np.random.uniform(50, 150, (grid_size, grid_size))
    monsoon_centers = [(15, 20), (35, 40), (25, 30)]
    for cy, cx in monsoon_centers:
        dist = np.sqrt((xx - cx)**2 + (yy - cy)**2)
        rainfall += 100 * np.exp(-dist / 5)
    rainfall = np.clip(rainfall, 0, 500)
    
    return old_ndwi, new_ndwi, dem, rainfall


def detect_water_change(old_ndwi: np.ndarray, new_ndwi: np.ndarray, threshold: float = 0.2) -> np.ndarray:
    """Detect areas where water has expanded"""
    change = new_ndwi - old_ndwi
    water_expansion = (change > threshold) & (new_ndwi > 0.3)
    return water_expansion


def calculate_slope_factor(dem: np.ndarray, cell_size: float = 30.0) -> np.ndarray:
    """Calculate slope risk factor from DEM"""
    grad_y, grad_x = np.gradient(dem, cell_size)
    slope_radians = np.arctan(np.sqrt(grad_x**2 + grad_y**2))
    slope_degrees = np.degrees(slope_radians)
    
    slope_factor = np.zeros_like(slope_degrees)
    mask = slope_degrees <= 5
    slope_factor[mask] = slope_degrees[mask]
    mask = (slope_degrees > 5) & (slope_degrees <= 15)
    slope_factor[mask] = 5 + (slope_degrees[mask] - 5)
    mask = (slope_degrees > 15) & (slope_degrees <= 30)
    slope_factor[mask] = 15 + ((slope_degrees[mask] - 15) * 0.67)
    slope_factor[slope_degrees > 30] = 25
    
    return slope_factor


def calculate_rainfall_factor(rainfall: np.ndarray) -> np.ndarray:
    """Convert rainfall to risk factor"""
    rainfall_factor = np.zeros_like(rainfall)
    
    mask = rainfall <= 50
    rainfall_factor[mask] = (rainfall[mask] / 50) * 3
    mask = (rainfall > 50) & (rainfall <= 150)
    rainfall_factor[mask] = 3 + ((rainfall[mask] - 50) / 100) * 5
    mask = (rainfall > 150) & (rainfall <= 300)
    rainfall_factor[mask] = 8 + ((rainfall[mask] - 150) / 150) * 4
    mask = rainfall > 300
    rainfall_factor[mask] = np.minimum(12 + (rainfall[mask] - 300) / 100, 15)
    
    return np.clip(rainfall_factor, 0, 15)


def calculate_risk_score(water_change: np.ndarray, slope_factor: np.ndarray, rainfall_factor: np.ndarray) -> np.ndarray:
    """Combine factors into unified risk score"""
    risk_score = np.zeros_like(water_change, dtype=float)
    risk_score[water_change] = 50
    risk_score[water_change] += slope_factor[water_change]
    risk_score[water_change] += rainfall_factor[water_change]
    
    proximity = maximum_filter(water_change.astype(float), size=3)
    proximity_bonus = (proximity - water_change.astype(float)) * 10
    risk_score += proximity_bonus
    
    return np.clip(risk_score, 0, 100)


def generate_risk_geojson(risk_score: np.ndarray, lat_center: float = 26.0, lon_center: float = 92.0) -> dict:
    """Convert risk score grid to GeoJSON polygons"""
    features = []
    
    risk_levels = [
        (80, 100, "HIGH", "#ef4444"),
        (60, 80, "MEDIUM", "#f97316"),
        (40, 60, "LOW", "#fbbf24")
    ]
    
    grid_size = risk_score.shape[0]
    km_per_pixel = 1.0
    deg_per_pixel = km_per_pixel / 111.0
    
    for min_risk, max_risk, level, color in risk_levels:
        mask = (risk_score >= min_risk) & (risk_score < max_risk)
        
        if not mask.any():
            continue
        
        labeled = measure.label(mask, connectivity=2)
        regions = measure.regionprops(labeled)
        
        for region in regions:
            if region.area < 3:
                continue
            
            minr, minc, maxr, maxc = region.bbox
            
            lat_max = lat_center - (minr * deg_per_pixel)
            lat_min = lat_center - (maxr * deg_per_pixel)
            lon_min = lon_center + (minc * deg_per_pixel)
            lon_max = lon_center + (maxc * deg_per_pixel)
            
            polygon = Polygon([
                [lon_min, lat_min],
                [lon_max, lat_min],
                [lon_max, lat_max],
                [lon_min, lat_max],
                [lon_min, lat_min]
            ])
            
            region_mask = labeled == region.label
            avg_risk = risk_score[region_mask].mean()
            area_km2 = region.area * (km_per_pixel ** 2)
            center_lat = (lat_min + lat_max) / 2
            center_lon = (lon_min + lon_max) / 2
            
            feature = {
                "type": "Feature",
                "geometry": mapping(polygon),
                "properties": {
                    "risk_level": level,
                    "risk_score": float(avg_risk),
                    "area_km2": float(area_km2),
                    "color": color,
                    "center_lat": float(center_lat),
                    "center_lon": float(center_lon)
                }
            }
            features.append(feature)
    
    return {
        "type": "FeatureCollection",
        "features": features
    }

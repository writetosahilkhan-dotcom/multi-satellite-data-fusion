"""
Database models for satellite tracking and environmental monitoring
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Boolean
from datetime import datetime
from .database import Base


class Satellite(Base):
    """Satellite tracking information"""
    __tablename__ = "satellites"
    
    id = Column(Integer, primary_key=True, index=True)
    norad_id = Column(Integer, unique=True, index=True)
    name = Column(String, index=True)
    color = Column(String, default="#00f0ff")
    is_active = Column(Boolean, default=True)
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    # Orbital parameters
    altitude_km = Column(Float)
    velocity_kmh = Column(Float)
    latitude = Column(Float)
    longitude = Column(Float)
    
    # Additional metadata
    metadata = Column(JSON)


class EnvironmentalAlert(Base):
    """Environmental risk alerts from satellite analysis"""
    __tablename__ = "environmental_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String, unique=True, index=True)
    level = Column(String)  # HIGH, MEDIUM, LOW
    title = Column(String)
    description = Column(String)
    area_km2 = Column(Float)
    confidence = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Location
    latitude = Column(Float)
    longitude = Column(Float)
    
    # GeoJSON data
    geojson = Column(JSON)
    
    # AI insights
    ai_insights = Column(JSON, nullable=True)


class SatellitePass(Base):
    """Satellite pass predictions"""
    __tablename__ = "satellite_passes"
    
    id = Column(Integer, primary_key=True, index=True)
    satellite_id = Column(Integer, index=True)
    satellite_name = Column(String)
    
    # Pass timing
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    duration_seconds = Column(Integer)
    
    # Pass quality
    max_elevation = Column(Float)
    visibility = Column(String)  # Excellent, Good, Fair, Poor
    
    # Observer location
    observer_lat = Column(Float)
    observer_lon = Column(Float)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class DataFusionMetrics(Base):
    """Aggregated metrics from multiple data sources"""
    __tablename__ = "fusion_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Coverage metrics
    total_coverage_area_km2 = Column(Float)
    average_altitude_km = Column(Float)
    average_velocity_kmh = Column(Float)
    
    # Data quality
    fusion_accuracy = Column(Float)
    data_throughput_mbps = Column(Float)
    
    # Active satellites
    active_satellites_count = Column(Integer)
    
    # Additional metrics
    metrics_data = Column(JSON)

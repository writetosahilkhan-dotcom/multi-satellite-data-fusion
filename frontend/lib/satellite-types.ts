export interface Satellite {
  id: string
  name: string
  noradId: string
  color: string
  orbitOffset: number
  altitude: number
  velocity: number
  launchDate: string
  inclination: number
  period: number
  geostationary?: boolean
  fixedLng?: number
}

export interface SatellitePosition {
  lat: number
  lng: number
  altitude: number
  velocity: number
  timestamp: number
}

export interface TelemetryData {
  position: SatellitePosition
  orbitalPeriod: number
  inclination: number
  eccentricity: number
  apogee: number
  perigee: number
  passes: PassPrediction[]
}

export interface PassPrediction {
  startTime: string
  endTime: string
  maxElevation: number
  direction: string
}

export interface RiskAlert {
  id: string
  type: "high" | "medium" | "low"
  title: string
  description: string
  lat: number
  lng: number
  timestamp: string
}

export interface RiskStats {
  high: number
  medium: number
  low: number
  total: number
}

export interface ISROSatellite {
  name: string
  resolution: string
  swath: string
  cloudCover: number
  quality: number
  status: "active" | "degraded" | "inactive"
  dataPoints: number
}

export interface FusionMetrics {
  totalPoints: number
  avgConfidence: number
  coverageImprovement: number
  contributingSatellites: { name: string; points: number; confidence: number }[]
  qualityHistory: { time: string; quality: number }[]
  confidenceDistribution: { range: string; count: number }[]
}

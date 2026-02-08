import type {
  Satellite,
  SatellitePosition,
  TelemetryData,
  RiskAlert,
  RiskStats,
  ISROSatellite,
  FusionMetrics,
  PassPrediction,
} from "./satellite-types"

// ── Indian Ground Stations (ISTRAC / NRSC / SDSC) ──────────────────────
export const INDIAN_GROUND_STATIONS: {
  name: string
  city: string
  lat: number
  lng: number
  type: "primary" | "launch" | "data"
}[] = [
  { name: "ISTRAC Bangalore", city: "Bangalore, KA", lat: 12.97, lng: 77.59, type: "primary" },
  { name: "ISTRAC Hassan", city: "Hassan, KA", lat: 13.0, lng: 76.1, type: "primary" },
  { name: "ISTRAC Bhopal", city: "Bhopal, MP", lat: 23.26, lng: 77.41, type: "primary" },
  { name: "ISTRAC Lucknow", city: "Lucknow, UP", lat: 26.85, lng: 80.95, type: "primary" },
  { name: "ISTRAC Port Blair", city: "Port Blair, A&N", lat: 11.67, lng: 92.73, type: "primary" },
  { name: "ISTRAC Trivandrum", city: "Trivandrum, KL", lat: 8.52, lng: 76.94, type: "primary" },
  { name: "NRSC Shadnagar", city: "Shadnagar, TS", lat: 17.04, lng: 78.2, type: "data" },
  { name: "SDSC SHAR", city: "Sriharikota, AP", lat: 13.72, lng: 80.23, type: "launch" },
  { name: "MCF Hassan", city: "Hassan, KA", lat: 13.0, lng: 76.1, type: "data" },
  { name: "VSSC Thumba", city: "Thumba, KL", lat: 8.53, lng: 76.87, type: "launch" },
]

// ── Indian Regions for Environmental Monitoring ─────────────────────────
export const INDIAN_REGIONS = [
  { name: "Sundarbans", state: "West Bengal", lat: 21.94, lng: 88.9, type: "mangrove" },
  { name: "Western Ghats", state: "Kerala / Karnataka", lat: 11.5, lng: 76.0, type: "forest" },
  { name: "Thar Desert", state: "Rajasthan", lat: 27.0, lng: 71.0, type: "desert" },
  { name: "Chilika Lake", state: "Odisha", lat: 19.72, lng: 85.32, type: "wetland" },
  { name: "Indo-Gangetic Plain", state: "UP / Bihar", lat: 26.5, lng: 82.0, type: "agriculture" },
  { name: "Brahmaputra Basin", state: "Assam", lat: 26.2, lng: 91.7, type: "flood-zone" },
  { name: "Rann of Kutch", state: "Gujarat", lat: 23.7, lng: 69.8, type: "salt-marsh" },
  { name: "Yamuna Floodplain", state: "Delhi / UP", lat: 28.6, lng: 77.2, type: "river" },
  { name: "Cauvery Delta", state: "Tamil Nadu", lat: 10.8, lng: 79.8, type: "agriculture" },
  { name: "Loktak Lake", state: "Manipur", lat: 24.55, lng: 93.8, type: "wetland" },
]

// ── Indian Cities for Map Labels ────────────────────────────────────────
export const INDIAN_CITIES = [
  { name: "New Delhi", lat: 28.61, lng: 77.23 },
  { name: "Mumbai", lat: 19.08, lng: 72.88 },
  { name: "Chennai", lat: 13.08, lng: 80.27 },
  { name: "Kolkata", lat: 22.57, lng: 88.36 },
  { name: "Bangalore", lat: 12.97, lng: 77.59 },
  { name: "Hyderabad", lat: 17.38, lng: 78.49 },
  { name: "Ahmedabad", lat: 23.02, lng: 72.57 },
  { name: "Srinagar", lat: 34.08, lng: 74.8 },
  { name: "Guwahati", lat: 26.14, lng: 91.74 },
  { name: "Thiruvananthapuram", lat: 8.52, lng: 76.94 },
]

// ── Default Risk Alerts (always visible on map) ─────────────────────────
export const DEFAULT_RISK_ZONES: { lat: number; lng: number; radius: number; severity: string }[] = [
  { lat: 21.94, lng: 88.9, radius: 25, severity: "high" },
  { lat: 28.61, lng: 77.23, radius: 30, severity: "high" },
  { lat: 27.47, lng: 94.91, radius: 28, severity: "high" },
  { lat: 12.42, lng: 75.74, radius: 22, severity: "medium" },
  { lat: 28.65, lng: 77.25, radius: 18, severity: "medium" },
  { lat: 19.72, lng: 85.32, radius: 20, severity: "medium" },
  { lat: 26.29, lng: 73.02, radius: 15, severity: "low" },
  { lat: 10.79, lng: 79.14, radius: 12, severity: "low" },
  { lat: 19.13, lng: 72.83, radius: 18, severity: "medium" },
  { lat: 24.55, lng: 93.8, radius: 14, severity: "low" },
]

// ── Default Satellites (all ISRO / India-focused) ───────────────────────
export const DEFAULT_SATELLITES: Satellite[] = [
  {
    id: "insat-3d",
    name: "INSAT-3D",
    noradId: "39216",
    color: "#F59E0B",
    orbitOffset: 0,
    altitude: 35786,
    velocity: 3.07,
    launchDate: "2013-07-26",
    inclination: 0.04,
    period: 1436.1,
    geostationary: true,
    fixedLng: 82.0,
  },
  {
    id: "gsat-30",
    name: "GSAT-30",
    noradId: "45026",
    color: "#10B981",
    orbitOffset: 0,
    altitude: 35786,
    velocity: 3.07,
    launchDate: "2020-01-17",
    inclination: 0.02,
    period: 1436.1,
    geostationary: true,
    fixedLng: 83.0,
  },
  {
    id: "cartosat-3",
    name: "CARTOSAT-3",
    noradId: "44804",
    color: "#06B6D4",
    orbitOffset: 0,
    altitude: 509,
    velocity: 7.61,
    launchDate: "2019-11-27",
    inclination: 97.5,
    period: 94.72,
  },
  {
    id: "eos-06",
    name: "EOS-06",
    noradId: "54361",
    color: "#8B5CF6",
    orbitOffset: 2800,
    altitude: 720,
    velocity: 7.45,
    launchDate: "2022-11-26",
    inclination: 98.3,
    period: 99.31,
  },
  {
    id: "risat-2b",
    name: "RISAT-2B",
    noradId: "44233",
    color: "#EC4899",
    orbitOffset: 5500,
    altitude: 555,
    velocity: 7.59,
    launchDate: "2019-05-22",
    inclination: 37.0,
    period: 95.76,
  },
  {
    id: "resourcesat-2a",
    name: "RESOURCESAT-2A",
    noradId: "41877",
    color: "#F97316",
    orbitOffset: 8000,
    altitude: 817,
    velocity: 7.45,
    launchDate: "2016-12-07",
    inclination: 98.7,
    period: 101.35,
  },
]

// ── Position Calculation with Caching ───────────────────────────────────
const positionCache = new Map<string, { pos: SatellitePosition; timestamp: number }>()
const CACHE_TTL = 500 // Cache for 500ms

export function calculatePosition(
  timestamp: number,
  offset: number,
  altitude: number,
  geostationary?: boolean,
  fixedLng?: number,
): SatellitePosition {
  // Check cache first for performance
  const cacheKey = `${timestamp}_${offset}_${altitude}_${geostationary}_${fixedLng}`
  const cached = positionCache.get(cacheKey)
  if (cached && timestamp - cached.timestamp < CACHE_TTL) {
    return cached.pos
  }

  let pos: SatellitePosition

  // Geostationary: hover over fixed longitude with tiny oscillation
  if (geostationary && fixedLng !== undefined) {
    const t = timestamp / 80000
    pos = {
      lat: Math.sin(t) * 0.12,
      lng: fixedLng + Math.cos(t * 0.7) * 0.08,
      altitude,
      velocity: 3.07,
      timestamp,
    }
    positionCache.set(cacheKey, { pos, timestamp })
    return pos
  }

  // LEO / sun-synchronous ground track centered on India
  const periodSec = altitude < 1000 ? 95 * 60 : altitude < 5000 ? 200 * 60 : 720 * 60
  const periodMs = periodSec * 1000
  const t = (timestamp + offset * 1000) / 1000 // seconds

  // Phase angle within current orbit (0 to 2pi)
  const phase = ((t % periodSec) / periodSec) * 2 * Math.PI

  // Inclination determines the max latitude the satellite reaches
  // For ISRO sun-sync sats this is ~97-98 degrees, meaning they go pole-to-pole
  const inc = altitude < 1000 ? 97.5 : 55
  const incRad = (inc * Math.PI) / 180

  // Latitude: sinusoidal oscillation capped by inclination
  const lat = Math.asin(Math.sin(incRad) * Math.sin(phase)) * (180 / Math.PI)

  // Longitude: Earth rotates ~23.75 degrees per 95-min orbit
  // We center the ascending node at 78E (India) and let it drift slowly
  const orbitCount = Math.floor((timestamp + offset * 1000) / periodMs)
  const earthRotPerOrbit = (periodSec / 86400) * 360 // degrees Earth rotates per orbit

  // Ascending node starts at 78E and regresses each orbit
  const ascNode = 78 - (orbitCount * earthRotPerOrbit) % 360

  // Longitude from argument of latitude
  const argLatRad = Math.atan2(Math.cos(incRad) * Math.sin(phase), Math.cos(phase))
  let lng = ascNode + argLatRad * (180 / Math.PI)

  // Normalize to [-180, 180]
  lng = ((lng % 360) + 540) % 360 - 180

  const velocity = altitude < 1000 ? 7.66 : altitude < 5000 ? 5.5 : 3.87
  pos = { lat, lng, altitude, velocity, timestamp }
  
  // Cache the result
  positionCache.set(cacheKey, { pos, timestamp })
  
  // Clean old cache entries periodically
  if (positionCache.size > 100) {
    const oldestAllowed = timestamp - CACHE_TTL * 2
    for (const [key, value] of positionCache.entries()) {
      if (value.timestamp < oldestAllowed) {
        positionCache.delete(key)
      }
    }
  }
  
  return pos
}

// ── Telemetry ───────────────────────────────────────────────────────────
export function generateTelemetry(satellite: Satellite): TelemetryData {
  const now = Date.now()
  const pos = calculatePosition(now, satellite.orbitOffset, satellite.altitude, satellite.geostationary, satellite.fixedLng)
  const stations = ["ISTRAC Bangalore", "Hassan", "Bhopal", "Lucknow", "Port Blair", "Shadnagar"]
  const passes: PassPrediction[] = stations.map((gs, i) => {
    const h = 1 + i * 3 + Math.floor(Math.random() * 2)
    const m = Math.floor(Math.random() * 60)
    const dur = 4 + Math.floor(Math.random() * 12)
    const em = m + dur
    return {
      startTime: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} IST`,
      endTime: `${String(h + (em >= 60 ? 1 : 0)).padStart(2, "0")}:${String(em % 60).padStart(2, "0")} IST`,
      maxElevation: 12 + Math.floor(Math.random() * 75),
      direction: gs,
    }
  })
  return {
    position: pos,
    orbitalPeriod: satellite.period,
    inclination: satellite.inclination,
    eccentricity: 0.0001 + Math.random() * 0.005,
    apogee: satellite.altitude + Math.floor(Math.random() * 10),
    perigee: satellite.altitude - Math.floor(Math.random() * 10),
    passes,
  }
}

// ── India-specific Risk Alerts ──────────────────────────────────────────
export function generateRiskAlerts(): RiskAlert[] {
  const alerts: Omit<RiskAlert, "id" | "timestamp">[] = [
    { type: "high", title: "Sundarbans Mangrove Loss", description: "CARTOSAT-3 detected 12.4 sq km mangrove degradation in South 24 Parganas, West Bengal. NDWI confirms sea-level intrusion.", lat: 21.94, lng: 88.9 },
    { type: "high", title: "Delhi NCR Air Quality Critical", description: "INSAT-3D thermal + RESOURCESAT-2A AOD fusion: PM2.5 at 380 ug/m3 across Delhi-NCR. Stubble burning active in Punjab-Haryana.", lat: 28.61, lng: 77.23 },
    { type: "high", title: "Brahmaputra Flood Risk", description: "EOS-06 water extent mapping: Brahmaputra at 94% capacity near Dibrugarh, Assam. 3 districts on high alert.", lat: 27.47, lng: 94.91 },
    { type: "medium", title: "Western Ghats Deforestation", description: "RESOURCESAT-2A LISS-IV: 8.7 sq km forest cover loss in Kodagu, Karnataka. NDVI drop of 0.18.", lat: 12.42, lng: 75.74 },
    { type: "medium", title: "Yamuna Pollution Surge", description: "EOS-06 OCM sensor: elevated turbidity and chlorophyll-a in Yamuna between Wazirabad-Okhla barrage.", lat: 28.65, lng: 77.25 },
    { type: "medium", title: "Chilika Lake Eutrophication", description: "RESOURCESAT-2A multispectral: algal bloom covering 23% of Chilika Lake surface, Odisha.", lat: 19.72, lng: 85.32 },
    { type: "low", title: "Thar Desert Expansion", description: "RISAT-2B SAR: 2.3 km northward desert encroachment near Jodhpur, Rajasthan.", lat: 26.29, lng: 73.02 },
    { type: "low", title: "Cauvery Delta Soil Salinity", description: "CARTOSAT-3 + RESOURCESAT-2A fusion: increasing soil salinity in Thanjavur, Tamil Nadu.", lat: 10.79, lng: 79.14 },
    { type: "medium", title: "Mumbai Coastal Erosion", description: "CARTOSAT-3 shoreline analysis: 4.2 m/year erosion at Versova-Juhu coast, Mumbai.", lat: 19.13, lng: 72.83 },
    { type: "low", title: "Loktak Lake Shrinkage", description: "EOS-06 water body monitoring: 7% reduction in Loktak Lake area, Manipur.", lat: 24.55, lng: 93.8 },
  ]
  return alerts.map((a, i) => ({ ...a, id: `risk-${i}`, timestamp: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString() }))
}

export function generateRiskStats(): RiskStats {
  return { high: 3, medium: 4, low: 3, total: 10 }
}

// ── ISRO Satellite Catalogue ────────────────────────────────────────────
export const ISRO_SATELLITES: ISROSatellite[] = [
  { name: "CARTOSAT-3", resolution: "0.25m PAN", swath: "16 km", cloudCover: 12, quality: 94, status: "active", dataPoints: 1247 },
  { name: "RESOURCESAT-2A", resolution: "5.8m LISS-IV", swath: "70 km", cloudCover: 18, quality: 88, status: "active", dataPoints: 2831 },
  { name: "RISAT-2B", resolution: "0.35m X-SAR", swath: "5 km Spotlight", cloudCover: 0, quality: 91, status: "active", dataPoints: 956 },
  { name: "EOS-06", resolution: "360m OCM-3", swath: "1400 km", cloudCover: 24, quality: 85, status: "active", dataPoints: 3142 },
  { name: "INSAT-3D", resolution: "1km Visible", swath: "Full Disk", cloudCover: 8, quality: 92, status: "active", dataPoints: 18760 },
  { name: "GSAT-30", resolution: "N/A (Comms)", swath: "Indian Subcontinent", cloudCover: 0, quality: 97, status: "active", dataPoints: 4520 },
]

export function generateFusionMetrics(): FusionMetrics {
  return {
    totalPoints: 8742 + Math.floor(Math.random() * 1000),
    avgConfidence: 0.82 + Math.random() * 0.12,
    coverageImprovement: 34 + Math.floor(Math.random() * 20),
    contributingSatellites: [
      { name: "INSAT-3D", points: 4341, confidence: 0.87 },
      { name: "CARTOSAT-3", points: 1247, confidence: 0.94 },
      { name: "RESOURCESAT-2A", points: 2831, confidence: 0.88 },
      { name: "EOS-06", points: 3142, confidence: 0.85 },
      { name: "RISAT-2B", points: 956, confidence: 0.91 },
    ],
    qualityHistory: Array.from({ length: 12 }, (_, i) => ({
      time: `${String(i * 2).padStart(2, "0")}:00`,
      quality: 70 + Math.floor(Math.random() * 25),
    })),
    confidenceDistribution: [
      { range: "0.0-0.2", count: 12 },
      { range: "0.2-0.4", count: 45 },
      { range: "0.4-0.6", count: 128 },
      { range: "0.6-0.8", count: 342 },
      { range: "0.8-1.0", count: 567 },
    ],
  }
}

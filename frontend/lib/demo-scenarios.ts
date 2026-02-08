/**
 * Demo Scenarios for Hackathon Presentations
 * Simulates real disaster events with compelling narratives
 */

export interface ScenarioStep {
  time: number // seconds from start
  title: string
  description: string
  action: 'satellite_move' | 'risk_increase' | 'alert' | 'stats_update' | 'zoom' | 'highlight'
  data?: any
}

export interface DemoScenario {
  id: string
  name: string
  description: string
  duration: number // total seconds
  location: { lat: number; lng: number; zoom: number }
  steps: ScenarioStep[]
}

// Kerala Flood Scenario - June 2018 (Real historical event)
export const KERALA_FLOOD_SCENARIO: DemoScenario = {
  id: 'kerala-flood-2018',
  name: 'Kerala Flood Detection - June 2018',
  description: 'Real-time detection of catastrophic flooding in Kerala, India',
  duration: 45, // 45 seconds
  location: { lat: 10.8505, lng: 76.2711, zoom: 9 }, // Kerala, India
  steps: [
    {
      time: 0,
      title: 'Normal Conditions',
      description: 'Kerala region under normal monitoring - June 5, 2018',
      action: 'zoom',
      data: { message: '🌍 Satellite monitoring active', type: 'info' }
    },
    {
      time: 3,
      title: 'Early Detection',
      description: 'NDWI sensors detect increased water content',
      action: 'stats_update',
      data: {
        ndwi: 0.45,
        message: '📊 Water content rising: NDWI +15%',
        type: 'warning'
      }
    },
    {
      time: 7,
      title: 'Pattern Recognition',
      description: 'AI identifies unusual rainfall patterns',
      action: 'alert',
      data: {
        severity: 'medium',
        message: '⚠️ AI Alert: Abnormal precipitation detected',
        details: 'Rainfall 300% above average'
      }
    },
    {
      time: 12,
      title: 'Risk Zone Formation',
      description: 'High-risk flood zones identified',
      action: 'risk_increase',
      data: {
        riskLevel: 'high',
        message: '🔴 HIGH RISK: 3 districts affected',
        zones: 3,
        population: 125000
      }
    },
    {
      time: 18,
      title: 'Rapid Escalation',
      description: 'Water levels rising rapidly across region',
      action: 'stats_update',
      data: {
        ndwi: 0.78,
        message: '🌊 Critical: Water coverage +150%',
        type: 'danger',
        affectedArea: '450 km²'
      }
    },
    {
      time: 24,
      title: 'Multiple Alert Zones',
      description: 'Flooding spreading to adjacent districts',
      action: 'alert',
      data: {
        severity: 'critical',
        message: '🚨 CRITICAL ALERT: Expand to 8 districts',
        details: '500,000+ people in flood zones',
        zones: 8
      }
    },
    {
      time: 30,
      title: 'Emergency Response',
      description: 'Disaster response teams activated',
      action: 'highlight',
      data: {
        message: '🚁 Emergency: Evacuation recommended',
        evacuationZones: 8,
        shelters: 45,
        responders: 2500
      }
    },
    {
      time: 36,
      title: 'Peak Detection',
      description: 'Maximum flood extent mapped',
      action: 'stats_update',
      data: {
        ndwi: 0.92,
        message: '🔴 EXTREME: 1,200 km² flooded',
        type: 'danger',
        population: 1200000,
        alerts: 15
      }
    },
    {
      time: 42,
      title: 'Impact Assessment',
      description: 'Real-time damage assessment complete',
      action: 'alert',
      data: {
        severity: 'critical',
        message: '📊 Impact: 1.2M people affected',
        details: 'Early warning gave 24-hour advance notice',
        saved: '50,000+ lives potentially saved'
      }
    }
  ]
}

// Cyclone Scenario
export const CYCLONE_SCENARIO: DemoScenario = {
  id: 'cyclone-fani-2019',
  name: 'Cyclone Fani Track - May 2019',
  description: 'Category 4 cyclone tracking and early warning',
  duration: 40,
  location: { lat: 19.0760, lng: 84.8540, zoom: 6 }, // Odisha coast
  steps: [
    {
      time: 0,
      title: 'Formation Detection',
      description: 'Low pressure system detected in Bay of Bengal',
      action: 'zoom',
      data: { message: '🌀 Cyclone formation detected', type: 'info' }
    },
    {
      time: 5,
      title: 'Intensification',
      description: 'System strengthening to cyclonic storm',
      action: 'alert',
      data: {
        severity: 'medium',
        message: '⚠️ Cyclone FANI: Wind speed 80 km/h',
        details: 'Expected landfall in 48 hours'
      }
    },
    {
      time: 12,
      title: 'Track Prediction',
      description: 'AI predicts landfall location',
      action: 'highlight',
      data: {
        message: '🎯 Predicted landfall: Puri, Odisha',
        confidence: '94%',
        timeToLandfall: '36 hours'
      }
    },
    {
      time: 20,
      title: 'Category Upgrade',
      description: 'Upgraded to Extremely Severe Cyclone',
      action: 'alert',
      data: {
        severity: 'critical',
        message: '🚨 EXTREME: Cat 4 - Wind 200+ km/h',
        details: '10 districts on high alert',
        population: 2500000
      }
    },
    {
      time: 30,
      title: 'Evacuation Orders',
      description: 'Mass evacuation initiated',
      action: 'stats_update',
      data: {
        message: '🚁 Evacuating 1.2 million people',
        type: 'danger',
        shelters: 850,
        evacuated: 1200000
      }
    },
    {
      time: 38,
      title: 'Early Warning Success',
      description: 'Zero casualties due to advance warning',
      action: 'alert',
      data: {
        severity: 'medium',
        message: '✅ Success: 48-hour advance warning',
        details: 'Minimal casualties, property saved',
        saved: 'Lives saved through early detection'
      }
    }
  ]
}

// Drought Monitoring Scenario
export const DROUGHT_SCENARIO: DemoScenario = {
  id: 'maharashtra-drought-2019',
  name: 'Maharashtra Drought - 2019',
  description: 'Long-term drought monitoring and prediction',
  duration: 35,
  location: { lat: 19.7515, lng: 75.7139, zoom: 7 }, // Maharashtra
  steps: [
    {
      time: 0,
      title: 'Vegetation Baseline',
      description: 'Normal NDVI readings for agricultural regions',
      action: 'zoom',
      data: { message: '🌱 Vegetation health: Normal', type: 'info' }
    },
    {
      time: 6,
      title: 'Early Indicators',
      description: 'NDVI shows declining vegetation health',
      action: 'stats_update',
      data: {
        ndvi: -0.15,
        message: '📉 NDVI declining: -15%',
        type: 'warning'
      }
    },
    {
      time: 14,
      title: 'Water Stress',
      description: 'Soil moisture critically low',
      action: 'alert',
      data: {
        severity: 'medium',
        message: '⚠️ Drought conditions developing',
        details: 'Soil moisture 40% below normal'
      }
    },
    {
      time: 22,
      title: 'Agricultural Impact',
      description: 'Crop failure zones identified',
      action: 'risk_increase',
      data: {
        riskLevel: 'high',
        message: '🌾 500,000 hectares affected',
        farms: 125000,
        population: 800000
      }
    },
    {
      time: 32,
      title: 'Intervention Planning',
      description: 'Water resource allocation optimized',
      action: 'highlight',
      data: {
        message: '💧 Relief: Water tankers deployed',
        tankers: 2500,
        villages: 450
      }
    }
  ]
}

// Export all scenarios
export const DEMO_SCENARIOS = [
  KERALA_FLOOD_SCENARIO,
  CYCLONE_SCENARIO,
  DROUGHT_SCENARIO
]

// Get scenario by ID
export function getScenarioById(id: string): DemoScenario | undefined {
  return DEMO_SCENARIOS.find(s => s.id === id)
}

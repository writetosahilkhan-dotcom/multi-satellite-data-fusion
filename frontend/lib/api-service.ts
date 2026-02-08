/**
 * API service layer for Multi-Satellite Data Fusion Dashboard
 * Attempts to call the backend, falls back to local simulation
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// Request cache for deduplication
const requestCache = new Map<string, { promise: Promise<any>; timestamp: number }>()
const CACHE_TTL = 2000 // 2 seconds

async function apiFetch<T>(path: string, options?: RequestInit): Promise<{ data: T; source: "api" | "local" }> {
  // Check cache first
  const cacheKey = `${path}_${JSON.stringify(options)}`
  const cached = requestCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.promise
  }

  const fetchPromise = (async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      if (!res.ok) {
        console.warn(`API error ${res.status} for ${path}`)
        throw new Error(`API ${res.status}`)
      }
      const data = await res.json()
      return { data, source: "api" as const }
    } catch (err) {
      // Log error details for debugging
      if (err instanceof Error && err.name !== "AbortError") {
        console.warn(`Backend request failed: ${path}`, err.message)
      }
      throw new Error("Backend unavailable")
    }
  })()

  // Cache the promise
  requestCache.set(cacheKey, { promise: fetchPromise, timestamp: Date.now() })
  
  // Clean old cache entries
  if (requestCache.size > 20) {
    const oldestAllowed = Date.now() - CACHE_TTL
    for (const [key, value] of requestCache.entries()) {
      if (value.timestamp < oldestAllowed) {
        requestCache.delete(key)
      }
    }
  }

  return fetchPromise
}

// ---- Satellite Endpoints ----

export async function fetchSatellites() {
  return apiFetch<{ id: string; name: string; noradId: string }[]>("/api/satellites")
}

export async function addSatelliteAPI(name: string, noradId: string) {
  return apiFetch("/api/satellites", {
    method: "POST",
    body: JSON.stringify({ name, noradId }),
  })
}

export async function deleteSatelliteAPI(id: string) {
  return apiFetch(`/api/satellites/${id}`, { method: "DELETE" })
}

export async function fetchSatellitePosition(id: string) {
  return apiFetch<{ lat: number; lng: number; altitude: number; velocity: number }>(
    `/api/satellites/${id}/position`
  )
}

export async function fetchTelemetry(id: string) {
  return apiFetch(`/api/satellites/${id}/telemetry`)
}

// ---- Environmental Risk Endpoints ----

export async function fetchSyntheticRisk(lat: number, lon: number, radius: number) {
  return apiFetch(`/api/environmental/risk?lat=${lat}&lon=${lon}&radius=${radius}`)
}

export async function fetchRealRisk(lat: number, lon: number, radius: number) {
  return apiFetch(`/api/environmental/risk/real?lat=${lat}&lon=${lon}&radius=${radius}`)
}

export async function fetchNDVI(lat: number, lon: number, buffer: number) {
  return apiFetch<{ ndvi: number; classification: string; timestamp: string }>(
    `/api/satellite/ndvi?lat=${lat}&lon=${lon}&buffer=${buffer}`
  )
}

export async function fetchNDWI(lat: number, lon: number, buffer: number) {
  return apiFetch<{ ndwi: number; classification: string; timestamp: string }>(
    `/api/satellite/ndwi?lat=${lat}&lon=${lon}&buffer=${buffer}`
  )
}

// ---- ISRO Endpoints ----

export async function fetchISROSatellites() {
  return apiFetch("/api/isro/satellites")
}

export async function fetchISROData(satelliteName: string, region?: { lat: number; lng: number; radius: number }) {
  const regionParam = region ? `?region=${encodeURIComponent(JSON.stringify(region))}` : ""
  return apiFetch(`/api/isro/data/${encodeURIComponent(satelliteName)}${regionParam}`)
}

// ---- Data Fusion Endpoint ----

export async function fuseData(datasets: string[]) {
  return apiFetch("/api/data/fuse", {
    method: "POST",
    body: JSON.stringify({ datasets }),
  })
}

// ---- Health check ----

export async function checkBackendHealth(): Promise<boolean> {
  try {
    await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(2000) })
    return true
  } catch {
    return false
  }
}

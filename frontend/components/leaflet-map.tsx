"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import type { Satellite, SatellitePosition } from "@/lib/satellite-types"
import { INDIAN_GROUND_STATIONS, INDIAN_CITIES } from "@/lib/satellite-data"

interface LeafletMapProps {
  satellites: Satellite[]
  positions: Record<string, SatellitePosition>
  selectedId: string
  onSelect: (id: string) => void
  riskZones?: { lat: number; lng: number; radius: number; severity: string }[]
}

let L: typeof import("leaflet") | null = null

// Throttle helper for performance
function throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
  let inThrottle: boolean
  return function(this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  } as T
}

export function LeafletMap({ satellites, positions, selectedId, onSelect, riskZones = [] }: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<Record<string, L.Marker>>({})
  const trailsRef = useRef<Record<string, L.Polyline>>({})
  const riskCirclesRef = useRef<L.Circle[]>([])
  const gsMarkersRef = useRef<L.LayerGroup | null>(null)
  const geoCirclesRef = useRef<L.Circle[]>([])
  const selectedPulseRef = useRef<L.CircleMarker | null>(null)
  const [ready, setReady] = useState(false)

  // Load leaflet
  useEffect(() => {
    async function load() {
      console.log("[v0] Leaflet load start, L exists:", !!L)
      if (L) { setReady(true); return }
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link")
        link.id = "leaflet-css"
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
        await new Promise<void>((resolve) => {
          link.onload = () => resolve()
          link.onerror = () => { console.log("[v0] Leaflet CSS failed to load"); resolve() }
        })
      }
      try {
        const mod = await import("leaflet")
        L = mod.default || mod
        console.log("[v0] Leaflet module loaded:", !!L)
      } catch (err) {
        console.log("[v0] Leaflet import error:", err)
      }
      setReady(true)
    }
    load()
  }, [])

  // Initialize map centered on India
  useEffect(() => {
    if (!ready || !L || !mapContainerRef.current || mapRef.current) return
    const el = mapContainerRef.current
    console.log("[v0] Map container size:", el.offsetWidth, el.offsetHeight)
    const map = L.map(el, {
      center: [22, 79],
      zoom: 5,
      minZoom: 3,
      maxZoom: 12,
      zoomControl: false,
      attributionControl: false,
      worldCopyJump: true,
    })

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map)

    L.control.zoom({ position: "bottomright" }).addTo(map)

    // Ground station layer group
    const gsGroup = L.layerGroup().addTo(map)
    gsMarkersRef.current = gsGroup

    for (const gs of INDIAN_GROUND_STATIONS) {
      const color = gs.type === "primary" ? "#10b981" : gs.type === "launch" ? "#f59e0b" : "#6366f1"
      const icon = L.divIcon({
        className: "",
        iconSize: [12, 12],
        iconAnchor: [6, 6],
        html: `<div style="width:10px;height:10px;transform:rotate(45deg);background:${color};border:1px solid ${color}88;box-shadow:0 0 6px ${color}60;"></div>`,
      })
      const m = L.marker([gs.lat, gs.lng], { icon }).addTo(gsGroup)
      m.bindTooltip(
        `<div style="font-family:monospace;font-size:10px;line-height:1.4;padding:2px 6px;">
          <strong style="color:${color}">${gs.name}</strong><br/>
          <span style="color:#9ca3af">${gs.city}</span><br/>
          <span style="color:#6b7280">Type: ${gs.type.toUpperCase()}</span>
        </div>`,
        { direction: "top", offset: [0, -10], className: "gs-tooltip" }
      )
      // Range ring
      const range = gs.type === "primary" ? 400000 : gs.type === "launch" ? 250000 : 300000
      L.circle([gs.lat, gs.lng], {
        radius: range,
        color: color,
        fillColor: color,
        fillOpacity: 0.03,
        weight: 0.8,
        dashArray: "4 4",
        opacity: 0.25,
      }).addTo(gsGroup)
    }

    // Indian city labels
    for (const city of INDIAN_CITIES) {
      const icon = L.divIcon({
        className: "",
        iconSize: [0, 0],
        html: `<div style="font-family:monospace;font-size:9px;color:#475569;white-space:nowrap;pointer-events:none;text-shadow:0 0 3px #0a0e17,0 0 6px #0a0e17;">${city.name}</div>`,
      })
      L.marker([city.lat, city.lng], { icon, interactive: false }).addTo(map)
    }

    mapRef.current = map
    // Force tile load in case container wasn't sized yet
    setTimeout(() => {
      map.invalidateSize()
      console.log("[v0] Map invalidateSize called, container:", el.offsetWidth, el.offsetHeight)
    }, 100)
    // Keep invalidating on resize
    const observer = new ResizeObserver(() => {
      map.invalidateSize()
    })
    observer.observe(el)
    return () => { observer.disconnect(); map.remove(); mapRef.current = null }
  }, [ready])

  // Update risk zones on map
  useEffect(() => {
    if (!mapRef.current || !L) return
    const map = mapRef.current
    for (const c of riskCirclesRef.current) map.removeLayer(c)
    riskCirclesRef.current = []
    for (const zone of riskZones) {
      const color = zone.severity === "high" ? "#ef4444" : zone.severity === "medium" ? "#f59e0b" : "#10b981"
      const c = L.circle([zone.lat, zone.lng], {
        radius: zone.radius * 25000,
        color,
        fillColor: color,
        fillOpacity: 0.06,
        weight: 1.5,
        dashArray: "6 4",
        opacity: 0.35,
      }).addTo(map)
      riskCirclesRef.current.push(c)
    }
  }, [riskZones])

  // Update GEO footprints
  useEffect(() => {
    if (!mapRef.current || !L) return
    const map = mapRef.current
    for (const c of geoCirclesRef.current) map.removeLayer(c)
    geoCirclesRef.current = []
    for (const sat of satellites) {
      if (!sat.geostationary) continue
      const pos = positions[sat.id]
      if (!pos) continue
      const c = L.circle([pos.lat, pos.lng], {
        radius: 3500000,
        color: sat.color,
        fillColor: sat.color,
        fillOpacity: 0.03,
        weight: 1,
        dashArray: "8 6",
        opacity: 0.25,
      }).addTo(map)
      geoCirclesRef.current.push(c)
    }
  }, [satellites, positions])

  // Update satellite positions
  useEffect(() => {
    if (!mapRef.current || !L) return
    const map = mapRef.current
    const markers = markersRef.current
    const trails = trailsRef.current

    // Cleanup removed sats
    const currentIds = new Set(satellites.map((s) => s.id))
    for (const id of Object.keys(markers)) {
      if (!currentIds.has(id)) {
        map.removeLayer(markers[id])
        delete markers[id]
      }
    }
    for (const id of Object.keys(trails)) {
      if (!currentIds.has(id)) {
        map.removeLayer(trails[id])
        delete trails[id]
      }
    }
    if (selectedPulseRef.current) {
      map.removeLayer(selectedPulseRef.current)
      selectedPulseRef.current = null
    }

    for (const sat of satellites) {
      const pos = positions[sat.id]
      if (!pos) continue
      const isSelected = sat.id === selectedId
      const size = isSelected ? 14 : 10

      const icon = L.divIcon({
        className: "",
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${sat.color};box-shadow:0 0 ${isSelected ? 14 : 6}px ${sat.color}${isSelected ? "cc" : "80"};border:${isSelected ? "2px" : "1px"} solid ${sat.color}${isSelected ? "" : "80"};"></div>`,
      })

      if (markers[sat.id]) {
        markers[sat.id].setLatLng([pos.lat, pos.lng])
        markers[sat.id].setIcon(icon)
      } else {
        const m = L.marker([pos.lat, pos.lng], { icon }).addTo(map)
        m.on("click", () => onSelect(sat.id))
        markers[sat.id] = m
      }

      // Tooltip
      const altStr = sat.geostationary ? "GEO 35,786 km" : `${pos.altitude.toFixed(0)} km`
      markers[sat.id].unbindTooltip()
      markers[sat.id].bindTooltip(
        `<div style="font-family:monospace;font-size:10px;line-height:1.4;padding:2px 6px;">
          <strong style="color:${sat.color}">${sat.name}</strong><br/>
          <span style="color:#9ca3af">${pos.lat.toFixed(2)}N, ${pos.lng.toFixed(2)}E</span><br/>
          <span style="color:#6b7280">ALT ${altStr} | ${pos.velocity.toFixed(2)} km/s</span>
        </div>`,
        { direction: "top", offset: [0, -10], className: "sat-tooltip" }
      )

      // Selected ring
      if (isSelected) {
        selectedPulseRef.current = L.circleMarker([pos.lat, pos.lng], {
          radius: 18,
          color: sat.color,
          weight: 1.5,
          opacity: 0.35,
          fillColor: "transparent",
          dashArray: "4 3",
        }).addTo(map)
      }

      // Orbit trails
      if (trails[sat.id]) {
        const pts = trails[sat.id].getLatLngs() as L.LatLng[]
        const curr = L.latLng(pos.lat, pos.lng)
        if (pts.length > 0) {
          const prev = pts[pts.length - 1]
          if (Math.abs(curr.lng - prev.lng) > 180) {
            trails[sat.id].setLatLngs([curr])
          } else {
            const next = [...pts, curr]
            if (next.length > 200) next.shift()
            trails[sat.id].setLatLngs(next)
          }
        }
      } else {
        trails[sat.id] = L.polyline([[pos.lat, pos.lng]], {
          color: sat.color,
          weight: 1.5,
          opacity: 0.3,
          smoothFactor: 1,
        }).addTo(map)
      }
    }
  }, [satellites, positions, selectedId, onSelect])

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="absolute inset-0" />
      {!ready && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <span className="font-mono text-xs text-muted-foreground">Loading satellite map...</span>
          </div>
        </div>
      )}

      {/* Status bar */}
      <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-3 rounded-md border border-border bg-card/90 px-2.5 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur-sm">
        <span>TRK {satellites.length}</span>
        <span className="text-border">|</span>
        <span>GS {INDIAN_GROUND_STATIONS.length}</span>
        <span className="text-border">|</span>
        <span>RISK {riskZones.length}</span>
        <span className="text-border">|</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          <span className="text-primary">LIVE</span>
        </span>
      </div>

      <style jsx global>{`
        .leaflet-container { background: #0a0e17 !important; }
        .leaflet-control-zoom { border: 1px solid hsl(225 15% 15%) !important; border-radius: 6px !important; overflow: hidden; }
        .leaflet-control-zoom a { background: hsl(225 22% 8% / 0.9) !important; color: hsl(210 20% 90%) !important; border-color: hsl(225 15% 15%) !important; width: 28px !important; height: 28px !important; line-height: 28px !important; font-size: 14px !important; }
        .leaflet-control-zoom a:hover { background: hsl(225 18% 13%) !important; }
        .sat-tooltip, .gs-tooltip { background: hsl(225 22% 8% / 0.95) !important; border: 1px solid hsl(225 15% 18%) !important; border-radius: 6px !important; padding: 4px 6px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important; color: #e5e7eb !important; }
        .sat-tooltip .leaflet-tooltip-tip, .gs-tooltip .leaflet-tooltip-tip { display: none; }
        .leaflet-control-attribution { display: none !important; }
      `}</style>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Map, Grid3x3 } from "lucide-react"
import type { Satellite, SatellitePosition } from "@/lib/satellite-types"
import { LeafletMap } from "@/components/leaflet-map"
import { CanvasMap } from "@/components/canvas-map"
import { StatsOverlay } from "@/components/stats-overlay"

interface WorldMapProps {
  satellites: Satellite[]
  positions: Record<string, SatellitePosition>
  selectedId: string
  onSelect: (id: string) => void
  riskZones?: { lat: number; lng: number; radius: number; severity: string }[]
  mapCenter?: { lat: number; lng: number }
  mapZoom?: number
}

export function WorldMap({ satellites, positions, selectedId, onSelect, riskZones = [], mapCenter, mapZoom }: WorldMapProps) {
  const [mode, setMode] = useState<"satellite" | "tactical">("satellite")

  return (
    <div className="relative h-full flex-1 overflow-hidden bg-background">
      {/* Stats Overlay */}
      <StatsOverlay resetKey={mapZoom} />

      {/* Map mode toggle */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-0.5 rounded-md border border-border bg-card/90 p-0.5 backdrop-blur-sm">
        <button
          onClick={() => setMode("satellite")}
          className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-[10px] transition-colors ${
            mode === "satellite"
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Map className="h-3 w-3" />
          Satellite
        </button>
        <button
          onClick={() => setMode("tactical")}
          className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-[10px] transition-colors ${
            mode === "tactical"
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Grid3x3 className="h-3 w-3" />
          Tactical
        </button>
      </div>

      {/* Render active map */}
      {mode === "satellite" ? (
        <LeafletMap
          satellites={satellites}
          positions={positions}
          selectedId={selectedId}
          onSelect={onSelect}
          riskZones={riskZones}
          mapCenter={mapCenter}
          mapZoom={mapZoom}
        />
      ) : (
        <CanvasMap
          satellites={satellites}
          positions={positions}
          selectedId={selectedId}
          onSelect={onSelect}
          riskZones={riskZones}
        />
      )}
    </div>
  )
}

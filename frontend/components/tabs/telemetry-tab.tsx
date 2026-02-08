"use client"

import { useEffect, useState } from "react"
import { ArrowUpRight, Clock, Radio } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Satellite, SatellitePosition } from "@/lib/satellite-types"
import { generateTelemetry, INDIAN_GROUND_STATIONS } from "@/lib/satellite-data"
import type { TelemetryData } from "@/lib/satellite-types"

interface TelemetryTabProps {
  satellite: Satellite | null
  position: SatellitePosition | undefined
}

function DataField({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`text-sm font-mono font-medium ${accent ? "text-primary" : "text-foreground"}`}>{value}</span>
    </div>
  )
}

export function TelemetryTab({ satellite, position }: TelemetryTabProps) {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null)

  useEffect(() => {
    if (!satellite) return
    setTelemetry(generateTelemetry(satellite))
  }, [satellite])

  if (!satellite || !position) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">Select a satellite to view telemetry</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 p-4">
        {/* Satellite identity */}
        <div className="flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: satellite.color }} />
          <span className="text-sm font-semibold text-foreground">{satellite.name}</span>
          <span className="ml-auto rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">LIVE</span>
        </div>

        {/* Position section */}
        <div className="rounded-lg border border-border bg-secondary/40 p-3">
          <h4 className="mb-2.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Current Position</h4>
          <div className="grid grid-cols-2 gap-3">
            <DataField label="Latitude" value={`${position.lat.toFixed(4)}${"\u00B0"}`} />
            <DataField label="Longitude" value={`${position.lng.toFixed(4)}${"\u00B0"}`} />
            <DataField label="Altitude" value={`${satellite.altitude.toFixed(1)} km`} accent />
            <DataField label="Velocity" value={`${position.velocity.toFixed(2)} km/s`} />
          </div>
        </div>

        {/* Orbital parameters */}
        <div className="rounded-lg border border-border bg-secondary/40 p-3">
          <h4 className="mb-2.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Orbital Parameters</h4>
          <div className="grid grid-cols-2 gap-3">
            <DataField label="Period" value={`${telemetry?.orbitalPeriod.toFixed(2)} min`} />
            <DataField label="Inclination" value={`${telemetry?.inclination.toFixed(1)}${"\u00B0"}`} />
            <DataField label="Apogee" value={`${telemetry?.apogee.toFixed(0)} km`} />
            <DataField label="Perigee" value={`${telemetry?.perigee.toFixed(0)} km`} />
            <DataField label="Eccentricity" value={telemetry?.eccentricity.toFixed(6) ?? "-"} />
            <DataField label="NORAD ID" value={satellite.noradId} />
          </div>
        </div>

        {/* Orbit visualization */}
        <div className="rounded-lg border border-border bg-secondary/40 p-3">
          <h4 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Orbit Diagram</h4>
          <div className="flex items-center justify-center py-1">
            <svg viewBox="0 0 180 180" className="h-28 w-28">
              <circle cx={90} cy={90} r={70} fill="none" stroke="hsl(225 15% 15%)" strokeWidth={0.5} strokeDasharray="2,2" />
              <circle cx={90} cy={90} r={50} fill="none" stroke="hsl(225 15% 15%)" strokeWidth={0.5} strokeDasharray="2,2" />
              <circle cx={90} cy={90} r={30} fill="none" stroke="hsl(225 15% 15%)" strokeWidth={0.5} strokeDasharray="2,2" />
              <circle cx={90} cy={90} r={14} fill="hsl(225 22% 12%)" stroke="hsl(160 84% 39% / 0.3)" strokeWidth={0.8} />
              <text x={90} y={93} textAnchor="middle" fill="hsl(160 84% 39% / 0.6)" fontSize={8} fontFamily="monospace">E</text>
              <ellipse cx={90} cy={90} rx={55} ry={38} fill="none" stroke={satellite.color} strokeWidth={0.8} opacity={0.5} transform={`rotate(${satellite.inclination - 40}, 90, 90)`} />
              <circle r={3} fill={satellite.color}>
                <animateMotion dur="4s" repeatCount="indefinite" path="M90,52 A38,38 0 1,1 89.99,52" />
              </circle>
              <text x={90} y={170} textAnchor="middle" fill="hsl(215 12% 40%)" fontSize={6} fontFamily="monospace">{satellite.altitude} km orbit</text>
            </svg>
          </div>
        </div>

        {/* Indian Ground Station Visibility */}
        <div className="rounded-lg border border-border bg-secondary/40 p-3">
          <h4 className="mb-2.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <Radio className="h-3 w-3" />
            ISRO Ground Station Visibility
          </h4>
          <div className="flex flex-col gap-1.5">
            {INDIAN_GROUND_STATIONS.slice(0, 6).map((gs) => {
              const inView = Math.random() > 0.4
              return (
                <div key={gs.name} className="flex items-center justify-between rounded border border-border bg-background/60 px-2.5 py-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`h-1.5 w-1.5 rounded-full ${inView ? "bg-primary" : "bg-muted-foreground/30"}`} />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-foreground">{gs.name}</span>
                      <span className="text-[9px] text-muted-foreground">{gs.city}</span>
                    </div>
                  </div>
                  <span className={`text-[9px] font-mono uppercase ${inView ? "text-primary" : "text-muted-foreground/50"}`}>
                    {inView ? "IN VIEW" : "BELOW HORIZON"}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Pass predictions over India */}
        <div className="rounded-lg border border-border bg-secondary/40 p-3">
          <h4 className="mb-2.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <Clock className="h-3 w-3" />
            Upcoming Passes Over India
          </h4>
          <div className="flex flex-col gap-1.5">
            {telemetry?.passes.map((pass, i) => (
              <div key={i} className="flex items-center justify-between rounded border border-border bg-background/60 px-2.5 py-1.5">
                <div className="flex items-center gap-1.5">
                  <ArrowUpRight className="h-3 w-3 text-primary" />
                  <span className="text-xs font-mono text-foreground">{pass.startTime}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{pass.maxElevation}{"\u00B0"} max</span>
                  <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[9px] text-secondary-foreground">{pass.direction}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

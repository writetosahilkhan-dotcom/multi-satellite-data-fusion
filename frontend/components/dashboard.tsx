"use client"

import { useState, useEffect, useMemo } from "react"
import { Globe, Clock, Signal, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSatellites } from "@/hooks/use-satellites"
import { DEFAULT_RISK_ZONES } from "@/lib/satellite-data"
import { SatelliteSidebar } from "@/components/satellite-sidebar"
import { WorldMap } from "@/components/world-map"
import { DetailPanel } from "@/components/detail-panel"
import { Earth3DModal } from "@/components/earth-3d-modal"
import { Toaster } from "@/components/ui/toaster"
import { memo } from "react"

export function Dashboard() {
  const {
    satellites,
    positions,
    selectedId,
    setSelectedId,
    selected,
    addSatellite,
    removeSatellite,
    fusionSelectedIds,
    toggleFusionSelect,
    fusionSatellites,
    backendStatus,
  } = useSatellites()

  const [show3D, setShow3D] = useState(false)
  const [riskZones, setRiskZones] = useState<
    { lat: number; lng: number; radius: number; severity: string }[]
  >(DEFAULT_RISK_ZONES)

  return (
    <div className="flex h-screen w-screen flex-col bg-background">
      {/* Top command bar */}
      <header className="flex h-11 flex-shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <Activity className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-wide text-foreground">
              COSMOS
            </span>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
              FUSION
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <LiveClock />
            </span>
            <span className="flex items-center gap-1.5">
              <Signal className="h-3 w-3 text-primary" />
              <span>{satellites.length} tracked</span>
            </span>
            <span className="flex items-center gap-1.5">
              <div
                className={`h-1.5 w-1.5 rounded-full ${
                  backendStatus === "online"
                    ? "bg-emerald-500"
                    : backendStatus === "offline"
                      ? "bg-amber-500"
                      : "bg-muted-foreground animate-pulse"
                }`}
              />
              <span className="font-mono text-[10px] uppercase">
                {backendStatus === "online" ? "API Connected" : backendStatus === "offline" ? "Local Mode" : "Connecting..."}
              </span>
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 border-border bg-transparent px-3 text-xs text-foreground hover:bg-secondary"
          onClick={() => setShow3D(true)}
        >
          <Globe className="h-3.5 w-3.5 text-primary" />
          3D View
        </Button>
      </header>

      {/* Main layout */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <SatelliteSidebar
          satellites={satellites}
          positions={positions}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdd={addSatellite}
          onRemove={removeSatellite}
          backendStatus={backendStatus}
        />
        <WorldMap
          satellites={satellites}
          positions={positions}
          selectedId={selectedId}
          onSelect={setSelectedId}
          riskZones={riskZones}
        />
        <DetailPanel
          satellite={selected}
          position={selected ? positions[selected.id] : undefined}
          onRiskZonesChange={setRiskZones}
          satellites={satellites}
          fusionSelectedIds={fusionSelectedIds}
          toggleFusionSelect={toggleFusionSelect}
          fusionSatellites={fusionSatellites}
          positions={positions}
        />
      </div>

      <Earth3DModal
        open={show3D}
        onClose={() => setShow3D(false)}
        satellites={satellites}
      />
      <Toaster />
    </div>
  )
}

function LiveClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <span className="font-mono text-foreground/70">
      {time.toUTCString().split(" ").slice(4).join(" ").replace(" GMT", " UTC")}
    </span>
  )
}

"use client"

import { useState } from "react"
import { Download, CheckCircle2, AlertCircle, Orbit, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ISRO_SATELLITES } from "@/lib/satellite-data"
import type { ISROSatellite } from "@/lib/satellite-types"
import { useToast } from "@/hooks/use-toast"

const SATELLITE_MISSIONS: Record<string, { mission: string; agency: string; groundStation: string; dataPortal: string }> = {
  "CARTOSAT-3": { mission: "High-res Earth Observation", agency: "ISRO / NRSC Hyderabad", groundStation: "ISTRAC Hassan + NRSC Shadnagar", dataPortal: "Bhuvan (bhuvan.nrsc.gov.in)" },
  "RESOURCESAT-2A": { mission: "Multi-spectral Land Mapping", agency: "ISRO / NRSC", groundStation: "ISTRAC Hassan + Bhopal", dataPortal: "NRSC Data Centre (nrsc.gov.in)" },
  "RISAT-2B": { mission: "SAR Microwave Imaging", agency: "ISRO Defence", groundStation: "ISTRAC Hassan", dataPortal: "Restricted (ISRO/MoD)" },
  "EOS-06 (OCEANSAT-3)": { mission: "Ocean & Atmosphere Monitoring", agency: "ISRO / INCOIS", groundStation: "ISTRAC Hassan + Thiruvananthapuram", dataPortal: "MOSDAC (mosdac.gov.in)" },
  "INSAT-3D": { mission: "Meteorological Imaging", agency: "ISRO / IMD", groundStation: "MCF Hassan (GEO)", dataPortal: "MOSDAC (mosdac.gov.in)" },
  "GSAT-30": { mission: "Communication (C/Ku band)", agency: "ISRO / DoS", groundStation: "MCF Hassan (GEO)", dataPortal: "N/A (Comms payload)" },
}

export function ISROTab() {
  const [selectedSat, setSelectedSat] = useState<string>("CARTOSAT-3")
  const [fetchedData, setFetchedData] = useState<ISROSatellite | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleFetch = () => {
    setLoading(true)
    setTimeout(() => {
      const data = ISRO_SATELLITES.find((s) => s.name === selectedSat) ?? null
      setFetchedData(data)
      setLoading(false)
      if (data) {
        toast({ title: `${data.name} Data Retrieved`, description: `${data.dataPoints.toLocaleString()} data points at ${data.quality}% quality from NRSC pipeline.` })
      }
    }, 600)
  }

  const statusConfig = {
    active: { icon: CheckCircle2, color: "text-primary", bg: "bg-primary/10" },
    degraded: { icon: AlertCircle, color: "text-chart-3", bg: "bg-chart-3/10" },
    inactive: { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
  }

  const missionInfo = SATELLITE_MISSIONS[selectedSat]

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 p-4">
        {/* Header */}
        <div className="rounded-lg border border-primary/15 bg-primary/5 p-2.5">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/20">
              <MapPin className="h-3 w-3 text-primary" />
            </div>
            <div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-primary">ISRO Satellite Integration</span>
              <p className="text-[9px] text-muted-foreground">Data from NRSC Hyderabad / Bhuvan / MOSDAC portals</p>
            </div>
          </div>
        </div>

        {/* Selector */}
        <div className="flex items-center gap-2">
          <Select value={selectedSat} onValueChange={setSelectedSat}>
            <SelectTrigger className="flex-1 h-8 border-border bg-secondary text-xs text-foreground">
              <SelectValue placeholder="Select satellite" />
            </SelectTrigger>
            <SelectContent className="border-border bg-card text-foreground">
              {ISRO_SATELLITES.map((sat) => (
                <SelectItem key={sat.name} value={sat.name}>{sat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleFetch} disabled={loading} size="sm" className="h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
            <Download className="h-3 w-3" />
            {loading ? "Fetching..." : "Fetch"}
          </Button>
        </div>

        {/* Mission info always visible */}
        {missionInfo && (
          <div className="rounded-lg border border-border bg-secondary/40 p-3">
            <h4 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Mission Profile</h4>
            <div className="grid grid-cols-1 gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Mission</span>
                <span className="text-xs font-medium text-foreground">{missionInfo.mission}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Agency</span>
                <span className="text-xs font-mono text-foreground">{missionInfo.agency}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Ground Station</span>
                <span className="text-xs font-mono text-foreground">{missionInfo.groundStation}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Data Portal</span>
                <span className="text-xs font-mono text-primary">{missionInfo.dataPortal}</span>
              </div>
            </div>
          </div>
        )}

        {fetchedData ? (
          <>
            {/* Status header */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2.5">
              <span className="text-sm font-semibold text-foreground">{fetchedData.name}</span>
              {(() => {
                const cfg = statusConfig[fetchedData.status]
                const Icon = cfg.icon
                return (
                  <span className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium ${cfg.bg} ${cfg.color}`}>
                    <Icon className="h-3 w-3" />
                    {fetchedData.status.toUpperCase()}
                  </span>
                )
              })()}
            </div>

            {/* Specs grid */}
            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <h4 className="mb-2.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Sensor Specifications</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Resolution</span>
                  <span className="text-sm font-mono font-medium text-foreground">{fetchedData.resolution}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Swath</span>
                  <span className="text-sm font-mono font-medium text-foreground">{fetchedData.swath}</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Cloud Cover</span>
                  <span className="text-sm font-mono font-medium text-foreground">{fetchedData.cloudCover}%</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Data Quality</span>
                  <span className="text-sm font-mono font-medium text-primary">{fetchedData.quality}%</span>
                </div>
              </div>
            </div>

            {/* Data throughput */}
            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <h4 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Data Throughput ({fetchedData.dataPoints.toLocaleString()} pts)
              </h4>
              <div className="flex items-end gap-px h-12">
                {Array.from({ length: 32 }, (_, i) => {
                  const h = 20 + Math.sin(i * 0.4 + fetchedData.quality * 0.08) * 40 + Math.random() * 20
                  const normalized = Math.max(8, Math.min(100, h))
                  return (
                    <div key={i} className="flex-1 rounded-t-sm transition-all" style={{ height: `${normalized}%`, backgroundColor: normalized > 60 ? "hsl(160 84% 39%)" : "hsl(225 15% 20%)", opacity: normalized > 60 ? 0.8 : 0.5 }} />
                  )
                })}
              </div>
              <div className="mt-1.5 flex justify-between text-[9px] font-mono text-muted-foreground/50">
                <span>00:00 IST</span>
                <span>12:00 IST</span>
                <span>24:00 IST</span>
              </div>
            </div>

            {/* Quality gauge */}
            <div className="flex flex-col items-center rounded-lg border border-border bg-secondary/40 p-4">
              <svg viewBox="0 0 120 68" className="h-20 w-32">
                <path d="M 10 58 A 50 50 0 0 1 110 58" fill="none" stroke="hsl(225 15% 15%)" strokeWidth={6} strokeLinecap="round" />
                <path d="M 10 58 A 50 50 0 0 1 110 58" fill="none" stroke="hsl(160 84% 39%)" strokeWidth={6} strokeLinecap="round" strokeDasharray={`${(fetchedData.quality / 100) * 157} 157`} />
                <text x={60} y={52} textAnchor="middle" fill="hsl(210 20% 90%)" fontSize={18} fontWeight="bold" fontFamily="monospace">{fetchedData.quality}%</text>
                <text x={60} y={64} textAnchor="middle" fill="hsl(215 12% 48%)" fontSize={6} fontFamily="monospace">NRSC DATA QUALITY</text>
              </svg>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Orbit className="h-8 w-8 text-muted-foreground/20" />
            <p className="text-xs text-muted-foreground">Select an ISRO satellite and fetch data</p>
            <p className="text-[10px] text-muted-foreground/50">Data sourced from NRSC / Bhuvan / MOSDAC</p>
          </div>
        )}
      </div>
    </ScrollArea>
  )
}

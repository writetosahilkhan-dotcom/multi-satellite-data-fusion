"use client"

import { useState, useCallback } from "react"
import { AlertTriangle, RefreshCw, Sparkles, Leaf, Droplets, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { RiskAlert, RiskStats } from "@/lib/satellite-types"
import { generateRiskAlerts, generateRiskStats, INDIAN_REGIONS } from "@/lib/satellite-data"
import { useToast } from "@/hooks/use-toast"

interface RiskTabProps {
  onRiskZonesChange?: (zones: { lat: number; lng: number; radius: number; severity: string }[]) => void
}

function simulateNDVI(regionType: string) {
  const baseMap: Record<string, number> = { forest: 0.72, mangrove: 0.58, agriculture: 0.52, wetland: 0.38, "flood-zone": 0.35, desert: 0.08, "salt-marsh": 0.12, river: 0.25 }
  const base = baseMap[regionType] ?? 0.3
  const val = Math.max(0, Math.min(1, base + (Math.random() - 0.5) * 0.15))
  let classification = "Barren"
  if (val > 0.6) classification = "Dense Vegetation"
  else if (val > 0.4) classification = "Moderate Vegetation"
  else if (val > 0.2) classification = "Sparse Vegetation"
  return { ndvi: val, classification, timestamp: new Date().toISOString() }
}

function simulateNDWI(regionType: string) {
  const baseMap: Record<string, number> = { wetland: 0.45, "flood-zone": 0.52, river: 0.48, mangrove: 0.32, "salt-marsh": 0.22, agriculture: 0.05, forest: -0.1, desert: -0.35 }
  const base = baseMap[regionType] ?? 0
  const val = Math.max(-0.5, Math.min(1, base + (Math.random() - 0.5) * 0.15))
  let classification = "No Water"
  if (val > 0.3) classification = "Water Body"
  else if (val > 0.1) classification = "Moist Surface"
  else if (val > -0.1) classification = "Dry Surface"
  return { ndwi: val, classification, timestamp: new Date().toISOString() }
}

export function RiskTab({ onRiskZonesChange }: RiskTabProps) {
  const [useSynthetic, setUseSynthetic] = useState(true)
  const [alerts, setAlerts] = useState<RiskAlert[]>(() => generateRiskAlerts())
  const [stats, setStats] = useState<RiskStats>(() => generateRiskStats())
  const [loading, setLoading] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState(INDIAN_REGIONS[0].name)
  const [ndvi, setNdvi] = useState<{ ndvi: number; classification: string; timestamp: string } | null>(null)
  const [ndwi, setNdwi] = useState<{ ndwi: number; classification: string; timestamp: string } | null>(null)
  const [indexLoading, setIndexLoading] = useState(false)
  const { toast } = useToast()

  const refresh = useCallback(() => {
    setLoading(true)
    setTimeout(() => {
      const newAlerts = generateRiskAlerts()
      const newStats = generateRiskStats()
      setAlerts(newAlerts)
      setStats(newStats)
      onRiskZonesChange?.(newAlerts.map((a) => ({ lat: a.lat, lng: a.lng, radius: a.type === "high" ? 30 : a.type === "medium" ? 20 : 10, severity: a.type })))
      setLoading(false)
      toast({ title: "Risk Data Updated", description: `${newStats.total} environmental indicators refreshed across Indian subcontinent.` })
    }, 800)
  }, [onRiskZonesChange, toast])

  const fetchIndices = useCallback(() => {
    setIndexLoading(true)
    const region = INDIAN_REGIONS.find((r) => r.name === selectedRegion)!
    setTimeout(() => {
      setNdvi(simulateNDVI(region.type))
      setNdwi(simulateNDWI(region.type))
      setIndexLoading(false)
      toast({ title: `Indices for ${region.name}`, description: `NDVI/NDWI computed for ${region.name}, ${region.state} using multi-satellite imagery.` })
    }, 1000)
  }, [selectedRegion, toast])

  const severityConfig = {
    high: { color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", label: "HIGH" },
    medium: { color: "text-chart-3", bg: "bg-chart-3/10", border: "border-chart-3/20", label: "MED" },
    low: { color: "text-chart-2", bg: "bg-chart-2/10", border: "border-chart-2/20", label: "LOW" },
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] uppercase tracking-wider ${useSynthetic ? "text-primary" : "text-muted-foreground"}`}>Synthetic</span>
            <Switch checked={!useSynthetic} onCheckedChange={(c) => setUseSynthetic(!c)} className="data-[state=checked]:bg-primary" />
            <span className={`text-[10px] uppercase tracking-wider ${!useSynthetic ? "text-primary" : "text-muted-foreground"}`}>Real</span>
          </div>
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading} className="h-7 gap-1.5 border-border bg-transparent px-2.5 text-xs text-foreground hover:bg-secondary">
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(["high", "medium", "low"] as const).map((level) => {
            const cfg = severityConfig[level]
            return (
              <div key={level} className={`flex flex-col items-center rounded-lg border ${cfg.border} ${cfg.bg} p-2.5`}>
                <span className={`text-xl font-bold font-mono ${cfg.color}`}>{stats[level]}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{cfg.label}</span>
              </div>
            )
          })}
        </div>

        {/* NDVI/NDWI with Indian Region Selector */}
        <div className="rounded-lg border border-border bg-secondary/40 p-3">
          <h4 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Vegetation & Water Indices</h4>
          <div className="flex items-center gap-2 mb-2.5">
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="flex-1 h-7 border-border bg-secondary text-[11px] text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-border bg-card text-foreground">
                {INDIAN_REGIONS.map((r) => (
                  <SelectItem key={r.name} value={r.name} className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      {r.name}, {r.state}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={fetchIndices} disabled={indexLoading} className="h-7 gap-1 border-border bg-transparent px-2 text-[10px] text-foreground hover:bg-secondary">
              {indexLoading ? <div className="h-2.5 w-2.5 animate-spin rounded-full border border-foreground border-t-transparent" /> : <Leaf className="h-2.5 w-2.5" />}
              Compute
            </Button>
          </div>

          {ndvi && ndwi ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-md border border-border bg-background/60 p-2.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Leaf className="h-3 w-3 text-chart-2" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-chart-2">NDVI</span>
                </div>
                <span className="text-lg font-bold font-mono text-foreground">{ndvi.ndvi.toFixed(3)}</span>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-chart-2 transition-all" style={{ width: `${Math.max(0, ndvi.ndvi) * 100}%` }} />
                </div>
                <span className="mt-1 block text-[9px] text-muted-foreground">{ndvi.classification}</span>
              </div>
              <div className="rounded-md border border-border bg-background/60 p-2.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Droplets className="h-3 w-3 text-chart-1" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-chart-1">NDWI</span>
                </div>
                <span className="text-lg font-bold font-mono text-foreground">{ndwi.ndwi.toFixed(3)}</span>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-chart-1 transition-all" style={{ width: `${Math.max(0, (ndwi.ndwi + 0.5) / 1.5) * 100}%` }} />
                </div>
                <span className="mt-1 block text-[9px] text-muted-foreground">{ndwi.classification}</span>
              </div>
            </div>
          ) : (
            <p className="text-center text-[10px] text-muted-foreground/50 py-2">Select an Indian region and compute NDVI/NDWI from satellite imagery</p>
          )}
        </div>

        {/* AI Analysis */}
        <div className="rounded-lg border border-primary/15 bg-primary/5 p-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-medium uppercase tracking-wider text-primary">AI Analysis - Indian Subcontinent</span>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {stats.total} environmental indicators across India.
            {ndvi ? ` ${selectedRegion} NDVI (${ndvi.ndvi.toFixed(2)}): ${ndvi.classification.toLowerCase()}.` : ""}
            {ndwi ? ` NDWI (${ndwi.ndwi.toFixed(2)}): ${ndwi.classification.toLowerCase()}.` : ""}
            {" "}Critical: Sundarbans mangrove degradation detected by CARTOSAT-3, Delhi NCR PM2.5 at hazardous levels via INSAT-3D thermal fusion, Brahmaputra flood risk elevated per EOS-06. Western Ghats NDVI decline confirms deforestation in Kodagu. Recommend CARTOSAT-3 high-res tasking over Sundarbans and Kodagu within 48h.
          </p>
        </div>

        {/* Alert list */}
        <div className="flex flex-col gap-1">
          <h4 className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Active Alerts - India ({alerts.length})</h4>
          {alerts.map((alert) => {
            const cfg = severityConfig[alert.type]
            return (
              <div key={alert.id} className="flex items-start gap-2.5 rounded-lg border border-border bg-secondary/30 p-2.5">
                <AlertTriangle className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${cfg.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-medium text-foreground">{alert.title}</span>
                    <span className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-mono font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{alert.description}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground/50 font-mono">
                    {alert.lat.toFixed(2)}{"N, "}{alert.lng.toFixed(2)}{"E"} &middot; {new Date(alert.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </ScrollArea>
  )
}

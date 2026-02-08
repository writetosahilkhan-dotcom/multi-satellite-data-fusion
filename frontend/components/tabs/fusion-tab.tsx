"use client"

import { useState, useCallback, useMemo } from "react"
import { Layers, Zap, CheckSquare, Square, TrendingUp, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts"
import type { Satellite, SatellitePosition } from "@/lib/satellite-types"
import { useToast } from "@/hooks/use-toast"

interface FusionTabProps {
  satellites: Satellite[]
  fusionSelectedIds: Set<string>
  toggleFusionSelect: (id: string) => void
  fusionSatellites: Satellite[]
  positions: Record<string, SatellitePosition>
}

interface FusionResult {
  totalPoints: number
  avgConfidence: number
  coverageImprovement: number
  spatialResolution: string
  temporalCadence: string
  contributors: { name: string; color: string; points: number; confidence: number; weight: number }[]
  qualityHistory: { time: string; quality: number; fused: number }[]
  confidenceDistribution: { range: string; count: number }[]
  radarMetrics: { metric: string; value: number }[]
}

function generateFusionResult(selectedSats: Satellite[], positions: Record<string, SatellitePosition>): FusionResult {
  const n = selectedSats.length
  const basePoints = 1200 * n + Math.floor(Math.random() * 800)
  const baseConf = Math.min(0.97, 0.65 + n * 0.05 + Math.random() * 0.08)
  const coverage = Math.min(98, 20 + n * 12 + Math.floor(Math.random() * 10))

  return {
    totalPoints: basePoints,
    avgConfidence: baseConf,
    coverageImprovement: coverage,
    spatialResolution: n >= 4 ? "0.5m" : n >= 2 ? "2.5m" : "10m",
    temporalCadence: n >= 4 ? "15 min" : n >= 2 ? "45 min" : "3 hr",
    contributors: selectedSats.map((sat) => {
      const pos = positions[sat.id]
      const pts = 800 + Math.floor(Math.random() * 1500)
      const conf = 0.72 + Math.random() * 0.22
      return {
        name: sat.name,
        color: sat.color,
        points: pts,
        confidence: conf,
        weight: parseFloat((1 / n + Math.random() * 0.1).toFixed(3)),
      }
    }),
    qualityHistory: Array.from({ length: 24 }, (_, i) => ({
      time: `${String(i).padStart(2, "0")}:00`,
      quality: 55 + Math.floor(Math.random() * 20),
      fused: 65 + Math.floor(Math.random() * 25) + n * 3,
    })),
    confidenceDistribution: [
      { range: "0.0-0.2", count: Math.max(0, 15 - n * 3) },
      { range: "0.2-0.4", count: Math.max(5, 40 - n * 5) },
      { range: "0.4-0.6", count: 80 + Math.floor(Math.random() * 50) },
      { range: "0.6-0.8", count: 200 + n * 40 + Math.floor(Math.random() * 80) },
      { range: "0.8-1.0", count: 300 + n * 60 + Math.floor(Math.random() * 100) },
    ],
    radarMetrics: [
      { metric: "Spatial Res.", value: Math.min(95, 50 + n * 10) },
      { metric: "Temporal Cov.", value: Math.min(98, 40 + n * 12) },
      { metric: "Spectral Range", value: Math.min(90, 35 + n * 11) },
      { metric: "Radiometric", value: Math.min(96, 60 + n * 7) },
      { metric: "Geolocation", value: Math.min(97, 55 + n * 9) },
      { metric: "Cloud-Free", value: Math.min(92, 30 + n * 13) },
    ],
  }
}

const chartTooltipStyle = {
  backgroundColor: "hsl(225 22% 8%)",
  border: "1px solid hsl(225 15% 15%)",
  borderRadius: "6px",
  fontSize: "11px",
  color: "hsl(210 20% 90%)",
}

export function FusionTab({
  satellites,
  fusionSelectedIds,
  toggleFusionSelect,
  fusionSatellites,
  positions,
}: FusionTabProps) {
  const [result, setResult] = useState<FusionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const selectedCount = fusionSelectedIds.size

  const handleFuse = useCallback(() => {
    if (selectedCount < 2) {
      toast({
        title: "Insufficient Data Sources",
        description: "Select at least 2 satellites to perform data fusion.",
        variant: "destructive",
      })
      return
    }
    setLoading(true)
    // Simulate processing (would call /api/data/fuse in production)
    setTimeout(() => {
      const res = generateFusionResult(fusionSatellites, positions)
      setResult(res)
      setLoading(false)
      toast({
        title: "Fusion Complete",
        description: `Fused ${res.totalPoints.toLocaleString()} data points from ${selectedCount} satellites at ${(res.avgConfidence * 100).toFixed(1)}% confidence.`,
      })
    }, 1500)
  }, [fusionSatellites, positions, selectedCount, toast])

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-4 p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-foreground">Multi-Satellite Fusion Engine</span>
          </div>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-mono font-medium text-primary">
            {selectedCount} sources
          </span>
        </div>

        {/* Satellite selector - multi-select checkboxes */}
        <div className="rounded-lg border border-border bg-secondary/40 p-3">
          <h4 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Select Data Sources
          </h4>
          <div className="flex flex-col gap-1">
            {satellites.map((sat) => {
              const isChecked = fusionSelectedIds.has(sat.id)
              return (
                <button
                  key={sat.id}
                  type="button"
                  onClick={() => toggleFusionSelect(sat.id)}
                  className={`flex items-center gap-2.5 rounded px-2 py-1.5 text-left transition-colors ${
                    isChecked ? "bg-primary/8" : "hover:bg-secondary"
                  }`}
                >
                  {isChecked ? (
                    <CheckSquare className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                  ) : (
                    <Square className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
                  )}
                  <div
                    className="h-2 w-2 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: sat.color }}
                  />
                  <span className={`text-xs ${isChecked ? "text-foreground" : "text-muted-foreground"}`}>
                    {sat.name}
                  </span>
                  <span className="ml-auto text-[9px] font-mono text-muted-foreground">
                    {sat.altitude >= 35000 ? "GEO" : sat.altitude >= 2000 ? "MEO" : "LEO"}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Fuse button */}
        <Button
          onClick={handleFuse}
          disabled={loading || selectedCount < 2}
          className="h-9 w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {loading ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Fusing {selectedCount} sources...
            </>
          ) : (
            <>
              <Zap className="h-3.5 w-3.5" />
              Fuse Data ({selectedCount} satellites)
            </>
          )}
        </Button>

        {!result ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Activity className="h-8 w-8 text-muted-foreground/15" />
            <div>
              <p className="text-xs text-muted-foreground">
                Select ISRO satellites and fuse their observations over India
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground/60">
                Combining CARTOSAT, RESOURCESAT, RISAT, and EOS data improves coverage of the Indian subcontinent
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col items-center rounded-lg border border-border bg-secondary/40 p-2.5">
                <span className="text-lg font-bold font-mono text-foreground">
                  {result.totalPoints.toLocaleString()}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Fused Points</span>
              </div>
              <div className="flex flex-col items-center rounded-lg border border-primary/20 bg-primary/5 p-2.5">
                <span className="text-lg font-bold font-mono text-primary">
                  {(result.avgConfidence * 100).toFixed(1)}%
                </span>
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Confidence</span>
              </div>
              <div className="flex flex-col items-center rounded-lg border border-chart-2/20 bg-chart-2/5 p-2.5">
                <span className="text-lg font-bold font-mono text-chart-2">
                  +{result.coverageImprovement}%
                </span>
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Coverage</span>
              </div>
              <div className="flex flex-col items-center rounded-lg border border-chart-3/20 bg-chart-3/5 p-2.5">
                <span className="text-lg font-bold font-mono text-chart-3">
                  {result.spatialResolution}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Resolution</span>
              </div>
            </div>

            {/* Fusion improvement summary */}
            <div className="rounded-lg border border-primary/15 bg-primary/5 p-3">
              <div className="mb-1.5 flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-primary">Fusion Improvement</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Fusing {result.contributors.length} ISRO satellite data streams over the Indian subcontinent achieved {result.spatialResolution} effective
                resolution with {result.temporalCadence} revisit cadence. Coverage of Indian landmass improved by +{result.coverageImprovement}% vs single-source. NRSC ground processing pipeline active at Shadnagar.
              </p>
            </div>

            {/* Contributors with weights */}
            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <h4 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Source Contributions
              </h4>
              <div className="flex flex-col gap-2">
                {result.contributors.map((c) => (
                  <div key={c.name} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="text-[11px] text-foreground truncate max-w-[130px]">{c.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-muted-foreground">
                          w:{c.weight.toFixed(2)}
                        </span>
                        <span className="text-[9px] font-mono text-primary">
                          {(c.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${c.confidence * 100}%`,
                          backgroundColor: c.color,
                          opacity: 0.7,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Radar chart - fusion quality dimensions */}
            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <h4 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Fusion Quality Profile
              </h4>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={result.radarMetrics} outerRadius={65}>
                  <PolarGrid stroke="hsl(225 15% 15%)" />
                  <PolarAngleAxis
                    dataKey="metric"
                    tick={{ fontSize: 8, fill: "hsl(215 12% 48%)" }}
                  />
                  <Radar
                    dataKey="value"
                    stroke="hsl(160 84% 39%)"
                    fill="hsl(160 84% 39%)"
                    fillOpacity={0.15}
                    strokeWidth={1.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Quality over time - fused vs single */}
            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <h4 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Quality: Single vs Fused
              </h4>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={result.qualityHistory}>
                  <defs>
                    <linearGradient id="fusedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(160 84% 39%)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(160 84% 39%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 15% 12%)" vertical={false} />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 7, fill: "hsl(215 12% 40%)" }}
                    axisLine={{ stroke: "hsl(225 15% 12%)" }}
                    tickLine={false}
                    interval={5}
                  />
                  <YAxis
                    tick={{ fontSize: 8, fill: "hsl(215 12% 40%)" }}
                    axisLine={false}
                    tickLine={false}
                    domain={[40, 100]}
                    width={28}
                  />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="quality"
                    stroke="hsl(215 12% 40%)"
                    strokeWidth={1}
                    fill="none"
                    strokeDasharray="4 2"
                    name="Single Source"
                  />
                  <Area
                    type="monotone"
                    dataKey="fused"
                    stroke="hsl(160 84% 39%)"
                    strokeWidth={1.5}
                    fill="url(#fusedGrad)"
                    name="Fused"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-1.5 flex items-center justify-center gap-4 text-[9px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <div className="h-0.5 w-3 border-t border-dashed border-muted-foreground" />
                  Single
                </span>
                <span className="flex items-center gap-1">
                  <div className="h-0.5 w-3 bg-primary" />
                  Fused
                </span>
              </div>
            </div>

            {/* Confidence distribution */}
            <div className="rounded-lg border border-border bg-secondary/40 p-3">
              <h4 className="mb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Confidence Distribution
              </h4>
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={result.confidenceDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 15% 12%)" vertical={false} />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 7, fill: "hsl(215 12% 40%)" }}
                    axisLine={{ stroke: "hsl(225 15% 12%)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 8, fill: "hsl(215 12% 40%)" }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Bar
                    dataKey="count"
                    fill="hsl(160 84% 39%)"
                    radius={[3, 3, 0, 0]}
                    opacity={0.7}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </ScrollArea>
  )
}

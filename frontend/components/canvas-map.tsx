"use client"

import React from "react"
import { useRef, useEffect, useState, useCallback, useMemo } from "react"
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Satellite, SatellitePosition } from "@/lib/satellite-types"
import { CONTINENT_POLYGONS, MAJOR_LAKES } from "@/lib/world-geo"
import { INDIAN_GROUND_STATIONS, INDIAN_CITIES } from "@/lib/satellite-data"

interface CanvasMapProps {
  satellites: Satellite[]
  positions: Record<string, SatellitePosition>
  selectedId: string
  onSelect: (id: string) => void
  riskZones?: { lat: number; lng: number; radius: number; severity: string }[]
}

function project(lng: number, lat: number, w: number, h: number): [number, number] {
  return [((lng + 180) / 360) * w, ((90 - lat) / 180) * h]
}

const COLORS = {
  bg: "#0a0e17",
  bgGrad: "#060a12",
  land: "#141c2b",
  landStroke: "#1e293b",
  grid: "#111827",
  gridLabel: "#374151",
  equator: "rgba(16, 185, 129, 0.08)",
  lake: "#0c1322",
  lakeStroke: "#162033",
}

export function CanvasMap({ satellites, positions, selectedId, onSelect, riskZones = [] }: CanvasMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ width: 960, height: 500 })
  const [zoom, setZoom] = useState(2.5)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const initializedRef = useRef(false)
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef({ x: 0, y: 0 })
  const panOffset = useRef({ x: 0, y: 0 })
  const trailsRef = useRef<Record<string, { x: number; y: number }[]>>({})
  const dprRef = useRef(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1)
  const animFrameRef = useRef<number>(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      const h = entry.contentRect.height
      if (w > 0 && h > 0) setDims({ width: w, height: h })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (initializedRef.current) return
    if (dims.width <= 100 || dims.height <= 100) return
    initializedRef.current = true
    const [ix, iy] = project(78, 22, dims.width, dims.height)
    const cx = dims.width / 2
    const cy = dims.height / 2
    setPan({ x: -(ix - cx) * zoom, y: -(iy - cy) * zoom })
  }, [dims, zoom])

  useEffect(() => {
    const trails = trailsRef.current
    for (const sat of satellites) {
      if (sat.geostationary) continue
      const pos = positions[sat.id]
      if (!pos) continue
      const [x, y] = project(pos.lng, pos.lat, dims.width, dims.height)
      if (!trails[sat.id]) trails[sat.id] = []
      trails[sat.id].push({ x, y })
      if (trails[sat.id].length > 150) trails[sat.id].shift()
    }
  }, [positions, satellites, dims])

  const projectedContinents = useMemo(
    () => CONTINENT_POLYGONS.map((poly) => poly.map(([lng, lat]) => project(lng, lat, dims.width, dims.height))),
    [dims]
  )
  const projectedLakes = useMemo(
    () => MAJOR_LAKES.map((lake) => {
      const [cx, cy] = project(lake.center[0], lake.center[1], dims.width, dims.height)
      return { cx, cy, rx: lake.rx * (dims.width / 360), ry: lake.ry * (dims.height / 180) }
    }),
    [dims]
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const dpr = dprRef.current
    canvas.width = dims.width * dpr
    canvas.height = dims.height * dpr
    canvas.style.width = `${dims.width}px`
    canvas.style.height = `${dims.height}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    function draw() {
      if (!ctx) return
      const w = dims.width
      const h = dims.height
      ctx.save()
      ctx.clearRect(0, 0, w, h)

      const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7)
      bgGrad.addColorStop(0, COLORS.bg)
      bgGrad.addColorStop(1, COLORS.bgGrad)
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, w, h)

      const cx = w / 2
      const cy = h / 2
      ctx.translate(cx + pan.x, cy + pan.y)
      ctx.scale(zoom, zoom)
      ctx.translate(-cx, -cy)

      // Grid
      ctx.strokeStyle = COLORS.grid
      ctx.lineWidth = 0.5
      for (let lat = -60; lat <= 60; lat += 30) {
        const [, y] = project(0, lat, w, h)
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
      }
      for (let lng = -180; lng <= 180; lng += 30) {
        const [x] = project(lng, 0, w, h)
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
      }

      // Equator
      const [, eqY] = project(0, 0, w, h)
      ctx.strokeStyle = COLORS.equator
      ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(0, eqY); ctx.lineTo(w, eqY); ctx.stroke()

      // Grid labels
      ctx.fillStyle = COLORS.gridLabel
      ctx.font = `${Math.max(9, w * 0.009)}px monospace`
      ctx.textBaseline = "bottom"
      for (let lat = -60; lat <= 60; lat += 30) {
        if (lat === 0) continue
        const [, y] = project(0, lat, w, h)
        ctx.fillText(lat > 0 ? `${lat}N` : `${Math.abs(lat)}S`, 6, y - 3)
      }

      // Continents
      ctx.fillStyle = COLORS.land
      ctx.strokeStyle = COLORS.landStroke
      ctx.lineWidth = 0.8
      ctx.lineJoin = "round"
      for (const poly of projectedContinents) {
        ctx.beginPath()
        for (let i = 0; i < poly.length; i++) {
          if (i === 0) ctx.moveTo(poly[i][0], poly[i][1])
          else ctx.lineTo(poly[i][0], poly[i][1])
        }
        ctx.closePath(); ctx.fill(); ctx.stroke()
      }

      // Lakes
      ctx.fillStyle = COLORS.lake
      ctx.strokeStyle = COLORS.lakeStroke
      ctx.lineWidth = 0.5
      for (const lake of projectedLakes) {
        ctx.beginPath()
        ctx.ellipse(lake.cx, lake.cy, Math.max(1, lake.rx), Math.max(1, lake.ry), 0, 0, Math.PI * 2)
        ctx.fill(); ctx.stroke()
      }

      // GEO satellite coverage footprints
      for (const sat of satellites) {
        if (!sat.geostationary) continue
        const pos = positions[sat.id]
        if (!pos) continue
        const [gx, gy] = project(pos.lng, pos.lat, w, h)
        // GEO footprint ~60-70 degrees from subsatellite point
        const footprintR = (60 / 180) * h
        ctx.fillStyle = sat.color + "08"
        ctx.strokeStyle = sat.color + "30"
        ctx.lineWidth = 1
        ctx.setLineDash([6, 4])
        ctx.beginPath()
        ctx.arc(gx, gy, footprintR, 0, Math.PI * 2)
        ctx.fill(); ctx.stroke()
        ctx.setLineDash([])
      }

      // Label collision detection helper
      const drawnLabels: { x: number; y: number; w: number; h: number }[] = []
      const canDrawLabel = (x: number, y: number, w: number, h: number): boolean => {
        return !drawnLabels.some(label => 
          x < label.x + label.w + 10 &&
          x + w + 10 > label.x &&
          y - h < label.y + 5 &&
          y + 5 > label.y - label.h
        )
      }

      // Ground stations
      for (const station of INDIAN_GROUND_STATIONS) {
        const [sx, sy] = project(station.lng, station.lat, w, h)
        const color = station.type === "primary" ? "#10B981" : station.type === "launch" ? "#F59E0B" : "#6366F1"

        // Range ring
        const range = station.type === "primary" ? 40 : 25
        const rangeR = (range / 360) * w
        ctx.strokeStyle = color + "20"
        ctx.lineWidth = 0.5
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.arc(sx, sy, rangeR, 0, Math.PI * 2)
        ctx.stroke()
        ctx.setLineDash([])

        // Station marker (diamond)
        const ms = station.type === "launch" ? 4 : 3
        ctx.save()
        ctx.translate(sx, sy)
        ctx.rotate(Math.PI / 4)
        ctx.fillStyle = color
        ctx.globalAlpha = 0.9
        ctx.fillRect(-ms, -ms, ms * 2, ms * 2)
        ctx.strokeStyle = color
        ctx.lineWidth = 0.8
        ctx.globalAlpha = 0.5
        ctx.strokeRect(-ms - 1, -ms - 1, (ms + 1) * 2, (ms + 1) * 2)
        ctx.restore()
        ctx.globalAlpha = 1

        // Label
        ctx.font = `${Math.max(8, w * 0.007)}px monospace`
        const labelWidth = ctx.measureText(station.name).width
        const labelX = sx + ms + 6
        const labelY = sy + 3
        
        if (canDrawLabel(labelX, labelY - 10, labelWidth, 10)) {
          ctx.fillStyle = color + "90"
          ctx.fillText(station.name, labelX, labelY)
          drawnLabels.push({ x: labelX, y: labelY - 10, w: labelWidth, h: 10 })
        }
      }

      // Indian city labels
      ctx.font = `${Math.max(8, w * 0.007)}px monospace`
      for (const city of INDIAN_CITIES) {
        const [cx2, cy2] = project(city.lng, city.lat, w, h)
        const labelWidth = ctx.measureText(city.name).width
        const labelX = cx2 + 5
        const labelY = cy2 + 3
        
        // Small dot
        ctx.beginPath()
        ctx.arc(cx2, cy2, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = "#334155"
        ctx.fill()
        
        // Label only if no collision
        if (canDrawLabel(labelX, labelY - 10, labelWidth, 10)) {
          ctx.fillStyle = "#475569"
          ctx.fillText(city.name, labelX, labelY)
          drawnLabels.push({ x: labelX, y: labelY - 10, w: labelWidth, h: 10 })
        }
      }

      // Risk zones
      for (const zone of riskZones) {
        const [rx, ry] = project(zone.lng, zone.lat, w, h)
        const r = zone.radius * (w / 500)
        const color = zone.severity === "high" ? [239, 68, 68] : zone.severity === "medium" ? [245, 158, 11] : [16, 185, 129]
        ctx.fillStyle = `rgba(${color[0]},${color[1]},${color[2]},0.08)`
        ctx.strokeStyle = `rgba(${color[0]},${color[1]},${color[2]},0.3)`
        ctx.lineWidth = 1
        ctx.setLineDash([4, 3])
        ctx.beginPath(); ctx.arc(rx, ry, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
        ctx.setLineDash([])
      }

      // Trails (LEO only)
      const trails = trailsRef.current
      for (const sat of satellites) {
        if (sat.geostationary) continue
        const trail = trails[sat.id]
        if (!trail || trail.length < 2) continue
        ctx.beginPath()
        ctx.moveTo(trail[0].x, trail[0].y)
        for (let i = 1; i < trail.length; i++) {
          if (Math.abs(trail[i].x - trail[i - 1].x) > w * 0.3) ctx.moveTo(trail[i].x, trail[i].y)
          else ctx.lineTo(trail[i].x, trail[i].y)
        }
        ctx.strokeStyle = sat.color
        ctx.lineWidth = 1.2
        ctx.globalAlpha = 0.35
        ctx.stroke()
        ctx.globalAlpha = 1
      }

      // Satellite markers
      const now = Date.now()
      for (const sat of satellites) {
        const pos = positions[sat.id]
        if (!pos) continue
        const [sx, sy] = project(pos.lng, pos.lat, w, h)
        const isSelected = sat.id === selectedId
        const ms = isSelected ? 5 : 3.5

        if (isSelected) {
          const pulse = (Math.sin(now / 400) + 1) / 2
          ctx.beginPath()
          ctx.arc(sx, sy, ms + 6 + pulse * 10, 0, Math.PI * 2)
          ctx.strokeStyle = sat.color
          ctx.lineWidth = 1
          ctx.globalAlpha = 0.15 * (1 - pulse)
          ctx.stroke()
          ctx.globalAlpha = 1
          ctx.beginPath()
          ctx.arc(sx, sy, ms + 4, 0, Math.PI * 2)
          ctx.strokeStyle = sat.color
          ctx.lineWidth = 0.8
          ctx.globalAlpha = 0.4
          ctx.stroke()
          ctx.globalAlpha = 1
        }

        ctx.shadowColor = sat.color
        ctx.shadowBlur = isSelected ? 12 : 6
        ctx.beginPath()
        ctx.arc(sx, sy, ms, 0, Math.PI * 2)
        ctx.fillStyle = sat.color
        ctx.fill()
        ctx.shadowBlur = 0

        const fontSize = Math.max(10, w * 0.011)
        const label = sat.name.length > 14 ? sat.name.substring(0, 14) : sat.name
        ctx.font = `${isSelected ? "bold " : ""}${fontSize}px monospace`
        const tm = ctx.measureText(label)
        const lx = sx + ms + 6
        const ly = sy - 3
        const altStr = sat.geostationary ? "GEO" : `${pos.altitude.toFixed(0)}km`

        if (isSelected) {
          const padH = 6
          const padV = 4
          ctx.fillStyle = "rgba(10, 14, 23, 0.92)"
          ctx.strokeStyle = sat.color + "40"
          ctx.lineWidth = 0.8
          roundRect(ctx, lx - padH, ly - padV - 2, Math.max(tm.width, 80) + padH * 2 + 2, fontSize + padV * 2 + fontSize + 2, 4)
          ctx.fill(); ctx.stroke()
          ctx.fillStyle = sat.color
          ctx.fillText(label, lx, ly + fontSize - 2)
          ctx.fillStyle = "#6b7280"
          ctx.font = `${fontSize * 0.85}px monospace`
          ctx.fillText(`${pos.lat.toFixed(2)}\u00B0, ${pos.lng.toFixed(2)}\u00B0 | ${altStr}`, lx, ly + fontSize + fontSize * 0.85)
        } else {
          ctx.fillStyle = "#94a3b8"
          ctx.fillText(label, lx, ly + fontSize - 2)
        }
      }

      ctx.restore()
      animFrameRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [dims, zoom, pan, satellites, positions, selectedId, riskZones, projectedContinents, projectedLakes])

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const cx = dims.width / 2
      const cy = dims.height / 2
      const mapX = (e.clientX - rect.left - cx - pan.x) / zoom + cx
      const mapY = (e.clientY - rect.top - cy - pan.y) / zoom + cy
      let closest: { id: string; dist: number } | null = null
      for (const sat of satellites) {
        const pos = positions[sat.id]
        if (!pos) continue
        const [sx, sy] = project(pos.lng, pos.lat, dims.width, dims.height)
        const dist = Math.hypot(mapX - sx, mapY - sy)
        if (dist < 20 && (!closest || dist < closest.dist)) closest = { id: sat.id, dist }
      }
      if (closest) onSelect(closest.id)
    },
    [satellites, positions, dims, zoom, pan, onSelect]
  )

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsPanning(true)
    panStart.current = { x: e.clientX, y: e.clientY }
    panOffset.current = { ...pan }
  }, [pan])
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return
    setPan({ x: panOffset.current.x + (e.clientX - panStart.current.x), y: panOffset.current.y + (e.clientY - panStart.current.y) })
  }, [isPanning])
  const handleMouseUp = useCallback(() => setIsPanning(false), [])
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setZoom((z) => Math.min(Math.max(z + (e.deltaY > 0 ? -0.15 : 0.15), 0.5), 5))
  }, [])

  const resetView = useCallback(() => {
    const z = 2.5
    const [ix, iy] = project(78, 22, dims.width, dims.height)
    const cx = dims.width / 2
    const cy = dims.height / 2
    setZoom(z)
    setPan({ x: -(ix - cx) * z, y: -(iy - cy) * z })
  }, [dims])

  return (
    <div ref={containerRef} className="relative h-full w-full cursor-crosshair" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <canvas ref={canvasRef} className="h-full w-full" onClick={handleCanvasClick} onWheel={handleWheel} />
      <div className="absolute bottom-3 right-3 flex flex-col gap-1">
        <Button variant="outline" size="icon" className="h-7 w-7 border-border bg-card/90 text-foreground backdrop-blur-sm hover:bg-secondary" onClick={() => setZoom((z) => Math.min(z + 0.3, 5))}>
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-7 w-7 border-border bg-card/90 text-foreground backdrop-blur-sm hover:bg-secondary" onClick={() => setZoom((z) => Math.max(z - 0.3, 0.5))}>
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <Button variant="outline" size="icon" className="h-7 w-7 border-border bg-card/90 text-foreground backdrop-blur-sm hover:bg-secondary" onClick={resetView}>
          <Maximize2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="absolute bottom-3 left-3 flex items-center gap-3 rounded-md border border-border bg-card/90 px-2.5 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur-sm">
        <span>ZOOM {zoom.toFixed(1)}x</span>
        <span className="text-border">|</span>
        <span>TRK {satellites.length}</span>
        <span className="text-border">|</span>
        <span>STN {INDIAN_GROUND_STATIONS.length}</span>
        <span className="text-border">|</span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          <span className="text-primary">LIVE</span>
        </span>
      </div>
    </div>
  )
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

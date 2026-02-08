"use client"

import { useState, useEffect } from "react"
import { X, ZoomIn, ZoomOut, RotateCcw, Play, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Satellite } from "@/lib/satellite-types"

interface Earth3DModalProps {
  open: boolean
  onClose: () => void
  satellites: Satellite[]
}

export function Earth3DModal({ open, onClose, satellites }: Earth3DModalProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [autoRotate, setAutoRotate] = useState(true)

  useEffect(() => {
    if (!open || !autoRotate) return
    let frame: number
    const animate = () => {
      setRotation((r) => (r + 0.25) % 360)
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [open, autoRotate])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  if (!open) return null

  const earthR = 110
  const cx = 280
  const cy = 240

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[9998] bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Content */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center" role="dialog" aria-modal="true" aria-label="3D Orbital View">
        {/* Container with background */}
        <div className="relative h-[600px] w-[900px] rounded-lg border border-border bg-card/95 shadow-2xl backdrop-blur-sm">
          {/* Header */}
          <div className="absolute left-5 top-4 flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded bg-primary/15">
          <div className="h-2 w-2 rounded-full bg-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Orbital View</h2>
          <p className="text-[10px] text-muted-foreground">Real-time satellite visualization</p>
        </div>
      </div>

      {/* Close */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-4 top-4 h-8 w-8 text-muted-foreground hover:bg-secondary hover:text-foreground"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </Button>

      {/* Controls */}
      <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-1.5">
        {[
          { icon: ZoomIn, label: "Zoom In", action: () => setZoom((z) => Math.min(z + 0.2, 2)) },
          { icon: ZoomOut, label: "Zoom Out", action: () => setZoom((z) => Math.max(z - 0.2, 0.5)) },
          { icon: RotateCcw, label: "Reset", action: () => { setRotation(0); setZoom(1) } },
        ].map(({ icon: Icon, label, action }) => (
          <Button
            key={label}
            variant="outline"
            size="sm"
            className="h-7 gap-1 border-border bg-card/80 px-2.5 text-[10px] text-foreground backdrop-blur-sm hover:bg-secondary"
            onClick={action}
          >
            <Icon className="h-3 w-3" />
            {label}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          className={`h-7 gap-1 border-border px-2.5 text-[10px] backdrop-blur-sm ${
            autoRotate ? "bg-primary/15 text-primary border-primary/30" : "bg-card/80 text-foreground"
          }`}
          onClick={() => setAutoRotate(!autoRotate)}
        >
          {autoRotate ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          {autoRotate ? "Pause" : "Rotate"}
        </Button>
      </div>

      {/* SVG Scene */}
      <svg
        viewBox="0 0 560 480"
        className="h-[72vh] w-auto"
        style={{ transform: `scale(${zoom})` }}
      >
        <defs>
          <radialGradient id="earth3d" cx="38%" cy="35%" r="55%">
            <stop offset="0%" stopColor="hsl(200 50% 30%)" />
            <stop offset="50%" stopColor="hsl(215 45% 18%)" />
            <stop offset="85%" stopColor="hsl(225 35% 10%)" />
            <stop offset="100%" stopColor="hsl(225 30% 5%)" />
          </radialGradient>
          <radialGradient id="atmos3d" cx="50%" cy="50%" r="52%">
            <stop offset="88%" stopColor="transparent" />
            <stop offset="100%" stopColor="hsl(160 84% 39% / 0.1)" />
          </radialGradient>
          <filter id="glow3d">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="earthClip3d">
            <circle cx={cx} cy={cy} r={earthR} />
          </clipPath>
        </defs>

        {/* Star field */}
        {Array.from({ length: 120 }, (_, i) => {
          const x = (i * 7919 + 1301) % 560
          const y = (i * 6271 + 997) % 480
          const r = ((i * 3) % 10) / 10 + 0.3
          const o = ((i * 7) % 10) / 20 + 0.1
          return <circle key={`s-${i}`} cx={x} cy={y} r={r} fill="hsl(210 20% 80%)" opacity={o} />
        })}

        {/* Atmosphere halo */}
        <circle cx={cx} cy={cy} r={earthR + 10} fill="none" stroke="hsl(160 84% 39% / 0.08)" strokeWidth={6} />
        <circle cx={cx} cy={cy} r={earthR + 6} fill="url(#atmos3d)" />

        {/* Earth sphere */}
        <circle cx={cx} cy={cy} r={earthR} fill="url(#earth3d)" />

        {/* Surface detail - grid on earth */}
        <g clipPath="url(#earthClip3d)">
          {[-60, -30, 0, 30, 60].map((lat) => {
            const y = cy - (lat / 90) * earthR
            return (
              <line key={`l3-${lat}`} x1={cx - earthR} y1={y} x2={cx + earthR} y2={y}
                stroke="hsl(160 84% 39% / 0.06)" strokeWidth={0.5} />
            )
          })}
          {Array.from({ length: 8 }, (_, i) => {
            const ang = ((i * 45 + rotation) * Math.PI) / 180
            const x1 = cx + earthR * 0.9 * Math.cos(ang)
            return (
              <line key={`m3-${i}`} x1={cx} y1={cy - earthR} x2={x1} y2={cy + earthR}
                stroke="hsl(160 84% 39% / 0.06)" strokeWidth={0.5} />
            )
          })}

          {/* Continent blobs */}
          <ellipse cx={cx - 35 + ((rotation * 0.3) % 70)} cy={cy - 28} rx={22} ry={18}
            fill="hsl(160 25% 16%)" opacity={0.6} />
          <ellipse cx={cx + 25 + ((rotation * 0.3) % 70)} cy={cy + 10} rx={16} ry={28}
            fill="hsl(160 25% 16%)" opacity={0.5} />
          <ellipse cx={cx + 55 + ((rotation * 0.2) % 50)} cy={cy - 18} rx={30} ry={20}
            fill="hsl(160 25% 16%)" opacity={0.45} />
          <ellipse cx={cx - 55 + ((rotation * 0.25) % 50)} cy={cy + 35} rx={14} ry={10}
            fill="hsl(160 25% 16%)" opacity={0.4} />
        </g>

        {/* Highlight rim */}
        <circle cx={cx - 25} cy={cy - 30} r={earthR - 8} fill="none"
          stroke="hsl(210 20% 90% / 0.04)" strokeWidth={earthR * 0.5} clipPath="url(#earthClip3d)" />

        {/* Orbital rings and satellites */}
        {satellites.map((sat, i) => {
          const orbitRx = earthR + 35 + i * 32
          const orbitRy = earthR + 18 + i * 22
          const speed = 1 - i * 0.12
          const angle = ((rotation * speed + sat.orbitOffset * 0.036) * Math.PI) / 180
          const satX = cx + orbitRx * Math.cos(angle)
          const satY = cy + orbitRy * Math.sin(angle) * 0.55
          const tilt = 12 + i * 14

          return (
            <g key={sat.id}>
              {/* Orbit ring */}
              <ellipse
                cx={cx} cy={cy} rx={orbitRx} ry={orbitRy * 0.55}
                fill="none" stroke={sat.color} strokeWidth={0.6} opacity={0.15}
                strokeDasharray="4,6"
                transform={`rotate(${tilt}, ${cx}, ${cy})`}
              />

              {/* Connector */}
              <line x1={cx} y1={cy} x2={satX} y2={satY}
                stroke={sat.color} strokeWidth={0.3} opacity={0.1} strokeDasharray="2,4" />

              {/* Satellite marker */}
              <circle cx={satX} cy={satY} r={4} fill={sat.color} filter="url(#glow3d)" opacity={0.9} />
              <circle cx={satX} cy={satY} r={6} fill="none" stroke={sat.color} strokeWidth={0.4} opacity={0.3}>
                <animate attributeName="r" values="5;10;5" dur="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" />
              </circle>

              {/* Label */}
              <rect x={satX + 9} y={satY - 12} width={sat.name.split(" ")[0].length * 6.5 + 10} height={18}
                rx={3} fill="hsl(225 22% 8% / 0.85)" stroke={`${sat.color}30`} strokeWidth={0.5} />
              <text x={satX + 14} y={satY - 2} fill={sat.color} fontSize={9} fontFamily="monospace" fontWeight="600">
                {sat.name.split(" ")[0]}
              </text>
              <text x={satX + 14} y={satY + 7} fill="hsl(215 12% 48%)" fontSize={7} fontFamily="monospace">
                {sat.altitude} km
              </text>
            </g>
          )
        })}

        {/* Center label */}
        <text x={cx} y={cy + earthR + 22} textAnchor="middle" fill="hsl(215 12% 36%)" fontSize={9} fontFamily="monospace">
          LIVE ORBITAL TRACKING
        </text>
      </svg>
        </div>
      </div>
    </>
  )
}

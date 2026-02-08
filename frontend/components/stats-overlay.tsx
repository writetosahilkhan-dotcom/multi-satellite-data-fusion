"use client"

import { AlertTriangle, Users, Satellite, MapPin, TrendingUp } from "lucide-react"

interface StatCardProps {
  icon: React.ReactNode
  value: string
  label: string
  trend?: string
  variant?: "default" | "warning" | "success" | "danger"
}

function StatCard({ icon, value, label, trend, variant = "default" }: StatCardProps) {
  const variantColors = {
    default: "text-primary",
    warning: "text-amber-500",
    success: "text-emerald-500",
    danger: "text-destructive"
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-md border border-border bg-card/50 p-3">
      <div className="flex items-center gap-2">
        <div className={`flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 ${variantColors[variant]}`}>
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold leading-none text-foreground">{value}</span>
          {trend && (
            <div className="mt-0.5 flex items-center gap-1">
              <TrendingUp className="h-2.5 w-2.5 text-emerald-500" />
              <span className="text-[9px] font-medium text-emerald-500">{trend}</span>
            </div>
          )}
        </div>
      </div>
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  )
}

export function StatsOverlay() {
  return (
    <div className="absolute left-3 top-14 z-[1000] w-[220px]">
      <div className="rounded-lg border border-border bg-card/95 p-3 shadow-lg backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-foreground">Live Impact Metrics</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <StatCard
            icon={<Satellite className="h-3.5 w-3.5" />}
            value="8"
            label="Satellites"
            variant="default"
          />
          <StatCard
            icon={<AlertTriangle className="h-3.5 w-3.5" />}
            value="23"
            label="Active Alerts"
            variant="warning"
          />
          <StatCard
            icon={<Users className="h-3.5 w-3.5" />}
            value="2.3M"
            label="Protected"
            trend="+15%"
            variant="success"
          />
          <StatCard
            icon={<MapPin className="h-3.5 w-3.5" />}
            value="15"
            label="Regions"
            variant="default"
          />
        </div>

        <div className="mt-3 rounded-md border border-primary/20 bg-primary/10 p-2">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary">
              <span className="text-[9px] font-bold text-primary-foreground">!</span>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-foreground">
                24-48hr Advance Warning
              </p>
              <p className="text-[9px] text-muted-foreground">
                Early detection saves lives
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Search, Plus, X, ArrowUp, Gauge, Filter, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useDebounce } from "@/hooks/use-debounce"
import type { Satellite, SatellitePosition } from "@/lib/satellite-types"

interface SatelliteSidebarProps {
  satellites: Satellite[]
  positions: Record<string, SatellitePosition>
  selectedId: string
  onSelect: (id: string) => void
  onAdd: (name: string, noradId: string) => void
  onRemove: (id: string) => void
  backendStatus: "checking" | "online" | "offline"
}

type OrbitFilter = "all" | "leo" | "meo" | "geo"

export function SatelliteSidebar({
  satellites,
  positions,
  selectedId,
  onSelect,
  onAdd,
  onRemove,
  backendStatus,
}: SatelliteSidebarProps) {
  const [search, setSearch] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newNoradId, setNewNoradId] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [orbitFilter, setOrbitFilter] = useState<OrbitFilter>("all")
  const debouncedSearch = useDebounce(search, 300)

  const filtered = satellites.filter((s) => {
    // Text search
    const matchesSearch =
      s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      s.noradId.includes(debouncedSearch)
    if (!matchesSearch) return false

    // Orbit type filter
    if (orbitFilter === "leo") return s.altitude < 2000
    if (orbitFilter === "meo") return s.altitude >= 2000 && s.altitude < 35000
    if (orbitFilter === "geo") return s.altitude >= 35000
    return true
  })

  const handleAdd = () => {
    if (newName.trim() && newNoradId.trim()) {
      onAdd(newName.trim(), newNoradId.trim())
      setNewName("")
      setNewNoradId("")
      setAddOpen(false)
    }
  }

  const orbitFilters: { value: OrbitFilter; label: string; count: number }[] = [
    { value: "all", label: "All Orbits", count: satellites.length },
    { value: "leo", label: "LEO", count: satellites.filter((s) => s.altitude < 2000).length },
    { value: "meo", label: "MEO", count: satellites.filter((s) => s.altitude >= 2000 && s.altitude < 35000).length },
    { value: "geo", label: "GEO", count: satellites.filter((s) => s.altitude >= 35000).length },
  ]

  return (
    <aside className="flex h-full w-72 flex-shrink-0 flex-col border-r border-border bg-card">
      {/* Search */}
      <div className="flex items-center gap-2 border-b border-border p-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or NORAD..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 border-border bg-secondary pl-8 text-xs text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/50"
          />
        </div>
        <Button
          size="icon"
          variant="outline"
          className={`h-8 w-8 flex-shrink-0 border-border bg-transparent ${filtersOpen ? "text-primary border-primary/30" : "text-muted-foreground"}`}
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <Filter className="h-3.5 w-3.5" />
          <span className="sr-only">Toggle filters</span>
        </Button>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              className="h-8 w-8 flex-shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="sr-only">Add satellite</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="border-border bg-card text-foreground sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-foreground">Track New Satellite</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3 pt-2">
              <Input
                placeholder="Satellite name (e.g. LANDSAT-9)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
              />
              <Input
                placeholder="NORAD catalog ID"
                value={newNoradId}
                onChange={(e) => setNewNoradId(e.target.value)}
                className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
              />
              <Button
                onClick={handleAdd}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Begin Tracking
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter panel */}
      {filtersOpen && (
        <div className="border-b border-border bg-secondary/30 px-3 py-2.5">
          <span className="mb-2 block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Orbit Type
          </span>
          <div className="flex flex-wrap gap-1.5">
            {orbitFilters.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setOrbitFilter(f.value)}
                className={`rounded-md px-2 py-1 text-[10px] font-medium transition-colors ${
                  orbitFilter === f.value
                    ? "bg-primary/15 text-primary"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.label}
                <span className="ml-1 font-mono opacity-60">{f.count}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Count label */}
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Tracked Objects
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">
          {filtered.length}/{satellites.length}
        </span>
      </div>

      {/* Satellite List */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-0.5 px-2 pb-2">
          {filtered.map((sat) => {
            const pos = positions[sat.id]
            const isSelected = sat.id === selectedId
            const orbitType = sat.altitude >= 35000 ? "GEO" : sat.altitude >= 2000 ? "MEO" : "LEO"
            return (
              <button
                key={sat.id}
                type="button"
                onClick={() => onSelect(sat.id)}
                className={`group relative flex w-full flex-col gap-1 rounded-md px-3 py-2.5 text-left transition-colors ${
                  isSelected ? "bg-primary/10" : "hover:bg-secondary/80"
                }`}
              >
                {isSelected && (
                  <div className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full ring-2 ring-offset-1"
                      style={{
                        backgroundColor: sat.color,
                        ringColor: `${sat.color}40`,
                        ringOffsetColor: "transparent",
                      }}
                    />
                    <span className={`text-xs font-medium ${isSelected ? "text-foreground" : "text-secondary-foreground"}`}>
                      {sat.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="rounded bg-secondary px-1 py-0.5 text-[9px] font-mono text-muted-foreground">
                      {orbitType}
                    </span>
                    <button
                      type="button"
                      className="flex h-5 w-5 items-center justify-center rounded opacity-0 transition-opacity hover:bg-destructive/20 group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemove(sat.id)
                      }}
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 pl-4 text-[10px] text-muted-foreground">
                  <span className="font-mono">#{sat.noradId}</span>
                  {pos && (
                    <>
                      <span className="flex items-center gap-0.5 text-primary">
                        <ArrowUp className="h-2.5 w-2.5" />
                        {sat.altitude.toFixed(0)} km
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Gauge className="h-2.5 w-2.5" />
                        {pos.velocity.toFixed(2)} km/s
                      </span>
                    </>
                  )}
                </div>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No satellites match your filters
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom status */}
      <div className="flex items-center justify-between border-t border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="text-[10px] text-muted-foreground">Systems nominal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className={`h-1.5 w-1.5 rounded-full ${
              backendStatus === "online"
                ? "bg-emerald-500"
                : backendStatus === "offline"
                  ? "bg-amber-500"
                  : "bg-muted-foreground animate-pulse"
            }`}
          />
          <span className="text-[9px] font-mono text-muted-foreground uppercase">
            API {backendStatus}
          </span>
        </div>
      </div>
    </aside>
  )
}

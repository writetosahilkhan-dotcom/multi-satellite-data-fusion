"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import type { Satellite, SatellitePosition } from "@/lib/satellite-types"
import { DEFAULT_SATELLITES, calculatePosition } from "@/lib/satellite-data"
import { checkBackendHealth } from "@/lib/api-service"

export function useSatellites() {
  const [satellites, setSatellites] = useState<Satellite[]>(DEFAULT_SATELLITES)
  const [selectedId, setSelectedId] = useState<string>("insat-3d")
  const [fusionSelectedIds, setFusionSelectedIds] = useState<Set<string>>(
    () => new Set(DEFAULT_SATELLITES.map((s) => s.id))
  )
  const [positions, setPositions] = useState<Record<string, SatellitePosition>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking")

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth().then((ok) => setBackendStatus(ok ? "online" : "offline"))
    const interval = setInterval(async () => {
      const ok = await checkBackendHealth()
      setBackendStatus(ok ? "online" : "offline")
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Update positions every second
  useEffect(() => {
    const update = () => {
      const now = Date.now()
      const newPositions: Record<string, SatellitePosition> = {}
      let hasChanges = false
      
      for (const sat of satellites) {
        const pos = calculatePosition(
          now,
          sat.orbitOffset,
          sat.altitude,
          sat.geostationary,
          sat.fixedLng
        )
        newPositions[sat.id] = pos
        
        // Check if position changed significantly (>0.01 degrees)
        const oldPos = positions[sat.id]
        if (!oldPos || 
            Math.abs(oldPos.lat - pos.lat) > 0.01 || 
            Math.abs(oldPos.lng - pos.lng) > 0.01) {
          hasChanges = true
        }
      }
      
      if (hasChanges) {
        setPositions(newPositions)
      }
      
      // Mark as loaded after first update
      if (isLoading) {
        setIsLoading(false)
      }
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [satellites, positions, isLoading])

  const addSatellite = useCallback((name: string, noradId: string) => {
    const colors = ["#EC4899", "#8B5CF6", "#F97316", "#14B8A6", "#EF4444"]
    const newSat: Satellite = {
      id: `sat-${Date.now()}`,
      name: name.toUpperCase(),
      noradId,
      color: colors[Math.floor(Math.random() * colors.length)],
      orbitOffset: Math.random() * 10000,
      altitude: 300 + Math.floor(Math.random() * 1200),
      velocity: 5 + Math.random() * 3,
      launchDate: new Date().toISOString().split("T")[0],
      inclination: 30 + Math.random() * 60,
      period: 90 + Math.random() * 50,
    }
    setSatellites((prev) => [...prev, newSat])
    setSelectedId(newSat.id)
    setFusionSelectedIds((prev) => new Set([...prev, newSat.id]))
  }, [])

  const removeSatellite = useCallback(
    (id: string) => {
      setSatellites((prev) => prev.filter((s) => s.id !== id))
      setFusionSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      if (selectedId === id) {
        setSelectedId((prev) => {
          const remaining = satellites.filter((s) => s.id !== id)
          return remaining.length > 0 ? remaining[0].id : ""
        })
      }
    },
    [selectedId, satellites]
  )

  const toggleFusionSelect = useCallback((id: string) => {
    setFusionSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const selected = useMemo(
    () => satellites.find((s) => s.id === selectedId) ?? null,
    [satellites, selectedId]
  )

  const fusionSatellites = useMemo(
    () => satellites.filter((s) => fusionSelectedIds.has(s.id)),
    [satellites, fusionSelectedIds]
  )

  return {
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
    isLoading,
  }
}

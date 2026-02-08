"use client"

import { useState, useEffect, useMemo } from "react"
import { Globe, Clock, Signal, Activity, Play, PanelRightClose, PanelRightOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSatellites } from "@/hooks/use-satellites"
import { DEFAULT_RISK_ZONES } from "@/lib/satellite-data"
import { SatelliteSidebar } from "@/components/satellite-sidebar"
import { WorldMap } from "@/components/world-map"
import { DetailPanel } from "@/components/detail-panel"
import { Earth3DModal } from "@/components/earth-3d-modal"
import { DemoPlayer } from "@/components/demo-player"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { memo } from "react"
import { KERALA_FLOOD_SCENARIO, type ScenarioStep } from "@/lib/demo-scenarios"
import { playSound } from "@/lib/sound-effects"

export function Dashboard() {
  const [hasPlayedStartupSound, setHasPlayedStartupSound] = useState(false)
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
    isLoading,
  } = useSatellites()

  const [show3D, setShow3D] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [statsResetKey, setStatsResetKey] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>()
  const [mapZoom, setMapZoom] = useState<number | undefined>()
  const [riskZones, setRiskZones] = useState<
    { lat: number; lng: number; radius: number; severity: string }[]
  >(DEFAULT_RISK_ZONES)
  const { toast } = useToast()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      
      if (e.key === 'd' || e.key === 'D') {
        setDemoMode(prev => !prev)
      } else if (e.key === 'v' || e.key === 'V') {
        setShow3D(prev => !prev)
      } else if (e.key === 'Escape' && demoMode) {
        setDemoMode(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [demoMode])

  // Zoom map to Kerala when demo mode starts
  useEffect(() => {
    if (demoMode) {
      setMapCenter({ lat: 10.8505, lng: 76.2711 }) // Kerala coordinates
      setMapZoom(7)
      setStatsResetKey(prev => prev + 1) // Trigger counter animation
    } else {
      setMapCenter(undefined)
      setMapZoom(undefined)
    }
  }, [demoMode])

  // Play Jadu sound when loading completes
  useEffect(() => {
    if (!isLoading && !hasPlayedStartupSound) {
      console.log('Loading complete, attempting to play sound...')
      const timer = setTimeout(() => {
        const audio = new Audio('/jadu-sound.mp3')
        audio.volume = 0.7
        
        // Add event listeners for debugging
        audio.addEventListener('loadeddata', () => {
          console.log('Audio loaded successfully')
        })
        audio.addEventListener('error', (e) => {
          console.error('Audio load error:', e)
        })
        
        audio.play()
          .then(() => {
            console.log('Audio playing successfully')
            setHasPlayedStartupSound(true)
          })
          .catch(err => {
            console.error('Audio play error:', err)
            // Try playing on user interaction
            const playOnClick = () => {
              audio.play()
                .then(() => {
                  console.log('Audio played after user interaction')
                  setHasPlayedStartupSound(true)
                  document.removeEventListener('click', playOnClick)
                })
                .catch(e => console.error('Still failed:', e))
            }
            document.addEventListener('click', playOnClick, { once: true })
          })
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [isLoading, hasPlayedStartupSound])

  // Handle demo scenario steps
  const handleDemoStep = (step: ScenarioStep) => {
    try {
      // Validate step data
      if (!step || !step.title) {
        console.warn("Invalid demo step received", step)
        return
      }

      // Play appropriate sound
      if (step.data?.type === 'danger' || step.data?.severity === 'critical') {
        playSound.critical()
      } else if (step.data?.type === 'warning' || step.data?.severity === 'medium') {
        playSound.warning()
      } else {
        playSound.info()
      }

      // Check if this is the final step - play success sound for mission completion
      if (step.time >= KERALA_FLOOD_SCENARIO.duration - 5) {
        setTimeout(() => {
          playSound.success() // Subtle success tone instead of celebration
        }, 1000)
      }

      // Show toast notification for each step
      const messageData = step.data?.message || step.title
      const toastVariant = 
        step.data?.type === 'danger' || step.data?.severity === 'critical' ? 'destructive' :
        step.data?.type === 'warning' || step.data?.severity === 'medium' ? 'default' :
        'default'

      toast({
        title: step.title,
        description: messageData,
        variant: toastVariant as any,
      })

      // Update risk zones based on step
      if (step.action === 'risk_increase' && step.data?.zones) {
        const newZones = Array.from({ length: step.data.zones }, (_, i) => ({
          lat: KERALA_FLOOD_SCENARIO.location.lat + (Math.random() - 0.5) * 2,
          lng: KERALA_FLOOD_SCENARIO.location.lng + (Math.random() - 0.5) * 2,
          radius: 20 + Math.random() * 30,
          severity: step.data.riskLevel || 'high'
        }))
        setRiskZones(newZones)
      }
    } catch (err) {
      console.error("Demo step error:", err)
      toast({
        title: "Demo Error",
        description: "Failed to process demo step",
        variant: "destructive",
      })
    }
  }

  // Show loading indicator with extended duration
  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">Initializing Satellite Network</p>
            <p className="text-xs text-muted-foreground">Calculating orbital positions...</p>
          </div>
        </div>
      </div>
    )
  }

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
          
          {/* Backend Status */}
          <div className="flex items-center gap-1.5">
            <div className={`h-1.5 w-1.5 rounded-full ${
              backendStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 
              backendStatus === 'offline' ? 'bg-red-500' : 
              'bg-amber-500 animate-pulse'
            }`} />
            <span className="text-[10px] text-muted-foreground">
              {backendStatus === 'online' ? 'API Connected' : 
               backendStatus === 'offline' ? 'API Offline' : 
               'Checking...'}
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 border-primary/30 bg-primary/10 px-3 text-xs text-primary hover:bg-primary/20"
            onClick={() => setDemoMode(true)}
          >
            <Play className="h-3.5 w-3.5" />
            Demo Mode
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 border-border bg-transparent px-3 text-xs text-foreground hover:bg-secondary"
            onClick={() => setShow3D(true)}
          >
            <Globe className="h-3.5 w-3.5 text-primary" />
            3D View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 border-border bg-transparent px-3 text-xs text-foreground hover:bg-secondary"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
            {sidebarOpen ? 'Hide' : 'Show'} Panel
          </Button>
        </div>
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
          mapCenter={mapCenter}
          mapZoom={mapZoom}
          statsResetKey={statsResetKey}
        />
        {sidebarOpen && (
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
        )}
      </div>

      <Earth3DModal
        open={show3D}
        onClose={() => setShow3D(false)}
        satellites={satellites}
      />

      {/* Demo Mode Player */}
      {demoMode && (
        <DemoPlayer
          scenario={KERALA_FLOOD_SCENARIO}
          onClose={() => {
            setDemoMode(false)
            setShowCelebration(false)
            setRiskZones(DEFAULT_RISK_ZONES)
          }}
          onStepChange={handleDemoStep}
        />      )}

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

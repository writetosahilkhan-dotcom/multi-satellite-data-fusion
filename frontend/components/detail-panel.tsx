"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TelemetryTab } from "@/components/tabs/telemetry-tab"
import { RiskTab } from "@/components/tabs/risk-tab"
import { ISROTab } from "@/components/tabs/isro-tab"
import { FusionTab } from "@/components/tabs/fusion-tab"
import type { Satellite, SatellitePosition } from "@/lib/satellite-types"

interface DetailPanelProps {
  satellite: Satellite | null
  position: SatellitePosition | undefined
  onRiskZonesChange?: (
    zones: { lat: number; lng: number; radius: number; severity: string }[]
  ) => void
  satellites: Satellite[]
  fusionSelectedIds: Set<string>
  toggleFusionSelect: (id: string) => void
  fusionSatellites: Satellite[]
  positions: Record<string, SatellitePosition>
}

export function DetailPanel({
  satellite,
  position,
  onRiskZonesChange,
  satellites,
  fusionSelectedIds,
  toggleFusionSelect,
  fusionSatellites,
  positions,
}: DetailPanelProps) {
  return (
    <aside className="flex h-full w-[380px] flex-shrink-0 flex-col border-l border-border bg-card">
      <Tabs defaultValue="telemetry" className="flex h-full flex-col">
        <div className="border-b border-border px-3 pt-2 pb-0">
          <TabsList className="h-8 w-full justify-start gap-0 rounded-none border-none bg-transparent p-0">
            {["telemetry", "risk", "isro", "fusion"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="relative h-8 rounded-none border-b-2 border-transparent px-3 text-xs capitalize text-muted-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="telemetry" className="mt-0 flex-1 overflow-hidden">
          <TelemetryTab satellite={satellite} position={position} />
        </TabsContent>
        <TabsContent value="risk" className="mt-0 flex-1 overflow-hidden">
          <RiskTab onRiskZonesChange={onRiskZonesChange} />
        </TabsContent>
        <TabsContent value="isro" className="mt-0 flex-1 overflow-hidden">
          <ISROTab />
        </TabsContent>
        <TabsContent value="fusion" className="mt-0 flex-1 overflow-hidden">
          <FusionTab
            satellites={satellites}
            fusionSelectedIds={fusionSelectedIds}
            toggleFusionSelect={toggleFusionSelect}
            fusionSatellites={fusionSatellites}
            positions={positions}
          />
        </TabsContent>
      </Tabs>
    </aside>
  )
}

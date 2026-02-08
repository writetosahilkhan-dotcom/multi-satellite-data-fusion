"use client"

import { useState, useEffect } from "react"
import { Smartphone, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MobileWarning() {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768
      setShow(isMobile && !dismissed)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [dismissed])

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative mx-4 max-w-sm rounded-lg border border-border bg-card p-6 shadow-2xl">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 h-6 w-6"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
            <Smartphone className="h-6 w-6 text-amber-500" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-foreground">Desktop Recommended</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This application is optimized for desktop viewing. For the best experience, please access it from a larger screen (768px+).
            </p>
          </div>
          
          <Button
            onClick={() => setDismissed(true)}
            className="w-full"
          >
            Continue Anyway
          </Button>
        </div>
      </div>
    </div>
  )
}

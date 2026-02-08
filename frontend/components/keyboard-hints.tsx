"use client"

import { useState, useEffect } from "react"
import { Zap, X } from "lucide-react"

export function KeyboardHints() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 8000)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleKey = () => setShow(false)
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  if (!show) return null

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-fade-in">
      <div className="relative rounded-lg border border-border bg-card/95 p-4 shadow-xl backdrop-blur-sm">
        <button
          onClick={() => setShow(false)}
          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/80"
        >
          <X className="h-3 w-3" />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          
          <div className="space-y-2">
            <p className="text-xs font-semibold text-foreground">Keyboard Shortcuts</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">D</kbd>
                <span>Toggle Demo Mode</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">V</kbd>
                <span>3D Orbital View</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">ESC</kbd>
                <span>Exit Demo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

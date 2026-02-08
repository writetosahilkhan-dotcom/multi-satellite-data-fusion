"use client"

import { useState, useEffect } from "react"
import { Play, Pause, RotateCcw, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { DemoScenario, ScenarioStep } from "@/lib/demo-scenarios"

interface DemoPlayerProps {
  scenario: DemoScenario
  onClose: () => void
  onStepChange: (step: ScenarioStep) => void
}

export function DemoPlayer({ scenario, onClose, onStepChange }: DemoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // Auto-start demo
  useEffect(() => {
    setIsPlaying(true)
  }, [])

  // Demo playback logic
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const newTime = prev + 0.1
        if (newTime >= scenario.duration) {
          setIsPlaying(false)
          return scenario.duration
        }
        return newTime
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isPlaying, scenario.duration])

  // Trigger steps at correct times
  useEffect(() => {
    try {
      const currentStep = scenario.steps.find(
        (step, index) =>
          step.time <= currentTime &&
          (index === scenario.steps.length - 1 || scenario.steps[index + 1].time > currentTime)
      )

      if (currentStep) {
        const stepIndex = scenario.steps.indexOf(currentStep)
        if (stepIndex !== currentStepIndex) {
          setCurrentStepIndex(stepIndex)
          onStepChange(currentStep)
        }
      }
    } catch (err) {
      console.error("Demo step error:", err)
      setIsPlaying(false)
    }
  }, [currentTime, scenario.steps, currentStepIndex, onStepChange])

  const handlePlayPause = () => setIsPlaying(!isPlaying)
  
  const handleRestart = () => {
    setCurrentTime(0)
    setCurrentStepIndex(0)
    setIsPlaying(true)
  }

  const currentStep = scenario.steps[currentStepIndex]
  const progress = (currentTime / scenario.duration) * 100

  return (
    <div className="fixed bottom-4 left-1/2 z-[2000] w-[600px] -translate-x-1/2">
      <div className="rounded-lg border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-sm">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{scenario.name}</h3>
            <p className="text-xs text-muted-foreground">{scenario.description}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Current Step Info */}
        {currentStep && (
          <div className="mb-3 rounded-md border border-primary/20 bg-primary/10 p-3">
            <div className="mb-1 flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span className="text-xs font-semibold text-primary">
                Step {currentStepIndex + 1}/{scenario.steps.length}
              </span>
            </div>
            <h4 className="mb-0.5 text-sm font-semibold text-foreground">
              {currentStep.title}
            </h4>
            <p className="text-xs text-muted-foreground">
              {currentStep.description}
            </p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mb-3">
          <Progress value={progress} className="h-2" />
          <div className="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>{currentTime.toFixed(1)}s</span>
            <span>{scenario.duration}s</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestart}
            className="h-8"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Restart
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handlePlayPause}
            className="h-8"
          >
            {isPlaying ? (
              <>
                <Pause className="mr-1.5 h-3.5 w-3.5" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-1.5 h-3.5 w-3.5" />
                Play
              </>
            )}
          </Button>
        </div>

        {/* Timeline markers */}
        <div className="relative mt-3 h-12">
          {scenario.steps.map((step, index) => {
            const position = (step.time / scenario.duration) * 100
            const isActive = index <= currentStepIndex
            return (
              <div
                key={index}
                className="absolute top-0"
                style={{ left: `${position}%` }}
              >
                <div
                  className={`h-2 w-2 -translate-x-1/2 rounded-full border-2 transition-colors ${
                    isActive
                      ? "border-primary bg-primary"
                      : "border-muted-foreground bg-background"
                  }`}
                />
                <div className="absolute left-1/2 top-3 w-16 -translate-x-1/2">
                  <p className="text-center text-[9px] text-muted-foreground">
                    {step.title.split(" ")[0]}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

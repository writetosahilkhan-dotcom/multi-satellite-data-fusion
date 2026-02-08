"use client"

import { useEffect, useState } from "react"
import confetti from "canvas-confetti"

interface ConfettiCelebrationProps {
  trigger: boolean
  duration?: number
}

export function ConfettiCelebration({ trigger, duration = 3000 }: ConfettiCelebrationProps) {
  useEffect(() => {
    if (!trigger) return

    const end = Date.now() + duration

    const colors = ["#10B981", "#06B6D4", "#8B5CF6", "#F59E0B"]

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    frame()

    // Big burst at start
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors,
    })
  }, [trigger, duration])

  return null
}

interface AnimatedCounterProps {
  value: number
  duration?: number
  suffix?: string
  decimals?: number
}

export function AnimatedCounter({ value, duration = 1500, suffix = "", decimals = 0 }: AnimatedCounterProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number | null = null
    const startValue = 0

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)

      // Easing function (ease out cubic)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentCount = startValue + (value - startValue) * easeOut

      setCount(currentCount)

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setCount(value)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  const formatNumber = (num: number) => {
    if (decimals > 0) {
      return num.toFixed(decimals)
    }
    return Math.floor(num).toLocaleString()
  }

  return (
    <span>
      {formatNumber(count)}
      {suffix}
    </span>
  )
}

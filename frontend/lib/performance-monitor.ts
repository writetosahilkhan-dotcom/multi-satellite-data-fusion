/**
 * Performance monitoring utility for production debugging
 */

type PerformanceMetrics = {
  renderTime: number
  updateTime: number
  memoryUsage?: number
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics[]> = new Map()
  private readonly maxSamples = 50
  private enabled = process.env.NODE_ENV === 'development'

  startMeasure(label: string): () => void {
    if (!this.enabled) return () => {}
    
    const start = performance.now()
    return () => {
      const duration = performance.now() - start
      this.recordMetric(label, { renderTime: duration, updateTime: 0 })
    }
  }

  recordMetric(label: string, metric: Partial<PerformanceMetrics>) {
    if (!this.enabled) return

    const existing = this.metrics.get(label) || []
    existing.push({
      renderTime: metric.renderTime || 0,
      updateTime: metric.updateTime || 0,
      memoryUsage: this.getMemoryUsage(),
    })

    // Keep only last N samples
    if (existing.length > this.maxSamples) {
      existing.shift()
    }

    this.metrics.set(label, existing)
  }

  getMetrics(label: string): PerformanceMetrics | null {
    const samples = this.metrics.get(label)
    if (!samples || samples.length === 0) return null

    const avg = {
      renderTime: samples.reduce((sum, m) => sum + m.renderTime, 0) / samples.length,
      updateTime: samples.reduce((sum, m) => sum + m.updateTime, 0) / samples.length,
      memoryUsage: samples[samples.length - 1].memoryUsage,
    }

    return avg
  }

  getAllMetrics(): Record<string, PerformanceMetrics | null> {
    const result: Record<string, PerformanceMetrics | null> = {}
    for (const label of this.metrics.keys()) {
      result[label] = this.getMetrics(label)
    }
    return result
  }

  logMetrics() {
    if (!this.enabled) return

    const metrics = this.getAllMetrics()
    console.group('📊 Performance Metrics')
    for (const [label, data] of Object.entries(metrics)) {
      if (data) {
        console.log(
          `${label}: ${data.renderTime.toFixed(2)}ms render, ` +
          `${data.memoryUsage ? `${(data.memoryUsage / 1024 / 1024).toFixed(1)}MB` : 'N/A'}`
        )
      }
    }
    console.groupEnd()
  }

  private getMemoryUsage(): number | undefined {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory?.usedJSHeapSize
    }
    return undefined
  }

  reset(label?: string) {
    if (label) {
      this.metrics.delete(label)
    } else {
      this.metrics.clear()
    }
  }
}

export const perfMonitor = new PerformanceMonitor()

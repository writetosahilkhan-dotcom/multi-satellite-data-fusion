/**
 * Sound effects utility for demo mode
 * Plays audio notifications for different alert types
 */

class SoundEffects {
  private audioContext: AudioContext | null = null
  private enabled = true

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) {
    if (!this.audioContext || !this.enabled) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.value = frequency
    oscillator.type = type
    gainNode.gain.value = volume

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + duration)
  }

  // Info notification - soft beep
  info() {
    this.playTone(523.25, 0.1, 'sine', 0.2) // C5
  }

  // Warning - double beep
  warning() {
    this.playTone(659.25, 0.1, 'sine', 0.25) // E5
    setTimeout(() => this.playTone(659.25, 0.1, 'sine', 0.25), 150)
  }

  // Critical alert - urgent triple beep
  critical() {
    this.playTone(880.0, 0.15, 'square', 0.3) // A5
    setTimeout(() => this.playTone(880.0, 0.15, 'square', 0.3), 180)
    setTimeout(() => this.playTone(880.0, 0.2, 'square', 0.35), 360)
  }

  // Success - ascending chord
  success() {
    this.playTone(523.25, 0.15, 'sine', 0.2) // C5
    setTimeout(() => this.playTone(659.25, 0.15, 'sine', 0.2), 100) // E5
    setTimeout(() => this.playTone(783.99, 0.2, 'sine', 0.25), 200) // G5
  }

  // Celebration - victory fanfare
  celebration() {
    const notes = [
      { freq: 523.25, time: 0, duration: 0.15 },    // C5
      { freq: 659.25, time: 150, duration: 0.15 },  // E5
      { freq: 783.99, time: 300, duration: 0.2 },   // G5
      { freq: 1046.5, time: 500, duration: 0.3 },   // C6
    ]

    notes.forEach(note => {
      setTimeout(() => this.playTone(note.freq, note.duration, 'sine', 0.3), note.time)
    })
  }

  // Dramatic escalation sound
  escalation() {
    const baseFreq = 440
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        this.playTone(baseFreq + (i * 50), 0.08, 'triangle', 0.15 + (i * 0.03))
      }, i * 80)
    }
  }

  // Enable/disable sounds
  toggle(enabled: boolean) {
    this.enabled = enabled
  }
}

// Singleton instance
export const soundEffects = new SoundEffects()

// Convenience functions
export const playSound = {
  info: () => soundEffects.info(),
  warning: () => soundEffects.warning(),
  critical: () => soundEffects.critical(),
  success: () => soundEffects.success(),
  celebration: () => soundEffects.celebration(),
  escalation: () => soundEffects.escalation(),
}

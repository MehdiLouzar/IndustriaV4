class EmergencyMemoryMonitor {
  private interval: NodeJS.Timeout | null = null
  private alertThreshold = 500 * 1024 * 1024
  private criticalThreshold = 800 * 1024 * 1024

  start() {
    if (typeof window === 'undefined') return
    this.interval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
        const used = memory.usedJSHeapSize
        const usedMB = Math.round(used / 1048576)
        console.log(`\uD83D\uDC0F RAM: ${usedMB}MB`)
        if (used > this.criticalThreshold) {
          console.error('\uD83D\uDEA8 M\u00E9moire critique! Nettoyage d\'urgence...')
          this.emergencyCleanup()
        } else if (used > this.alertThreshold) {
          console.warn('\u26A0\uFE0F M\u00E9moire \u00E9lev\u00E9e:', usedMB + 'MB')
        }
      }
    }, 5000)
  }

  emergencyCleanup() {
    if (typeof apiCache !== 'undefined') {
      apiCache.clear()
    }
    if ('gc' in window) {
      try {
        ;((window as unknown) as { gc?: () => void }).gc?.()
      } catch {
        /* noop */
      }
    }
    console.error('\uD83D\uDEA8 NETTOYAGE D\'URGENCE EFFECTU\u00C9')
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }
}

export const emergencyMonitor = new EmergencyMemoryMonitor()

if (typeof window !== 'undefined') {
  emergencyMonitor.start()
  window.addEventListener('beforeunload', () => {
    emergencyMonitor.stop()
  })
}

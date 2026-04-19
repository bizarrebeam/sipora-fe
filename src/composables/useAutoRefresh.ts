import { ref, onUnmounted, watch, type Ref } from 'vue'

/**
 * useAutoRefresh — Composable for silent background data polling.
 *
 * Combines interval-based polling with the Page Visibility API so that
 * list/table views automatically pick up new entries without requiring
 * the user to manually reload the browser.
 *
 * Features:
 *  • Configurable polling interval (default 30 s).
 *  • Immediate re-fetch when the browser tab becomes visible again.
 *  • pause() / resume() helpers to suspend polling while modals are open.
 *  • Automatic cleanup on component unmount (no memory leaks).
 *  • Skips fetch when the tab is hidden (saves bandwidth).
 *
 * @example
 * ```ts
 * const { pause, resume } = useAutoRefresh(fetchLogs, { intervalMs: 30_000 })
 * // pause() when a dialog opens, resume() when it closes
 * ```
 *
 * @param fetchFn   The async function to call on each tick / visibility change.
 * @param options   Configuration object.
 */

interface AutoRefreshOptions {
  /** Polling interval in milliseconds. Set to 0 to disable polling (visibility-only mode). */
  intervalMs?: number
  /** Whether to re-fetch when the tab becomes visible again. Default: true. */
  refetchOnVisible?: boolean
  /** Optional reactive refs — polling is paused while ANY of them is `true`. */
  pauseWhen?: Ref<boolean>[]
}

export function useAutoRefresh(
  fetchFn: () => Promise<void> | void,
  options: AutoRefreshOptions = {},
) {
  const {
    intervalMs = 30_000,
    refetchOnVisible = true,
    pauseWhen = [],
  } = options

  const isPaused = ref(false)
  let intervalId: ReturnType<typeof setInterval> | null = null

  // ── Helpers ──────────────────────────────────────────────────────────
  function shouldSkip() {
    // Skip if manually paused
    if (isPaused.value) return true
    // Skip if any external pause condition is active
    if (pauseWhen.some((r) => r.value)) return true
    // Skip if tab is not visible (save bandwidth)
    if (document.hidden) return true
    return false
  }

  async function tick() {
    if (shouldSkip()) return
    try {
      await fetchFn()
    } catch {
      // Silently swallow — the fetch function itself handles its own errors
    }
  }

  // ── Interval Polling ─────────────────────────────────────────────────
  function startInterval() {
    stopInterval()
    if (intervalMs > 0) {
      intervalId = setInterval(tick, intervalMs)
    }
  }

  function stopInterval() {
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  // ── Visibility Re-fetch ──────────────────────────────────────────────
  function onVisibilityChange() {
    if (!document.hidden && refetchOnVisible) {
      tick()
    }
  }

  if (refetchOnVisible) {
    document.addEventListener('visibilitychange', onVisibilityChange)
  }

  // ── Public API ───────────────────────────────────────────────────────
  function pause() {
    isPaused.value = true
  }

  function resume() {
    isPaused.value = false
  }

  // Watch the pause refs to automatically restart/stop the interval
  if (pauseWhen.length > 0) {
    watch(
      pauseWhen,
      () => {
        // No action needed — `shouldSkip` already checks pauseWhen on each tick.
        // The interval keeps ticking but tick() is a no-op while paused.
      },
    )
  }

  // ── Lifecycle ────────────────────────────────────────────────────────
  startInterval()

  onUnmounted(() => {
    stopInterval()
    if (refetchOnVisible) {
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  })

  return { pause, resume, isPaused }
}

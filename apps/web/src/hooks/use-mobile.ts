import { useSyncExternalStore } from "react"

const MOBILE_BREAKPOINT = 768
const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function subscribeToViewport(listener: () => void) {
  const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY)
  mediaQuery.addEventListener("change", listener)
  return () => mediaQuery.removeEventListener("change", listener)
}

function getViewportSnapshot() {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches
}

function getServerViewportSnapshot() {
  return false
}

export function useIsMobile() {
  return useSyncExternalStore(
    subscribeToViewport,
    getViewportSnapshot,
    getServerViewportSnapshot
  )
}

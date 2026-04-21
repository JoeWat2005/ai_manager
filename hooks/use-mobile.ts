import * as React from "react"

// Define breakpoint (same as Tailwind md breakpoint)
const MOBILE_BREAKPOINT = 768

// Custom React hook to detect if screen is mobile-sized
export function useIsMobile() {

  // State to store whether the screen is mobile
  // Starts as undefined because we don’t know yet (SSR-safe)
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    // Create a media query listener
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

    // Function that runs when screen size changes
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    // Listen for screen size changes
    mql.addEventListener("change", onChange)

    // Set initial value immediately
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)

    // Cleanup listener when component unmounts
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Return boolean (force undefined → false)
  return !!isMobile
}
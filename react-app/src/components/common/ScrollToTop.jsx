import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Scrolls window to top on route change. Without this, navigating from a long
// page (Cheatsheet, Chapters) to a new page leaves the user mid-scroll, which
// looks like the new page failed to render.
export default function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    // Use auto (not smooth) so the new page is in view before its enter
    // animation begins — smooth scroll racing with framer-motion looks broken.
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])
  return null
}

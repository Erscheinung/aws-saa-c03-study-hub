import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useThemeStore } from '../../hooks/useTheme'
import Navbar from './Navbar'
import Footer from './Footer'
import PageTransition from '../common/PageTransition'
import LoadingFallback from '../common/LoadingFallback'

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  main: {
    flex: 1,
    padding: '20px',
  },
}

// Suspense sits INSIDE a keyed PageTransition so each route owns its own
// fallback (see the earlier lazy-chunk race explanation). AnimatePresence was
// removed because PageTransition no longer defines an `exit` variant — without
// one, AnimatePresence was keeping the previous page mounted alongside the new
// one during navigation, producing a "pages repeat" flicker. A plain keyed
// remount gives a clean fade-in with no overlap.
export default function Layout() {
  const { theme } = useThemeStore()
  const location = useLocation()

  return (
    <div style={styles.wrapper} data-theme={theme}>
      <Navbar />
      <main style={styles.main}>
        <PageTransition key={location.pathname}>
          <Suspense fallback={<LoadingFallback />}>
            <Outlet />
          </Suspense>
        </PageTransition>
      </main>
      <Footer />
    </div>
  )
}

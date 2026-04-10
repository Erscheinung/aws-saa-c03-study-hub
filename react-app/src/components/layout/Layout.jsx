import { Suspense } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
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

// PHASE 2 FIX:
// The previous structure had Suspense at App.jsx wrapping the whole router,
// which caused a race: when a lazy chunk resolved, the entire Layout
// remounted *and* AnimatePresence(mode="wait") was still waiting for the
// previous PageTransition to finish exiting. The new page would never enter
// until the user refreshed.
//
// Fix: move Suspense INSIDE the keyed PageTransition. Now each route mount
// owns its own Suspense fallback — Layout never unmounts, exit/enter stay
// in sync, and `initial={false}` skips the first-mount animation that was
// hiding content on cold loads.
export default function Layout() {
  const { theme } = useThemeStore()
  const location = useLocation()

  return (
    <div style={styles.wrapper} data-theme={theme}>
      <Navbar />
      <main style={styles.main}>
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={location.pathname}>
            <Suspense fallback={<LoadingFallback />}>
              <Outlet />
            </Suspense>
          </PageTransition>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}

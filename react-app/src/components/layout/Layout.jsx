import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useThemeStore } from '../../hooks/useTheme'
import Navbar from './Navbar'
import Footer from './Footer'
import PageTransition from '../common/PageTransition'

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

export default function Layout() {
  const { theme } = useThemeStore()
  const location = useLocation()

  return (
    <div style={styles.wrapper} data-theme={theme}>
      <Navbar />
      <main style={styles.main}>
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}

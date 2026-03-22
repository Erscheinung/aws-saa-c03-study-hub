import { useEffect, lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useThemeStore } from './hooks/useTheme'
import Layout from './components/layout/Layout'

const Home = lazy(() => import('./pages/Home'))
const MindMap = lazy(() => import('./pages/MindMap'))
const FillBlanks = lazy(() => import('./pages/FillBlanks'))
const ConnectionGame = lazy(() => import('./pages/ConnectionGame'))
const Deduction = lazy(() => import('./pages/Deduction'))
const CloudWalker = lazy(() => import('./pages/CloudWalker'))
const Cheatsheet = lazy(() => import('./pages/Cheatsheet'))
const Chapters = lazy(() => import('./pages/Chapters'))

function LoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      color: 'var(--text-secondary)',
      fontSize: '1.1rem',
      gap: '0.75rem',
    }}>
      <div style={{
        width: 24, height: 24,
        border: '3px solid var(--border-color)',
        borderTopColor: 'var(--accent-orange)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      Loading...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function App() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="mindmap" element={<MindMap />} />
          <Route path="exercises">
            <Route path="fill-blanks" element={<FillBlanks />} />
            <Route path="connection-game" element={<ConnectionGame />} />
            <Route path="deduction" element={<Deduction />} />
          </Route>
          <Route path="games">
            <Route path="cloud-walker" element={<CloudWalker />} />
          </Route>
          <Route path="cheatsheet" element={<Cheatsheet />} />
          <Route path="chapters" element={<Chapters />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

import { useEffect, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useThemeStore } from './hooks/useTheme'
import Layout from './components/layout/Layout'
import ScrollToTop from './components/common/ScrollToTop'

const Home = lazy(() => import('./pages/Home'))
const MindMap = lazy(() => import('./pages/MindMap'))
const FillBlanks = lazy(() => import('./pages/FillBlanks'))
const ConnectionGame = lazy(() => import('./pages/ConnectionGame'))
const Deduction = lazy(() => import('./pages/Deduction'))
const CloudWalker = lazy(() => import('./pages/CloudWalker'))
const CloudWalker3D = lazy(() => import('./pages/CloudWalker3D'))
const Cheatsheet = lazy(() => import('./pages/Cheatsheet'))
const Chapters = lazy(() => import('./pages/Chapters'))
const Jeopardy = lazy(() => import('./pages/Jeopardy'))
const ServiceSorter = lazy(() => import('./pages/ServiceSorter'))

export default function App() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Suspense lives inside Layout (per-route) — see Layout.jsx for the
  // race-condition explanation.
  return (
    <>
      <ScrollToTop />
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
            <Route path="cloud-walker-3d" element={<CloudWalker3D />} />
            <Route path="jeopardy" element={<Jeopardy />} />
            <Route path="service-sorter" element={<ServiceSorter />} />
          </Route>
          <Route path="cheatsheet" element={<Cheatsheet />} />
          <Route path="chapters" element={<Chapters />} />
        </Route>
      </Routes>
    </>
  )
}

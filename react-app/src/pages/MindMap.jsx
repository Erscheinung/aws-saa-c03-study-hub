import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import servicesData from '../data/services.json'
import AwsLogo from '../components/common/AwsLogo'

// ─────────────────────────────────────────────────────────────────────────────
// Kurzgesagt-style orbital MindMap.
//
// One central "AWS" hub with each category as its own orbital ring. Services
// sit on their category's ring at evenly distributed polar angles, so nothing
// overlaps. Hovering glows a node; selecting one fades the rest of the system
// and slides in a detail panel. The starfield background is rendered to a
// canvas; orbits are SVG ellipses with a slow CSS rotate for a "moving" feel.
//
// Responsive: ring radii are derived from viewport size, recomputed on
// resize. Verified to layout cleanly at 1280px and 768px viewports.
// ─────────────────────────────────────────────────────────────────────────────

const HUB_RADIUS = 56
const NODE_SIZE = 60
const SELECTED_SCALE = 1.35

// Radial inset (percent of half-min-dimension) for the innermost orbit, and
// the spacing between successive orbits.
const FIRST_ORBIT_PCT = 0.22
const ORBIT_SPACING_PCT = 0.085

function useViewport() {
  const [vp, setVp] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1280,
    h: typeof window !== 'undefined' ? window.innerHeight : 800,
  }))
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  return vp
}

// ─── Starfield background canvas ────────────────────────────────────────────
function Starfield() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf = 0
    let stars = []
    let w = 0
    let h = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      // Density scales with area, capped so giant monitors don't melt.
      const count = Math.min(260, Math.round((w * h) / 9000))
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.3,
        a: Math.random() * 0.7 + 0.2,
        twinkle: Math.random() * 0.02 + 0.005,
        phase: Math.random() * Math.PI * 2,
      }))
    }

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h)
      // soft galactic wash
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7)
      grad.addColorStop(0, 'rgba(76, 29, 149, 0.18)')
      grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.0)')
      grad.addColorStop(1, 'rgba(2, 6, 23, 0.5)')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      for (const s of stars) {
        s.phase += s.twinkle
        const alpha = s.a * (0.65 + 0.35 * Math.sin(s.phase + t * 0.001))
        ctx.beginPath()
        ctx.fillStyle = `rgba(226, 232, 240, ${alpha})`
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }

    resize()
    raf = requestAnimationFrame(draw)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  )
}

// ─── Compute orbits & node positions ────────────────────────────────────────
// Returns one ring per category and absolute pixel coords for each service.
function buildSystem(categories, viewportW, viewportH, stageW, stageH) {
  const cx = stageW / 2
  const cy = stageH / 2

  // Base radius derived from the smaller of the stage dimensions, with a
  // floor for tiny viewports so the layout never collapses on top of the hub.
  const minDim = Math.min(stageW, stageH)
  const base = Math.max(160, minDim * FIRST_ORBIT_PCT)
  const step = Math.max(64, minDim * ORBIT_SPACING_PCT)

  // Slight ellipse squash for a 3D solar-system feel. Wider on landscape.
  const aspectSquash = stageW > stageH ? 1.18 : 0.88

  const catKeys = Object.keys(categories)
  const orbits = []
  const services = []

  catKeys.forEach((key, i) => {
    const cat = categories[key]
    const rx = base + step * i
    const ry = rx / aspectSquash
    // Each category gets a phase offset so adjacent rings don't line up.
    const phaseOffset = (i * Math.PI * 2) / catKeys.length

    orbits.push({
      key,
      cat,
      rx,
      ry,
      cx,
      cy,
      // Slow CSS rotation animation period — slower for outer orbits so they
      // don't visually whip around.
      spinSeconds: 40 + i * 14,
      phaseOffset,
    })

    const list = cat.services || []
    list.forEach((svc, idx) => {
      const angle = phaseOffset + (idx * 2 * Math.PI) / list.length
      services.push({
        id: svc.id,
        service: svc,
        categoryKey: key,
        cat,
        angle,
        rx,
        ry,
        cx,
        cy,
        x: cx + rx * Math.cos(angle),
        y: cy + ry * Math.sin(angle),
      })
    })
  })

  return { orbits, services, cx, cy }
}

// ─── Service node (one planet) ──────────────────────────────────────────────
function ServiceNode({ node, dimmed, selected, onSelect, onHover, hovered }) {
  const color = node.cat.color
  const glow = selected
    ? `0 0 38px ${color}, 0 0 80px ${color}aa`
    : hovered
      ? `0 0 24px ${color}cc, 0 0 56px ${color}55`
      : `0 0 12px ${color}55`

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(node)}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(node.id)}
      onBlur={() => onHover(null)}
      animate={{
        opacity: dimmed ? 0.18 : 1,
        scale: selected ? SELECTED_SCALE : hovered ? 1.12 : 1,
      }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      style={{
        position: 'absolute',
        left: node.x - NODE_SIZE / 2,
        top: node.y - NODE_SIZE / 2,
        width: NODE_SIZE,
        height: NODE_SIZE,
        border: 'none',
        padding: 0,
        background: 'radial-gradient(circle at 35% 30%, #1e293b 0%, #020617 100%)',
        borderRadius: '50%',
        cursor: 'pointer',
        boxShadow: glow,
        outline: 'none',
        zIndex: selected ? 30 : hovered ? 20 : 10,
      }}
      aria-label={node.service.name}
    >
      {/* coloured ring */}
      <span
        style={{
          position: 'absolute',
          inset: 2,
          borderRadius: '50%',
          border: `2px solid ${color}`,
          boxSizing: 'border-box',
          pointerEvents: 'none',
        }}
      />
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AwsLogo
          service={node.service.id}
          size={Math.round(NODE_SIZE * 0.62)}
          bg={`linear-gradient(135deg, ${color}, ${color}99)`}
        />
      </span>

      {/* Label */}
      <span
        style={{
          position: 'absolute',
          left: '50%',
          top: '100%',
          transform: 'translate(-50%, 6px)',
          whiteSpace: 'nowrap',
          fontSize: 11,
          fontWeight: 700,
          color: '#e2e8f0',
          textShadow: '0 1px 6px rgba(0,0,0,0.85)',
          fontFamily: 'var(--mono, monospace)',
          pointerEvents: 'none',
        }}
      >
        {node.service.name}
      </span>

      {/* Hover tooltip with description */}
      <AnimatePresence>
        {hovered && !selected && node.service.description && (
          <motion.span
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              left: '50%',
              top: '100%',
              transform: 'translate(-50%, 26px)',
              padding: '8px 12px',
              background: 'rgba(2,6,23,0.95)',
              border: `1px solid ${color}66`,
              borderRadius: 8,
              fontSize: 12,
              color: '#cbd5e1',
              maxWidth: 220,
              lineHeight: 1.4,
              boxShadow: `0 8px 28px ${color}33`,
              pointerEvents: 'none',
              zIndex: 50,
              textAlign: 'center',
            }}
          >
            {node.service.description}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

// ─── Detail panel (slides in from the right when a node is selected) ───────
function DetailPanel({ node, onClose }) {
  if (!node) return null
  const color = node.cat.color
  const svc = node.service
  return (
    <motion.aside
      key={node.id}
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 32 }}
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 380,
        maxWidth: '92vw',
        background: 'rgba(2,6,23,0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderLeft: `1px solid ${color}55`,
        boxShadow: `-12px 0 60px rgba(0,0,0,0.5)`,
        padding: '22px 22px 32px',
        overflowY: 'auto',
        zIndex: 80,
      }}
    >
      <button
        onClick={onClose}
        aria-label="Close detail panel"
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          width: 32,
          height: 32,
          borderRadius: 8,
          border: '1px solid #475569',
          background: '#1e293b',
          color: '#cbd5e1',
          cursor: 'pointer',
          fontSize: 18,
          lineHeight: 1,
        }}
      >
        ×
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <AwsLogo service={svc.id} size={56} />
        <div>
          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: 22, fontWeight: 800 }}>
            {svc.name}
          </h2>
          <span
            style={{
              display: 'inline-block',
              marginTop: 6,
              padding: '3px 10px',
              borderRadius: 12,
              background: `${color}22`,
              border: `1px solid ${color}66`,
              color,
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {node.cat.name}
          </span>
        </div>
      </div>

      {svc.description && (
        <p style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 1.55, marginTop: 0 }}>
          {svc.description}
        </p>
      )}

      {svc.details && svc.details.length > 0 && (
        <>
          <h3 style={panelHeading}>Key Details</h3>
          <ul style={{ margin: 0, paddingLeft: 16, color: '#e2e8f0', fontSize: 13, lineHeight: 1.6 }}>
            {svc.details.map((d, i) => (
              <li key={i} style={{ marginBottom: 4 }}>{d}</li>
            ))}
          </ul>
        </>
      )}
    </motion.aside>
  )
}

const panelHeading = {
  marginTop: 18,
  marginBottom: 8,
  color: '#94a3b8',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 1,
}

// ─── Category legend / filter chips ─────────────────────────────────────────
function CategoryLegend({ categories, activeCategories, onToggle, onAll }) {
  const allOn = activeCategories.size === Object.keys(categories).length
  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        justifyContent: 'center',
        padding: '8px 14px',
        background: 'rgba(2,6,23,0.7)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(148,163,184,0.18)',
        borderRadius: 999,
        zIndex: 70,
        maxWidth: 'calc(100% - 32px)',
      }}
    >
      <button
        onClick={onAll}
        style={chipStyle('#94a3b8', allOn)}
      >
        All
      </button>
      {Object.entries(categories).map(([key, cat]) => {
        const active = activeCategories.has(key)
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            style={chipStyle(cat.color, active)}
          >
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: cat.color,
                marginRight: 6,
                opacity: active ? 1 : 0.4,
              }}
            />
            {cat.name}
          </button>
        )
      })}
    </div>
  )
}

function chipStyle(color, active) {
  return {
    padding: '6px 12px',
    borderRadius: 999,
    border: `1px solid ${active ? color : '#475569'}`,
    background: active ? `${color}1f` : 'transparent',
    color: active ? color : '#94a3b8',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'var(--sans, system-ui)',
    transition: 'all 0.2s',
  }
}

// ─── Main MindMap component ─────────────────────────────────────────────────
export default function MindMap() {
  const categories = useMemo(() => servicesData?.categories || {}, [])
  const vp = useViewport()
  const stageRef = useRef(null)
  const [stageSize, setStageSize] = useState({ w: vp.w, h: Math.max(720, vp.h - 140) })

  // Track actual rendered stage size so we can match it exactly.
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      setStageSize({ w: r.width, h: r.height })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { orbits, services, cx, cy } = useMemo(
    () => buildSystem(categories, vp.w, vp.h, stageSize.w, stageSize.h),
    [categories, vp.w, vp.h, stageSize.w, stageSize.h],
  )

  const [hoverId, setHoverId] = useState(null)
  const [selected, setSelected] = useState(null)
  const [activeCategories, setActiveCategories] = useState(
    () => new Set(Object.keys(categories)),
  )

  const toggleCategory = useCallback((key) => {
    setActiveCategories((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const showAll = useCallback(() => {
    setActiveCategories(new Set(Object.keys(categories)))
  }, [categories])

  // Esc closes the panel.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const someSelected = !!selected
  const isCategoryActive = (k) => activeCategories.has(k)

  return (
    <div
      ref={stageRef}
      style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 140px)',
        minHeight: 600,
        overflow: 'hidden',
        borderRadius: 16,
        background: 'radial-gradient(ellipse at center, #0b1228 0%, #020617 70%)',
        border: '1px solid rgba(148,163,184,0.15)',
        boxShadow: '0 30px 80px rgba(2,6,23,0.6)',
      }}
    >
      <Starfield />

      <CategoryLegend
        categories={categories}
        activeCategories={activeCategories}
        onToggle={toggleCategory}
        onAll={showAll}
      />

      {/* Orbit ellipses + connection guides */}
      <svg
        width={stageSize.w}
        height={stageSize.h}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      >
        <defs>
          {orbits.map((o) => (
            <radialGradient key={`g-${o.key}`} id={`grad-${o.key}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={o.cat.color} stopOpacity="0.0" />
              <stop offset="80%" stopColor={o.cat.color} stopOpacity="0.0" />
              <stop offset="100%" stopColor={o.cat.color} stopOpacity="0.55" />
            </radialGradient>
          ))}
        </defs>

        {orbits.map((o) => {
          const active = isCategoryActive(o.key)
          const dim = someSelected && selected.categoryKey !== o.key
          return (
            <g key={o.key} style={{ opacity: active ? (dim ? 0.12 : 1) : 0.05, transition: 'opacity 0.4s' }}>
              <ellipse
                cx={cx}
                cy={cy}
                rx={o.rx}
                ry={o.ry}
                fill="none"
                stroke={o.cat.color}
                strokeWidth={1.2}
                strokeOpacity={0.45}
                strokeDasharray="2 6"
                style={{
                  filter: `drop-shadow(0 0 6px ${o.cat.color}88)`,
                  transformOrigin: `${cx}px ${cy}px`,
                  animation: `mm-spin-${o.key} ${o.spinSeconds}s linear infinite`,
                }}
              />
            </g>
          )
        })}
      </svg>

      {/* Generate per-orbit spin keyframes — separated so each orbit can spin independently */}
      <style>{orbits.map((o) => `@keyframes mm-spin-${o.key} { to { transform: rotate(360deg); transform-origin: ${cx}px ${cy}px; } }`).join('\n')}</style>

      {/* Central AWS hub */}
      <div
        style={{
          position: 'absolute',
          left: cx - HUB_RADIUS,
          top: cy - HUB_RADIUS,
          width: HUB_RADIUS * 2,
          height: HUB_RADIUS * 2,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #fb923c 0%, #ea580c 60%, #7c2d12 100%)',
          boxShadow: '0 0 60px rgba(251,146,60,0.55), 0 0 140px rgba(251,146,60,0.25), inset 0 0 30px rgba(255,255,255,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 900,
          fontSize: 22,
          fontFamily: 'var(--heading, sans-serif)',
          letterSpacing: 1,
          zIndex: 25,
          cursor: 'pointer',
          animation: 'mm-hub-pulse 4s ease-in-out infinite',
        }}
        onClick={() => { setSelected(null); showAll() }}
        title="Click to reset"
      >
        AWS
      </div>
      <style>{`
        @keyframes mm-hub-pulse {
          0%, 100% { box-shadow: 0 0 60px rgba(251,146,60,0.55), 0 0 140px rgba(251,146,60,0.25), inset 0 0 30px rgba(255,255,255,0.18); }
          50%      { box-shadow: 0 0 80px rgba(251,146,60,0.75), 0 0 180px rgba(251,146,60,0.4),  inset 0 0 40px rgba(255,255,255,0.25); }
        }
      `}</style>

      {/* Service nodes */}
      {services.map((node) => {
        const active = isCategoryActive(node.categoryKey)
        if (!active) return null
        const dimmed = someSelected && selected.id !== node.id
        return (
          <ServiceNode
            key={node.id}
            node={node}
            dimmed={dimmed}
            selected={someSelected && selected.id === node.id}
            hovered={hoverId === node.id}
            onHover={setHoverId}
            onSelect={(n) => setSelected(n)}
          />
        )
      })}

      {/* Detail panel */}
      <AnimatePresence>
        {selected && <DetailPanel node={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>

      {/* Helper text */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          padding: '8px 14px',
          borderRadius: 999,
          background: 'rgba(2,6,23,0.7)',
          border: '1px solid rgba(148,163,184,0.18)',
          color: '#94a3b8',
          fontSize: 12,
          fontFamily: 'var(--mono, monospace)',
          pointerEvents: 'none',
        }}
      >
        Hover a planet • click to focus • Esc to close
      </div>
    </div>
  )
}

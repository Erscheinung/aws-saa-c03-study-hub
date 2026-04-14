import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import servicesData from '../data/services.json'
import cheatsheetData from '../data/cheatsheet.json'
import AwsLogo from '../components/common/AwsLogo'

// Build a lookup from service name (normalized) → array of cheatsheet facts.
// cheatsheet.json and services.json use slightly different names
// ("ECS / Fargate" vs "ECS", "Route 53" vs "Route 53"), so we index by a
// normalized key and also split slash-separated names into aliases.
function normalizeServiceKey(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '')
}

const CHEAT_FACTS_BY_SERVICE = (() => {
  const out = {}
  for (const section of cheatsheetData.sections || []) {
    for (const item of section.items || []) {
      // Split on "/" or "&" so "WAF & Shield" and "ECS / Fargate" each
      // contribute to both underlying services.
      const aliases = String(item.service).split(/\s*[/&]\s*/)
      for (const alias of aliases) {
        const k = normalizeServiceKey(alias)
        if (!k) continue
        if (!out[k]) out[k] = []
        for (const fact of item.facts) {
          if (!out[k].includes(fact)) out[k].push(fact)
        }
      }
    }
  }
  return out
})()

function getCheatFactsForService(svc) {
  const k = normalizeServiceKey(svc.name)
  return CHEAT_FACTS_BY_SERVICE[k] || []
}

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

const SELECTED_SCALE = 1.35

// Layout constants scale down on narrow viewports so orbits don't collapse
// onto each other when the stage is phone-width.
function getLayoutMetrics(stageW) {
  const narrow = stageW < 640
  const tiny = stageW < 420
  return {
    HUB_RADIUS: tiny ? 30 : narrow ? 38 : 48,
    nodeSize: tiny ? 34 : narrow ? 42 : 52,
    TOP_RESERVED: narrow ? 64 : 84,
    BOTTOM_RESERVED: narrow ? 36 : 52,
    SIDE_RESERVED: tiny ? 18 : narrow ? 34 : 72,
    INNER_GAP: tiny ? 16 : narrow ? 22 : 36,
  }
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

// Per-category orbit "personality" — dash pattern, stroke weight, spin
// duration and direction are each matched to how the family *feels*:
//   compute     → rapid even ticks  (fast clock cycles)
//   storage     → sparse dots       (dense, barely-moving bulk data)
//   database    → dash-dot-dot      (stacked rows, steady)
//   networking  → pulse-gap         (packets streaming fast)
//   security    → reverse spin      (guardians watching the opposite way)
//   integration → long flowing dashes (messages in flight)
//   management  → minimal tick marks (quiet oversight)
// Unknown categories fall back to DEFAULT_ORBIT_STYLE.
const ORBIT_STYLES = {
  compute:     { dash: '8 4',        width: 1.6, seconds: 32,  direction: 1,  opacity: 0.6 },
  storage:     { dash: '1 5',        width: 1.8, seconds: 130, direction: 1,  opacity: 0.55 },
  database:    { dash: '10 3 2 3',   width: 1.6, seconds: 95,  direction: 1,  opacity: 0.6 },
  networking:  { dash: '3 3 1 3',    width: 1.4, seconds: 38,  direction: 1,  opacity: 0.65 },
  security:    { dash: '6 3 1 3',    width: 1.8, seconds: 70,  direction: -1, opacity: 0.6 },
  integration: { dash: '14 4 2 4',   width: 1.5, seconds: 55,  direction: 1,  opacity: 0.6 },
  management:  { dash: '2 10',       width: 1.2, seconds: 150, direction: -1, opacity: 0.5 },
}
const DEFAULT_ORBIT_STYLE = { dash: '2 6', width: 1.2, seconds: 60, direction: 1, opacity: 0.55 }

// ─── Compute orbits & node positions ────────────────────────────────────────
// Strategy: compute a safe outer-radius envelope from the stage dimensions
// (after reserving space for the filter pill on top and labels on the sides),
// then distribute orbits evenly between the innermost ring (just outside the
// AWS hub) and that outer cap. This guarantees every ring — including the
// outermost nodes and their labels — stays fully inside the stage regardless
// of viewport size or number of categories.
function buildSystem(categories, stageW, stageH) {
  const { HUB_RADIUS, nodeSize, TOP_RESERVED, BOTTOM_RESERVED, SIDE_RESERVED, INNER_GAP } =
    getLayoutMetrics(stageW)

  // Horizontal center stays mid-stage. Vertical center shifts down slightly
  // so the top filter pill never overlaps the outermost ring.
  const usableTop = TOP_RESERVED
  const usableBottom = stageH - BOTTOM_RESERVED
  const cx = stageW / 2
  const cy = (usableTop + usableBottom) / 2

  // Available half-dimensions from the center, after reserving margins.
  const halfW = Math.max(60, stageW / 2 - SIDE_RESERVED - nodeSize / 2)
  const halfH = Math.max(60, (usableBottom - usableTop) / 2 - nodeSize / 2)

  // Portrait stages squash vertically; landscape stages squash horizontally.
  const aspectSquash = stageW > stageH ? 1.18 : 0.9
  const outerRx = Math.max(halfW * 0.5, Math.min(halfW, halfH * aspectSquash))
  const outerRy = outerRx / aspectSquash

  const catKeys = Object.keys(categories)
  const ringCount = catKeys.length

  // Innermost orbit sits just outside the central hub with a gap, but never
  // past the outer envelope (on tiny screens we compress the hub gap too).
  let innerRx = HUB_RADIUS + INNER_GAP + nodeSize / 2
  if (ringCount > 1 && innerRx > outerRx * 0.55) {
    innerRx = outerRx * 0.35
  }
  const innerRy = innerRx / aspectSquash
  const stepRx = ringCount > 1 ? (outerRx - innerRx) / (ringCount - 1) : 0
  const stepRy = ringCount > 1 ? (outerRy - innerRy) / (ringCount - 1) : 0

  const orbits = []
  const services = []

  catKeys.forEach((key, i) => {
    const cat = categories[key]
    const rx = innerRx + stepRx * i
    const ry = innerRy + stepRy * i
    // Each category gets a phase offset so adjacent rings don't line up.
    const phaseOffset = (i * Math.PI * 2) / ringCount
    const style = ORBIT_STYLES[key] || DEFAULT_ORBIT_STYLE

    orbits.push({
      key,
      cat,
      rx,
      ry,
      cx,
      cy,
      spinSeconds: style.seconds,
      direction: style.direction,
      dash: style.dash,
      strokeWidth: style.width,
      baseOpacity: style.opacity,
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
        nodeSize: nodeSize,
        x: cx + rx * Math.cos(angle),
        y: cy + ry * Math.sin(angle),
      })
    })
  })

  return { orbits, services, cx, cy, HUB_RADIUS, nodeSize }
}

// ─── Service node (one planet) ──────────────────────────────────────────────
function ServiceNode({ node, dimmed, selected, onSelect, onHover, hovered }) {
  const color = node.cat.color
  const nodeSize = node.nodeSize
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
        left: node.x - nodeSize / 2,
        top: node.y - nodeSize / 2,
        width: nodeSize,
        height: nodeSize,
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
          size={Math.round(nodeSize * 0.62)}
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
  const cheatFacts = getCheatFactsForService(svc)
  // Dedupe: drop cheat facts that are substrings of an existing service
  // detail (or vice-versa) so the panel doesn't show the same thing twice.
  const details = svc.details || []
  const extraFacts = cheatFacts.filter(
    (f) => !details.some((d) => d.toLowerCase().includes(f.toLowerCase().slice(0, 18))),
  )
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

      {details.length > 0 && (
        <>
          <h3 style={panelHeading}>Key Details</h3>
          <ul style={panelList}>
            {details.map((d, i) => (
              <li key={i} style={panelListItem}>
                <span style={panelBullet(color)}>▸</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      {extraFacts.length > 0 && (
        <>
          <h3 style={panelHeading}>Exam Cheat-Sheet Facts</h3>
          <ul style={panelList}>
            {extraFacts.map((f, i) => (
              <li key={i} style={panelListItem}>
                <span style={panelBullet(color)}>▸</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div
        style={{
          marginTop: 22,
          padding: '10px 12px',
          background: `${color}0f`,
          border: `1px dashed ${color}55`,
          borderRadius: 10,
          color: '#cbd5e1',
          fontSize: 12,
          lineHeight: 1.5,
        }}
      >
        <div
          style={{
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            fontSize: 10,
            fontWeight: 700,
            color,
            marginBottom: 4,
          }}
        >
          Exam Lens
        </div>
        Map this service to its <strong style={{ color: '#f1f5f9' }}>"when to pick it"</strong> heuristic:
        skim the key details above, match keywords you saw in the question stem,
        and eliminate answer choices that don't share the same category
        ({node.cat.name}).
      </div>
    </motion.aside>
  )
}

const panelList = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  color: '#e2e8f0',
  fontSize: 13,
  lineHeight: 1.55,
}

const panelListItem = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  padding: '4px 0',
}

const panelBullet = (color) => ({
  color,
  flexShrink: 0,
  marginTop: 1,
  fontWeight: 800,
})

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
        gap: 6,
        flexWrap: 'nowrap',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '6px 10px',
        background: 'rgba(2,6,23,0.78)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(148,163,184,0.18)',
        borderRadius: 999,
        zIndex: 70,
        maxWidth: 'calc(100% - 32px)',
        overflowX: 'auto',
        scrollbarWidth: 'none',
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
    padding: '5px 10px',
    borderRadius: 999,
    border: `1px solid ${active ? color : '#475569'}`,
    background: active ? `${color}1f` : 'transparent',
    color: active ? color : '#94a3b8',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'var(--sans, system-ui)',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  }
}

// ─── Main MindMap component ─────────────────────────────────────────────────
export default function MindMap() {
  const categories = useMemo(() => servicesData?.categories || {}, [])
  const stageRef = useRef(null)
  const [stageSize, setStageSize] = useState({ w: 1280, h: 720 })

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

  const { orbits, services, cx, cy, HUB_RADIUS } = useMemo(
    () => buildSystem(categories, stageSize.w, stageSize.h),
    [categories, stageSize.w, stageSize.h],
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
        minHeight: 'min(600px, calc(100vh - 140px))',
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
              {/* Soft inner halo — same ellipse, fatter + more transparent — gives each
                  ring a distinct "thickness" so rings read as separate bands. */}
              <ellipse
                cx={cx}
                cy={cy}
                rx={o.rx}
                ry={o.ry}
                fill="none"
                stroke={o.cat.color}
                strokeWidth={o.strokeWidth + 4}
                strokeOpacity={0.08}
              />
              <ellipse
                cx={cx}
                cy={cy}
                rx={o.rx}
                ry={o.ry}
                fill="none"
                stroke={o.cat.color}
                strokeWidth={o.strokeWidth}
                strokeOpacity={o.baseOpacity}
                strokeDasharray={o.dash}
                strokeLinecap="round"
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

      {/* Generate per-orbit spin keyframes — each orbit gets its own direction so
          security/management visibly counter-rotate against the rest. */}
      <style>{orbits.map((o) => `@keyframes mm-spin-${o.key} { to { transform: rotate(${o.direction * 360}deg); transform-origin: ${cx}px ${cy}px; } }`).join('\n')}</style>

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

      {/* Helper caption — minimal corner text, no pill, so it can't be
          mistaken for a second filter bar. */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 14,
          color: 'rgba(148,163,184,0.55)',
          fontSize: 11,
          fontFamily: 'var(--mono, monospace)',
          letterSpacing: 0.3,
          pointerEvents: 'none',
        }}
      >
        hover · click · esc
      </div>
    </div>
  )
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import servicesData from '../data/services.json';

// ─── Constants ───────────────────────────────────────────────────────────────

const CANVAS_WIDTH = 5000;
const CANVAS_HEIGHT = 4000;
const CENTER_X = CANVAS_WIDTH / 2;
const CENTER_Y = CANVAS_HEIGHT / 2;
const HUB_RADIUS = 80;
const CATEGORY_RING_RADIUS = 500;
const SERVICE_RING_OFFSET = 220;
const SERVICE_SPREAD_ANGLE = 0.35;
const NODE_SIZE = 72;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.15;

// ─── Color & Style Variables ─────────────────────────────────────────────────

const cssVars = {
  '--bg': '#0f172a',
  '--surface': '#1e293b',
  '--surface-hover': '#334155',
  '--text': '#f1f5f9',
  '--text-muted': '#94a3b8',
  '--border': '#334155',
  '--overlay': 'rgba(15, 23, 42, 0.85)',
};

// ─── Helper: Compute Radial Positions ────────────────────────────────────────

function computeNodePositions(categories) {
  const catKeys = Object.keys(categories);
  const totalCategories = catKeys.length;
  const positions = {};
  const categoryPositions = {};

  catKeys.forEach((key, catIndex) => {
    const cat = categories[key];
    const sectorAngle = (2 * Math.PI * catIndex) / totalCategories - Math.PI / 2;

    const catX = CENTER_X + Math.cos(sectorAngle) * CATEGORY_RING_RADIUS;
    const catY = CENTER_Y + Math.sin(sectorAngle) * CATEGORY_RING_RADIUS;
    categoryPositions[key] = { x: catX, y: catY, angle: sectorAngle };

    const services = cat.services || [];
    const count = services.length;

    services.forEach((service, sIdx) => {
      const spreadStart = sectorAngle - (SERVICE_SPREAD_ANGLE * (count - 1)) / 2;
      const angle = count === 1 ? sectorAngle : spreadStart + SERVICE_SPREAD_ANGLE * sIdx;
      const ringRadius = CATEGORY_RING_RADIUS + SERVICE_RING_OFFSET;

      positions[service.id] = {
        x: CENTER_X + Math.cos(angle) * ringRadius,
        y: CENTER_Y + Math.sin(angle) * ringRadius,
        categoryKey: key,
      };
    });
  });

  return { positions, categoryPositions };
}

// ─── Helper: Clamp ───────────────────────────────────────────────────────────

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

// ─── Sub-component: Minimap ──────────────────────────────────────────────────

function Minimap({ zoom, panX, panY, viewportWidth, viewportHeight, categories, categoryPositions, nodePositions, activeCategories }) {
  const mmWidth = 180;
  const mmHeight = (CANVAS_HEIGHT / CANVAS_WIDTH) * mmWidth;
  const scale = mmWidth / CANVAS_WIDTH;

  const vpW = (viewportWidth / zoom) * scale;
  const vpH = (viewportHeight / zoom) * scale;
  const vpX = (-panX / zoom) * scale;
  const vpY = (-panY / zoom) * scale;

  return (
    <div style={{
      position: 'absolute', bottom: 16, right: 16,
      width: mmWidth, height: mmHeight,
      background: 'rgba(15,23,42,0.9)', border: '1px solid #475569',
      borderRadius: 8, overflow: 'hidden', zIndex: 50,
      pointerEvents: 'none',
    }}>
      {/* category cluster dots */}
      {Object.entries(categories).map(([key, cat]) => {
        if (!activeCategories.has(key)) return null;
        const cp = categoryPositions[key];
        if (!cp) return null;
        return (
          <div key={key} style={{
            position: 'absolute',
            left: cp.x * scale - 3, top: cp.y * scale - 3,
            width: 6, height: 6, borderRadius: '50%',
            background: cat.color, opacity: 0.8,
          }} />
        );
      })}

      {/* viewport rectangle */}
      <div style={{
        position: 'absolute',
        left: clamp(vpX, 0, mmWidth - 4), top: clamp(vpY, 0, mmHeight - 4),
        width: Math.min(vpW, mmWidth), height: Math.min(vpH, mmHeight),
        border: '1.5px solid #60a5fa', borderRadius: 2,
        background: 'rgba(96,165,250,0.1)',
      }} />
    </div>
  );
}

// ─── Sub-component: ZoomControls ─────────────────────────────────────────────

function ZoomControls({ zoom, onZoomIn, onZoomOut, onReset, onFit }) {
  const btnStyle = {
    width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#1e293b', border: '1px solid #475569', color: '#f1f5f9',
    borderRadius: 6, cursor: 'pointer', fontSize: 16, fontWeight: 600,
    transition: 'background 0.15s',
  };
  const hoverProps = {
    onMouseEnter: (e) => { e.currentTarget.style.background = '#334155'; },
    onMouseLeave: (e) => { e.currentTarget.style.background = '#1e293b'; },
  };

  return (
    <div style={{
      position: 'absolute', bottom: 16, left: 16,
      display: 'flex', flexDirection: 'column', gap: 6,
      background: 'rgba(15,23,42,0.9)', padding: 8,
      borderRadius: 10, border: '1px solid #475569', zIndex: 50,
    }}>
      <button style={btnStyle} onClick={onZoomIn} title="Zoom in" {...hoverProps}>+</button>
      <button style={btnStyle} onClick={onZoomOut} title="Zoom out" {...hoverProps}>-</button>
      <div style={{
        textAlign: 'center', fontSize: 11, color: '#94a3b8',
        padding: '2px 0', userSelect: 'none',
      }}>
        {Math.round(zoom * 100)}%
      </div>
      <button style={{ ...btnStyle, fontSize: 12 }} onClick={onReset} title="Reset zoom" {...hoverProps}>1:1</button>
      <button style={{ ...btnStyle, fontSize: 13 }} onClick={onFit} title="Fit to screen" {...hoverProps}>
        <span style={{ fontSize: 16 }}>&#x2922;</span>
      </button>
    </div>
  );
}

// ─── Sub-component: SearchBar ────────────────────────────────────────────────

function SearchBar({ query, onChange, results, onSelect, inputRef }) {
  return (
    <div style={{
      position: 'absolute', top: 68, left: '50%', transform: 'translateX(-50%)',
      zIndex: 50, width: 340, maxWidth: 'calc(100% - 32px)',
    }}>
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search services... (Ctrl+K)"
          style={{
            width: '100%', padding: '10px 14px 10px 38px',
            background: '#1e293b', border: '1px solid #475569',
            borderRadius: 10, color: '#f1f5f9', fontSize: 14,
            outline: 'none', boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => { e.target.style.borderColor = '#60a5fa'; }}
          onBlur={(e) => { e.target.style.borderColor = '#475569'; }}
        />
        <span style={{
          position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
          fontSize: 16, color: '#64748b', pointerEvents: 'none',
        }}>&#x1F50D;</span>
      </div>

      <AnimatePresence>
        {query.length > 0 && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              marginTop: 6, background: '#1e293b', border: '1px solid #475569',
              borderRadius: 10, overflow: 'hidden', maxHeight: 240, overflowY: 'auto',
            }}
          >
            {results.map((r) => (
              <div
                key={r.service.id}
                onClick={() => onSelect(r.service, r.categoryKey)}
                style={{
                  padding: '10px 14px', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: 10, borderBottom: '1px solid #334155',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#334155'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 18 }}>{r.service.icon}</span>
                <div>
                  <div style={{ color: '#f1f5f9', fontSize: 13, fontWeight: 500 }}>{r.service.name}</div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>{r.categoryLabel}</div>
                </div>
                <div style={{
                  marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%',
                  background: r.categoryColor,
                }} />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-component: CategoryFilter ───────────────────────────────────────────

function CategoryFilter({ categories, activeCategories, onToggle, onShowAll }) {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, zIndex: 40,
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '10px 16px', background: 'rgba(15,23,42,0.92)',
      borderBottom: '1px solid #334155', overflowX: 'auto',
      flexWrap: 'wrap',
    }}>
      <button
        onClick={onShowAll}
        style={{
          padding: '5px 12px', borderRadius: 14, fontSize: 12, fontWeight: 600,
          border: '1px solid #475569', cursor: 'pointer', whiteSpace: 'nowrap',
          background: activeCategories.size === Object.keys(categories).length ? '#3b82f6' : '#1e293b',
          color: '#f1f5f9', transition: 'background 0.2s',
        }}
      >
        All
      </button>
      {Object.entries(categories).map(([key, cat]) => {
        const active = activeCategories.has(key);
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            style={{
              padding: '5px 12px', borderRadius: 14, fontSize: 12,
              fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
              display: 'flex', alignItems: 'center', gap: 6,
              border: `1px solid ${active ? cat.color : '#475569'}`,
              background: active ? `${cat.color}22` : '#1e293b',
              color: active ? cat.color : '#64748b',
              transition: 'all 0.2s',
            }}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: cat.color, opacity: active ? 1 : 0.4,
              display: 'inline-block',
            }} />
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Sub-component: ServiceNode ──────────────────────────────────────────────

function ServiceNode({ service, x, y, color, isHighlighted, isSearchMatch, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: isHighlighted ? 1 : 0.2,
        scale: 1,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{
        position: 'absolute',
        left: x - NODE_SIZE / 2,
        top: y - NODE_SIZE / 2,
        width: NODE_SIZE,
        height: NODE_SIZE,
        cursor: 'pointer',
        zIndex: hovered ? 20 : 10,
        pointerEvents: isHighlighted ? 'auto' : 'none',
      }}
      onClick={(e) => { e.stopPropagation(); onClick(service); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        animate={{
          scale: hovered ? 1.18 : 1,
          boxShadow: hovered
            ? `0 0 24px ${color}88, 0 0 48px ${color}44`
            : isSearchMatch
              ? `0 0 16px ${color}66`
              : `0 2px 8px rgba(0,0,0,0.3)`,
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        style={{
          width: '100%', height: '100%', borderRadius: '50%',
          background: '#1e293b',
          border: `2.5px solid ${color}`,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          outline: isSearchMatch ? `2px solid ${color}` : 'none',
          outlineOffset: 3,
        }}
      >
        <span style={{ fontSize: 22, lineHeight: 1 }}>{service.icon}</span>
        <span style={{
          fontSize: 8, fontWeight: 600, color: '#e2e8f0',
          marginTop: 2, textAlign: 'center', lineHeight: 1.1,
          maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap', padding: '0 2px',
        }}>
          {service.name}
        </span>
      </motion.div>

      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.12 }}
            style={{
              position: 'absolute', top: NODE_SIZE + 8, left: '50%',
              transform: 'translateX(-50%)', zIndex: 100,
              background: '#1e293b', border: `1px solid ${color}55`,
              borderRadius: 8, padding: '8px 12px',
              minWidth: 180, maxWidth: 260,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              pointerEvents: 'none',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', marginBottom: 4 }}>
              {service.icon} {service.name}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>
              {service.description || 'AWS Service'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Sub-component: DetailPanel ──────────────────────────────────────────────

function DetailPanel({ service, category, color, onClose }) {
  if (!service) return null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: 380, maxWidth: '90vw',
        background: '#0f172a', borderLeft: `1px solid ${color}44`,
        zIndex: 60, overflowY: 'auto', padding: '24px 20px',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 12, right: 12,
          width: 32, height: 32, borderRadius: 8,
          background: '#1e293b', border: '1px solid #475569',
          color: '#94a3b8', cursor: 'pointer', fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#334155'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#1e293b'; }}
      >
        &times;
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: `${color}18`, border: `2px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, flexShrink: 0,
        }}>
          {service.icon}
        </div>
        <div>
          <h2 style={{ margin: 0, color: '#f1f5f9', fontSize: 20, fontWeight: 700 }}>
            {service.name}
          </h2>
          <span style={{
            display: 'inline-block', marginTop: 4,
            padding: '2px 10px', borderRadius: 10, fontSize: 11,
            fontWeight: 600, background: `${color}22`, color: color,
            border: `1px solid ${color}44`,
          }}>
            {category}
          </span>
        </div>
      </div>

      {/* Description */}
      {service.description && (
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 6px 0', color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
            Description
          </h4>
          <p style={{ margin: 0, color: '#cbd5e1', fontSize: 13, lineHeight: 1.6 }}>
            {service.description}
          </p>
        </div>
      )}

      {/* Key Details */}
      {service.details && service.details.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
            Key Details
          </h4>
          <ul style={{
            margin: 0, paddingLeft: 18, listStyle: 'none',
          }}>
            {service.details.map((d, i) => (
              <li key={i} style={{
                color: '#cbd5e1', fontSize: 13, lineHeight: 1.6,
                padding: '3px 0', position: 'relative',
              }}>
                <span style={{
                  position: 'absolute', left: -16, color: color, fontWeight: 700,
                }}>
                  &bull;
                </span>
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Limits */}
      {service.limits && service.limits.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
            Limits &amp; Quotas
          </h4>
          <div style={{
            background: '#1e293b', borderRadius: 8,
            border: '1px solid #334155', padding: 12,
          }}>
            {service.limits.map((l, i) => (
              <div key={i} style={{
                color: '#cbd5e1', fontSize: 12, lineHeight: 1.5,
                padding: '4px 0',
                borderBottom: i < service.limits.length - 1 ? '1px solid #334155' : 'none',
              }}>
                {l}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Use Case */}
      {service.useCase && (
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ margin: '0 0 6px 0', color: '#94a3b8', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
            Exam Tip / Use Case
          </h4>
          <div style={{
            background: `${color}10`, border: `1px solid ${color}33`,
            borderRadius: 8, padding: 12,
            color: '#e2e8f0', fontSize: 13, lineHeight: 1.6,
          }}>
            {service.useCase}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Sub-component: ConnectionLines (Canvas SVG overlay) ─────────────────────

function ConnectionLines({ categories, categoryPositions, activeCategories }) {
  return (
    <svg
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    >
      {Object.entries(categoryPositions).map(([key, pos]) => {
        if (!activeCategories.has(key)) return null;
        const cat = categories[key];
        return (
          <line
            key={key}
            x1={CENTER_X} y1={CENTER_Y}
            x2={pos.x} y2={pos.y}
            stroke={cat.color}
            strokeWidth={1.5}
            strokeDasharray="8 6"
            opacity={0.3}
          />
        );
      })}
    </svg>
  );
}

// ─── Main Component: MindMap ─────────────────────────────────────────────────

export default function MindMap() {
  const categories = servicesData?.categories || {};
  const { positions: nodePositions, categoryPositions } = computeNodePositions(categories);

  // ── State ──
  const [zoom, setZoom] = useState(0.45);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [activeCategories, setActiveCategories] = useState(() => new Set(Object.keys(categories)));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState(null);
  const [viewportSize, setViewportSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // ── Viewport resize tracking ──
  useEffect(() => {
    const handleResize = () => setViewportSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Keyboard shortcut: Ctrl+K ──
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setSelectedService(null);
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── Initial centering ──
  useEffect(() => {
    fitToScreen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Zoom helpers ──
  const applyZoom = useCallback((newZoom, focalX, focalY) => {
    setZoom((prevZoom) => {
      const clamped = clamp(newZoom, MIN_ZOOM, MAX_ZOOM);
      const ratio = clamped / prevZoom;
      setPanX((prev) => focalX - ratio * (focalX - prev));
      setPanY((prev) => focalY - ratio * (focalY - prev));
      return clamped;
    });
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const focalX = e.clientX - rect.left;
    const focalY = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    setZoom((prev) => {
      const newZoom = clamp(prev + delta * prev, MIN_ZOOM, MAX_ZOOM);
      const ratio = newZoom / prev;
      setPanX((px) => focalX - ratio * (focalX - px));
      setPanY((py) => focalY - ratio * (focalY - py));
      return newZoom;
    });
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const zoomIn = useCallback(() => {
    const cx = viewportSize.w / 2;
    const cy = viewportSize.h / 2;
    applyZoom(zoom + ZOOM_STEP * zoom, cx, cy);
  }, [zoom, viewportSize, applyZoom]);

  const zoomOut = useCallback(() => {
    const cx = viewportSize.w / 2;
    const cy = viewportSize.h / 2;
    applyZoom(zoom - ZOOM_STEP * zoom, cx, cy);
  }, [zoom, viewportSize, applyZoom]);

  const resetZoom = useCallback(() => {
    setZoom(1);
    setPanX(-(CANVAS_WIDTH - viewportSize.w) / 2);
    setPanY(-(CANVAS_HEIGHT - viewportSize.h) / 2);
  }, [viewportSize]);

  const fitToScreen = useCallback(() => {
    const padX = 100;
    const padY = 100;
    const zx = (viewportSize.w - padX * 2) / CANVAS_WIDTH;
    const zy = (viewportSize.h - padY * 2) / CANVAS_HEIGHT;
    const z = Math.min(zx, zy, 1);
    setZoom(z);
    setPanX((viewportSize.w - CANVAS_WIDTH * z) / 2);
    setPanY((viewportSize.h - CANVAS_HEIGHT * z) / 2);
  }, [viewportSize]);

  // ── Pan handlers ──
  const handlePointerDown = useCallback((e) => {
    if (e.target.closest('[data-no-pan]')) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - panX, y: e.clientY - panY });
  }, [panX, panY]);

  const handlePointerMove = useCallback((e) => {
    if (!isPanning) return;
    setPanX(e.clientX - panStart.x);
    setPanY(e.clientY - panStart.y);
  }, [isPanning, panStart]);

  const handlePointerUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // ── Touch pinch-to-zoom ──
  const lastTouchDist = useRef(null);
  const lastTouchCenter = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist.current = Math.hypot(dx, dy);
      lastTouchCenter.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
      };
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && lastTouchDist.current != null) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const scale = dist / lastTouchDist.current;
      const center = lastTouchCenter.current;

      const rect = containerRef.current.getBoundingClientRect();
      const focalX = center.x - rect.left;
      const focalY = center.y - rect.top;

      applyZoom(zoom * scale, focalX, focalY);
      lastTouchDist.current = dist;
    }
  }, [zoom, applyZoom]);

  const handleTouchEnd = useCallback(() => {
    lastTouchDist.current = null;
    lastTouchCenter.current = null;
  }, []);

  // ── Search ──
  const searchResults = searchQuery.length > 0
    ? Object.entries(categories).flatMap(([key, cat]) =>
        (cat.services || [])
          .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((s) => ({
            service: s,
            categoryKey: key,
            categoryLabel: cat.label,
            categoryColor: cat.color,
          }))
      ).slice(0, 12)
    : [];

  const searchMatchIds = new Set(searchResults.map((r) => r.service.id));

  const handleSearchSelect = useCallback((service, categoryKey) => {
    const pos = nodePositions[service.id];
    if (!pos) return;
    const targetZoom = 1.2;
    setZoom(targetZoom);
    setPanX(viewportSize.w / 2 - pos.x * targetZoom);
    setPanY(viewportSize.h / 2 - pos.y * targetZoom);
    setSearchQuery('');
    setSelectedService(service);
    setSelectedCategoryKey(categoryKey);
    setActiveCategories(new Set(Object.keys(categories)));
  }, [nodePositions, viewportSize, categories]);

  // ── Category filter ──
  const toggleCategory = useCallback((key) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const showAllCategories = useCallback(() => {
    setActiveCategories(new Set(Object.keys(categories)));
  }, [categories]);

  // ── Service click ──
  const handleServiceClick = useCallback((service, categoryKey) => {
    setSelectedService(service);
    setSelectedCategoryKey(categoryKey);
  }, []);

  // ── Render ──
  return (
    <div
      ref={containerRef}
      style={{
        ...cssVars,
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        background: '#0f172a',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        userSelect: 'none',
        cursor: isPanning ? 'grabbing' : 'grab',
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Category Filter Bar */}
      <div data-no-pan>
        <CategoryFilter
          categories={categories}
          activeCategories={activeCategories}
          onToggle={toggleCategory}
          onShowAll={showAllCategories}
        />
      </div>

      {/* Search Bar */}
      <div data-no-pan>
        <SearchBar
          query={searchQuery}
          onChange={setSearchQuery}
          results={searchResults}
          onSelect={handleSearchSelect}
          inputRef={searchInputRef}
        />
      </div>

      {/* Canvas */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: CANVAS_WIDTH, height: CANVAS_HEIGHT,
        transformOrigin: '0 0',
        transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
        willChange: 'transform',
      }}>
        {/* Connection lines */}
        <ConnectionLines
          categories={categories}
          categoryPositions={categoryPositions}
          activeCategories={activeCategories}
        />

        {/* Central Hub */}
        <div style={{
          position: 'absolute',
          left: CENTER_X - HUB_RADIUS,
          top: CENTER_Y - HUB_RADIUS,
          width: HUB_RADIUS * 2,
          height: HUB_RADIUS * 2,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #1e3a5f 0%, #0f172a 100%)',
          border: '2.5px solid #3b82f6',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 40px rgba(59,130,246,0.3), 0 0 80px rgba(59,130,246,0.1)',
          zIndex: 5,
        }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#60a5fa', letterSpacing: 0.5 }}>AWS</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 2 }}>SAA-C03</span>
        </div>

        {/* Category Labels */}
        {Object.entries(categoryPositions).map(([key, pos]) => {
          if (!activeCategories.has(key)) return null;
          const cat = categories[key];
          return (
            <motion.div
              key={`cat-${key}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                left: pos.x - 50,
                top: pos.y - 16,
                width: 100,
                textAlign: 'center',
                pointerEvents: 'none',
                zIndex: 6,
              }}
            >
              <div style={{
                display: 'inline-block',
                padding: '4px 14px',
                borderRadius: 12,
                background: `${cat.color}20`,
                border: `1px solid ${cat.color}44`,
                color: cat.color,
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}>
                {cat.label}
              </div>
            </motion.div>
          );
        })}

        {/* Service Nodes */}
        {Object.entries(categories).map(([catKey, cat]) =>
          (cat.services || []).map((service) => {
            const pos = nodePositions[service.id];
            if (!pos) return null;
            const isVisible = activeCategories.has(catKey);
            const isMatch = searchQuery.length > 0 && searchMatchIds.has(service.id);

            return (
              <ServiceNode
                key={service.id}
                service={service}
                x={pos.x}
                y={pos.y}
                color={cat.color}
                isHighlighted={isVisible && (searchQuery.length === 0 || isMatch)}
                isSearchMatch={isMatch}
                onClick={(s) => handleServiceClick(s, catKey)}
              />
            );
          })
        )}
      </div>

      {/* Zoom Controls */}
      <div data-no-pan>
        <ZoomControls
          zoom={zoom}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onReset={resetZoom}
          onFit={fitToScreen}
        />
      </div>

      {/* Minimap */}
      <Minimap
        zoom={zoom}
        panX={panX}
        panY={panY}
        viewportWidth={viewportSize.w}
        viewportHeight={viewportSize.h}
        categories={categories}
        categoryPositions={categoryPositions}
        nodePositions={nodePositions}
        activeCategories={activeCategories}
      />

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedService && (
          <div data-no-pan>
            <DetailPanel
              service={selectedService}
              category={selectedCategoryKey ? categories[selectedCategoryKey]?.label : ''}
              color={selectedCategoryKey ? categories[selectedCategoryKey]?.color : '#3b82f6'}
              onClose={() => setSelectedService(null)}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

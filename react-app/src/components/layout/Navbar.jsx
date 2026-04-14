import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useThemeStore } from '../../hooks/useTheme'

const BASE = '/aws-saa-c03-study-hub'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Mind Map', to: '/mindmap' },
  {
    label: 'Exercises',
    children: [
      { label: 'Fill Blanks', to: '/exercises/fill-blanks' },
      { label: 'Connection Game', to: '/exercises/connection-game' },
      { label: 'Deduction', to: '/exercises/deduction' },
      { label: 'Practice Questions', to: '/exercises/practice-questions' },
    ],
  },
  {
    label: 'Games',
    children: [
      { label: 'Cloud Walker', to: '/games/cloud-walker' },
      { label: 'Jeopardy', to: '/games/jeopardy' },
      { label: 'Service Sorter', to: '/games/service-sorter' },
    ],
  },
  { label: 'Cheatsheet', to: '/cheatsheet' },
  { label: 'Chapters', to: '/chapters' },
]

const styles = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    background: 'color-mix(in srgb, var(--bg) 85%, transparent)',
    borderBottom: '1px solid var(--border)',
    padding: '0 20px',
  },
  inner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '56px',
    maxWidth: '1126px',
    margin: '0 auto',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    color: 'var(--text-h)',
    fontWeight: 600,
    fontSize: '18px',
    fontFamily: 'var(--heading)',
    letterSpacing: '-0.3px',
  },
  cloudIcon: {
    fontSize: '22px',
    color: 'var(--accent)',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  linkItem: {
    position: 'relative',
  },
  link: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 12px',
    borderRadius: '8px',
    textDecoration: 'none',
    color: 'var(--text)',
    fontSize: '15px',
    fontWeight: 450,
    transition: 'color 0.2s, background 0.2s',
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    fontFamily: 'inherit',
  },
  linkActive: {
    color: 'var(--accent)',
    background: 'var(--accent-bg)',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '6px',
    minWidth: '170px',
    boxShadow: 'var(--shadow)',
    listStyle: 'none',
    margin: 0,
    zIndex: 100,
  },
  dropdownLink: {
    display: 'block',
    padding: '8px 14px',
    borderRadius: '6px',
    textDecoration: 'none',
    color: 'var(--text)',
    fontSize: '14px',
    transition: 'color 0.2s, background 0.2s',
    whiteSpace: 'nowrap',
  },
  themeBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'var(--code-bg)',
    cursor: 'pointer',
    fontSize: '18px',
    transition: 'background 0.2s, border-color 0.2s',
    flexShrink: 0,
  },
  hamburger: {
    display: 'none',
    flexDirection: 'column',
    gap: '5px',
    cursor: 'pointer',
    padding: '8px',
    border: 'none',
    background: 'none',
  },
  hamburgerLine: {
    width: '22px',
    height: '2px',
    background: 'var(--text-h)',
    borderRadius: '2px',
    transition: 'transform 0.3s, opacity 0.3s',
  },
  mobileMenu: {
    position: 'fixed',
    top: '56px',
    left: 0,
    right: 0,
    bottom: 0,
    background: 'var(--bg)',
    zIndex: 999,
    padding: '20px',
    overflowY: 'auto',
  },
  mobileLink: {
    display: 'block',
    padding: '12px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    color: 'var(--text)',
    fontSize: '16px',
    fontWeight: 450,
    transition: 'color 0.2s, background 0.2s',
  },
  mobileSub: {
    paddingLeft: '20px',
  },
  mobileSubLabel: {
    display: 'block',
    padding: '12px 16px',
    color: 'var(--text-h)',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    background: 'none',
    fontFamily: 'inherit',
    width: '100%',
    textAlign: 'left',
  },
}

function DropdownItem({ item }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const location = useLocation()
  const timeoutRef = useRef(null)

  const isChildActive = item.children?.some((c) => location.pathname === c.to)

  const handleEnter = () => {
    clearTimeout(timeoutRef.current)
    setOpen(true)
  }
  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150)
  }

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  return (
    <li
      style={styles.linkItem}
      ref={ref}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <span
        style={{
          ...styles.link,
          ...(isChildActive ? styles.linkActive : {}),
        }}
        onMouseEnter={(e) => {
          if (!isChildActive) e.target.style.color = 'var(--text-h)'
        }}
        onMouseLeave={(e) => {
          if (!isChildActive) e.target.style.color = 'var(--text)'
        }}
      >
        {item.label}
        <span style={{ fontSize: '10px', marginLeft: '2px' }}>&#9662;</span>
      </span>
      <AnimatePresence>
        {open && (
          <motion.ul
            style={styles.dropdown}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {item.children.map((child) => (
              <li key={child.to}>
                <Link
                  to={child.to}
                  style={{
                    ...styles.dropdownLink,
                    ...(location.pathname === child.to
                      ? { color: 'var(--accent)', background: 'var(--accent-bg)' }
                      : {}),
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'var(--accent-bg)'
                    e.target.style.color = 'var(--accent)'
                  }}
                  onMouseLeave={(e) => {
                    if (location.pathname !== child.to) {
                      e.target.style.background = 'transparent'
                      e.target.style.color = 'var(--text)'
                    }
                  }}
                >
                  {child.label}
                </Link>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  )
}

export default function Navbar() {
  const { theme, toggleTheme } = useThemeStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileDropdowns, setMobileDropdowns] = useState({})
  const location = useLocation()

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const toggleMobileDropdown = (label) => {
    setMobileDropdowns((prev) => ({ ...prev, [label]: !prev[label] }))
  }

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>
          <span style={styles.cloudIcon}>{'\u2601'}</span>
          AWS SAA-C03
        </Link>

        {/* Desktop links */}
        <ul style={styles.links} className="navbar-desktop-links">
          {navItems.map((item) =>
            item.children ? (
              <DropdownItem key={item.label} item={item} />
            ) : (
              <li key={item.to} style={styles.linkItem}>
                <Link
                  to={item.to}
                  style={{
                    ...styles.link,
                    ...(location.pathname === item.to ? styles.linkActive : {}),
                  }}
                  onMouseEnter={(e) => {
                    if (location.pathname !== item.to) {
                      e.target.style.color = 'var(--text-h)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (location.pathname !== item.to) {
                      e.target.style.color = 'var(--text)'
                    }
                  }}
                >
                  {item.label}
                </Link>
              </li>
            ),
          )}
        </ul>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Theme toggle */}
          <motion.button
            style={styles.themeBtn}
            onClick={toggleTheme}
            whileTap={{ scale: 0.9 }}
            whileHover={{ borderColor: 'var(--accent)' }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '\u2600' : '\uD83C\uDF19'}
          </motion.button>

          {/* Hamburger (mobile) */}
          <button
            style={styles.hamburger}
            className="navbar-hamburger"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <motion.span
              style={styles.hamburgerLine}
              animate={
                mobileOpen
                  ? { rotate: 45, y: 7 }
                  : { rotate: 0, y: 0 }
              }
            />
            <motion.span
              style={styles.hamburgerLine}
              animate={{ opacity: mobileOpen ? 0 : 1 }}
            />
            <motion.span
              style={styles.hamburgerLine}
              animate={
                mobileOpen
                  ? { rotate: -45, y: -7 }
                  : { rotate: 0, y: 0 }
              }
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            style={styles.mobileMenu}
            className="navbar-mobile-menu"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.25 }}
          >
            {navItems.map((item) =>
              item.children ? (
                <div key={item.label}>
                  <button
                    style={styles.mobileSubLabel}
                    onClick={() => toggleMobileDropdown(item.label)}
                  >
                    {item.label}{' '}
                    <span style={{ fontSize: '10px' }}>
                      {mobileDropdowns[item.label] ? '\u25B4' : '\u25BE'}
                    </span>
                  </button>
                  <AnimatePresence>
                    {mobileDropdowns[item.label] && (
                      <motion.div
                        style={styles.mobileSub}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.children.map((child) => (
                          <Link
                            key={child.to}
                            to={child.to}
                            style={{
                              ...styles.mobileLink,
                              ...(location.pathname === child.to
                                ? styles.linkActive
                                : {}),
                            }}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{
                    ...styles.mobileLink,
                    ...(location.pathname === item.to ? styles.linkActive : {}),
                  }}
                >
                  {item.label}
                </Link>
              ),
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Responsive CSS injected once */}
      <style>{`
        .navbar-desktop-links { display: flex !important; }
        .navbar-hamburger { display: none !important; }
        @media (max-width: 768px) {
          .navbar-desktop-links { display: none !important; }
          .navbar-hamburger { display: flex !important; }
        }
      `}</style>
    </nav>
  )
}

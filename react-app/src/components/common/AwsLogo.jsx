import { useState } from 'react'
import { getLogoUrl, getAbbreviation } from '../../data/serviceLogos'

// Renders an official AWS service logo (from the shared serviceLogos map)
// with a styled-text abbreviation fallback if the image fails to load.
//
// Props:
//   service   — string (service id or display name; required)
//   size      — px square (default 48)
//   alt       — accessible label override
//   bg        — fallback chip background color (default uses CSS var)
//   color     — fallback chip text color (default white)
//   style     — extra inline style merged onto the wrapper
//   draggable — passthrough for the underlying <img>
export default function AwsLogo({
  service,
  size = 48,
  alt,
  bg = 'linear-gradient(135deg, #a855f7, #6366f1)',
  color = '#fff',
  style,
  draggable = false,
}) {
  const url = getLogoUrl(service)
  const [failed, setFailed] = useState(false)
  const label = alt || String(service)
  const showFallback = !url || failed

  const wrapperStyle = {
    width: size,
    height: size,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    ...style,
  }

  if (showFallback) {
    return (
      <span
        role="img"
        aria-label={label}
        title={label}
        style={{
          ...wrapperStyle,
          background: bg,
          color,
          borderRadius: Math.round(size * 0.18),
          fontFamily: 'var(--mono, monospace)',
          fontWeight: 800,
          fontSize: Math.max(10, Math.round(size * 0.32)),
          letterSpacing: '0.5px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
          userSelect: 'none',
        }}
      >
        {getAbbreviation(label)}
      </span>
    )
  }

  return (
    <img
      src={url}
      alt={label}
      title={label}
      draggable={draggable}
      onError={() => setFailed(true)}
      style={{
        ...wrapperStyle,
        objectFit: 'contain',
        // White chip behind the logo so it stays legible on any bg.
        background: '#fff',
        borderRadius: Math.round(size * 0.18),
        padding: Math.max(2, Math.round(size * 0.08)),
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      }}
    />
  )
}

// Shared loading fallback used by per-page Suspense boundaries.
// Kept tiny so it never causes layout jank.
export default function LoadingFallback() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        color: 'var(--text-secondary, #94a3b8)',
        fontSize: '1.05rem',
        gap: '0.75rem',
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          border: '3px solid var(--border-color, #334155)',
          borderTopColor: 'var(--accent-orange, #a855f7)',
          borderRadius: '50%',
          animation: 'lf-spin 0.8s linear infinite',
        }}
      />
      Loading...
      <style>{`@keyframes lf-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

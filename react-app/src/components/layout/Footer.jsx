const styles = {
  footer: {
    padding: '24px 20px',
    borderTop: '1px solid var(--border)',
    textAlign: 'center',
    fontSize: '14px',
    color: 'var(--text)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  tagline: {
    fontWeight: 500,
    color: 'var(--accent)',
    letterSpacing: '0.5px',
  },
  links: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  link: {
    color: 'var(--text)',
    textDecoration: 'none',
    transition: 'color 0.2s',
  },
  separator: {
    color: 'var(--border)',
  },
}

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <span style={styles.tagline}>Built for ADHD learners</span>
      <div style={styles.links}>
        <span>AWS SAA-C03 Study Hub</span>
        <span style={styles.separator}>|</span>
        <a
          href="https://github.com/aws-saa-c03-study-hub"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.link}
          onMouseEnter={(e) => (e.target.style.color = 'var(--accent)')}
          onMouseLeave={(e) => (e.target.style.color = 'var(--text)')}
        >
          GitHub
        </a>
      </div>
    </footer>
  )
}

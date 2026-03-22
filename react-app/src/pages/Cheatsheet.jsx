import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import data from '../data/cheatsheet.json';

const CATEGORY_COLORS = {
  compute: '#ef4444',
  storage: '#3b82f6',
  database: '#8b5cf6',
  network: '#10b981',
  security: '#f59e0b',
  integration: '#ec4899',
  analytics: '#06b6d4',
  management: '#84cc16',
};

const styles = {
  page: {
    maxWidth: 1100,
    margin: '0 auto',
    padding: '2rem 1rem',
    fontFamily: 'var(--sans)',
    color: 'var(--text)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '1.5rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    color: 'var(--text-h)',
    margin: 0,
    fontFamily: 'var(--heading)',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: 'var(--text)',
    margin: '0.25rem 0 0',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  searchBox: {
    padding: '0.5rem 0.85rem',
    fontSize: '0.9rem',
    border: '1px solid var(--border)',
    borderRadius: 8,
    background: 'var(--bg)',
    color: 'var(--text-h)',
    outline: 'none',
    minWidth: 200,
    fontFamily: 'var(--sans)',
    transition: 'border-color 0.2s',
  },
  printBtn: {
    padding: '0.5rem 1rem',
    fontSize: '0.85rem',
    fontWeight: 600,
    border: '1px solid var(--border)',
    borderRadius: 8,
    background: 'var(--code-bg)',
    color: 'var(--text-h)',
    cursor: 'pointer',
    fontFamily: 'var(--sans)',
    transition: 'background 0.2s',
  },
  tabs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  tab: (color, active) => ({
    padding: '0.4rem 0.9rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    borderRadius: 20,
    border: `2px solid ${color}`,
    background: active ? color : 'transparent',
    color: active ? '#fff' : color,
    cursor: 'pointer',
    textTransform: 'capitalize',
    transition: 'all 0.2s',
    fontFamily: 'var(--sans)',
  }),
  sectionCard: (color) => ({
    border: '1px solid var(--border)',
    borderRadius: 12,
    marginBottom: '1rem',
    overflow: 'hidden',
    background: 'var(--bg)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  }),
  sectionHeader: (color) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.85rem 1.25rem',
    cursor: 'pointer',
    userSelect: 'none',
    borderLeft: `4px solid ${color}`,
    background: 'var(--code-bg)',
  }),
  sectionTitle: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: 'var(--text-h)',
    margin: 0,
  },
  chevron: (open) => ({
    fontSize: '0.85rem',
    color: 'var(--text)',
    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: 'transform 0.25s',
  }),
  sectionBody: {
    padding: '1rem 1.25rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '0.85rem',
  },
  factCard: (color) => ({
    border: '1px solid var(--border)',
    borderRadius: 10,
    padding: '0.85rem 1rem',
    background: 'var(--bg)',
    position: 'relative',
    transition: 'box-shadow 0.2s',
  }),
  serviceName: (color) => ({
    fontSize: '0.9rem',
    fontWeight: 700,
    color: color,
    margin: '0 0 0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }),
  factList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  factItem: {
    fontSize: '0.82rem',
    color: 'var(--text)',
    padding: '0.2rem 0',
    lineHeight: 1.45,
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.4rem',
  },
  bullet: (color) => ({
    display: 'inline-block',
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
    marginTop: '0.4em',
  }),
  copyBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.75rem',
    color: 'var(--text)',
    padding: '0.1rem 0.3rem',
    borderRadius: 4,
    opacity: 0.6,
    transition: 'opacity 0.2s',
    fontFamily: 'var(--sans)',
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem 1rem',
    color: 'var(--text)',
    fontSize: '1rem',
  },
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback: silently fail
    }
  }, [text]);

  return (
    <button
      style={styles.copyBtn}
      onClick={handleCopy}
      title="Copy to clipboard"
      onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.6; }}
    >
      {copied ? '✓' : '⧉'}
    </button>
  );
}

function FactCard({ item, color }) {
  const allFacts = `${item.service}: ${item.facts.join(', ')}`;

  return (
    <motion.div
      style={styles.factCard(color)}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      whileHover={{ boxShadow: `0 0 0 1px ${color}40, 0 4px 12px rgba(0,0,0,0.08)` }}
    >
      <div style={styles.serviceName(color)}>
        <span>{item.service}</span>
        <CopyButton text={allFacts} />
      </div>
      <ul style={styles.factList}>
        {item.facts.map((fact, i) => (
          <li key={i} style={styles.factItem}>
            <span style={styles.bullet(color)} />
            <span>{fact}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function Section({ section, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const color = CATEGORY_COLORS[section.category] || 'var(--accent)';

  return (
    <div style={styles.sectionCard(color)}>
      <div
        style={styles.sectionHeader(color)}
        onClick={() => setOpen((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen((v) => !v); } }}
      >
        <h3 style={styles.sectionTitle}>{section.title}</h3>
        <span style={styles.chevron(open)}>▼</span>
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={styles.sectionBody}>
              <div style={styles.grid}>
                {section.items.map((item, i) => (
                  <FactCard key={item.service + i} item={item} color={color} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Cheatsheet() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = useMemo(() => {
    const cats = new Set(data.sections.map((s) => s.category));
    return ['all', ...Array.from(cats)];
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return data.sections
      .filter((s) => activeCategory === 'all' || s.category === activeCategory)
      .map((s) => {
        if (!q) return s;
        const matchedItems = s.items.filter(
          (item) =>
            item.service.toLowerCase().includes(q) ||
            item.facts.some((f) => f.toLowerCase().includes(q))
        );
        if (matchedItems.length === 0) return null;
        return { ...s, items: matchedItems };
      })
      .filter(Boolean);
  }, [search, activeCategory]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Cheatsheet</h1>
          <p style={styles.subtitle}>Quick-reference for AWS SAA-C03 exam limits, facts, and key details</p>
        </div>
        <div style={styles.controls}>
          <input
            type="text"
            placeholder="Search services or facts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchBox}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
          />
          <button
            style={styles.printBtn}
            onClick={handlePrint}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-bg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--code-bg)'; }}
          >
            🖨 Print
          </button>
        </div>
      </div>

      <div style={styles.tabs}>
        {categories.map((cat) => {
          const color = cat === 'all' ? 'var(--accent)' : (CATEGORY_COLORS[cat] || 'var(--accent)');
          return (
            <button
              key={cat}
              style={styles.tab(color, activeCategory === cat)}
              onClick={() => setActiveCategory(cat)}
              onMouseEnter={(e) => {
                if (activeCategory !== cat) {
                  e.currentTarget.style.background = color + '18';
                }
              }}
              onMouseLeave={(e) => {
                if (activeCategory !== cat) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div style={styles.emptyState}>
          No results found. Try a different search term or category.
        </div>
      ) : (
        <motion.div layout>
          {filtered.map((section, i) => (
            <Section key={section.title} section={section} defaultOpen={i === 0} />
          ))}
        </motion.div>
      )}
    </div>
  );
}

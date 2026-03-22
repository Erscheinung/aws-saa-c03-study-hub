import { useState, useMemo } from 'react';
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
    textAlign: 'center',
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    color: 'var(--text-h)',
    margin: 0,
  },
  subtitle: {
    color: 'var(--text)',
    marginTop: '0.5rem',
    fontSize: '1rem',
  },
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  searchBox: {
    padding: '0.5rem 1rem',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    color: 'var(--text-h)',
    fontSize: '0.95rem',
    outline: 'none',
    minWidth: 220,
    fontFamily: 'var(--sans)',
  },
  printBtn: {
    padding: '0.5rem 1rem',
    borderRadius: 8,
    border: '1px solid var(--border)',
    background: 'var(--code-bg)',
    color: 'var(--text-h)',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontFamily: 'var(--sans)',
  },
  filterRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  filterTab: (color, active) => ({
    padding: '0.35rem 0.85rem',
    borderRadius: 20,
    border: `2px solid ${color}`,
    background: active ? color : 'transparent',
    color: active ? '#fff' : color,
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.82rem',
    textTransform: 'capitalize',
    transition: 'all 0.2s',
    fontFamily: 'var(--sans)',
  }),
  sectionCard: {
    marginBottom: '1.25rem',
    borderRadius: 12,
    border: '1px solid var(--border)',
    background: 'var(--bg)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow)',
  },
  sectionHeader: (color) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.85rem 1.25rem',
    cursor: 'pointer',
    background: 'var(--code-bg)',
    userSelect: 'none',
    borderLeft: `4px solid ${color}`,
  }),
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: 'var(--text-h)',
    margin: 0,
    flex: 1,
  },
  categoryBadge: (color) => ({
    fontSize: '0.72rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: color,
    background: `${color}18`,
    padding: '0.15rem 0.6rem',
    borderRadius: 10,
  }),
  chevron: (expanded) => ({
    transition: 'transform 0.25s',
    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
    color: 'var(--text)',
    fontSize: '1.1rem',
    flexShrink: 0,
  }),
  sectionBody: {
    padding: '1rem 1.25rem',
  },
  factGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '0.85rem',
  },
  factCard: (color) => ({
    borderRadius: 10,
    border: `1px solid var(--border)`,
    background: 'var(--bg)',
    padding: '0.85rem 1rem',
    position: 'relative',
    borderTop: `3px solid ${color}`,
  }),
  serviceName: {
    fontWeight: 700,
    fontSize: '0.95rem',
    color: 'var(--text-h)',
    marginBottom: '0.5rem',
    fontFamily: 'var(--mono)',
  },
  factList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  factItem: {
    fontSize: '0.85rem',
    color: 'var(--text)',
    padding: '0.2rem 0',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.4rem',
    cursor: 'pointer',
    borderRadius: 4,
    transition: 'background 0.15s',
  },
  factBullet: (color) => ({
    color: color,
    fontWeight: 700,
    flexShrink: 0,
    marginTop: '0.05rem',
  }),
  copyToast: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    background: '#10b981',
    color: '#fff',
    padding: '0.6rem 1.2rem',
    borderRadius: 8,
    fontWeight: 600,
    fontSize: '0.85rem',
    zIndex: 1000,
    pointerEvents: 'none',
  },
  noResults: {
    textAlign: 'center',
    padding: '3rem 1rem',
    color: 'var(--text)',
    fontSize: '1.1rem',
  },
};

export default function Cheatsheet() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedSections, setExpandedSections] = useState({});
  const [copiedFact, setCopiedFact] = useState(null);

  const categories = useMemo(() => {
    const cats = new Set();
    (data.sections || []).forEach((s) => cats.add(s.category));
    return Array.from(cats);
  }, []);

  const filteredSections = useMemo(() => {
    return (data.sections || [])
      .filter((s) => activeCategory === 'all' || s.category === activeCategory)
      .map((section) => {
        if (!search.trim()) return section;
        const q = search.toLowerCase();
        const filtered = section.items.filter(
          (item) =>
            item.service.toLowerCase().includes(q) ||
            item.facts.some((f) => f.toLowerCase().includes(q))
        );
        return filtered.length ? { ...section, items: filtered } : null;
      })
      .filter(Boolean);
  }, [search, activeCategory]);

  const toggleSection = (idx) => {
    setExpandedSections((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const copyFact = (service, fact) => {
    const text = `${service}: ${fact}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedFact(text);
      setTimeout(() => setCopiedFact(null), 1500);
    });
  };

  const handlePrint = () => {
    setExpandedSections(
      Object.fromEntries(filteredSections.map((_, i) => [i, true]))
    );
    setTimeout(() => window.print(), 200);
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>AWS SAA-C03 Cheatsheet</h1>
        <p style={styles.subtitle}>
          Quick-reference facts, limits, and key details for the exam
        </p>
      </header>

      <div style={styles.toolbar}>
        <input
          type="text"
          placeholder="Search services or facts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchBox}
        />
        <button style={styles.printBtn} onClick={handlePrint}>
          Print View
        </button>
      </div>

      <div style={styles.filterRow}>
        <button
          style={styles.filterTab('var(--accent)', activeCategory === 'all')}
          onClick={() => setActiveCategory('all')}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            style={styles.filterTab(
              CATEGORY_COLORS[cat] || 'var(--accent)',
              activeCategory === cat
            )}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {filteredSections.length === 0 && (
        <div style={styles.noResults}>
          No matching services or facts found.
        </div>
      )}

      {filteredSections.map((section, idx) => {
        const color = CATEGORY_COLORS[section.category] || 'var(--accent)';
        const isExpanded = expandedSections[idx] !== false;

        return (
          <motion.div
            key={section.title + idx}
            style={styles.sectionCard}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.04 }}
          >
            <div
              style={styles.sectionHeader(color)}
              onClick={() => toggleSection(idx)}
            >
              <h2 style={styles.sectionTitle}>{section.title}</h2>
              <span style={styles.categoryBadge(color)}>
                {section.category}
              </span>
              <span style={styles.chevron(isExpanded)}>&#9662;</span>
            </div>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={styles.sectionBody}>
                    <div style={styles.factGrid}>
                      {section.items.map((item, iIdx) => (
                        <motion.div
                          key={item.service + iIdx}
                          style={styles.factCard(color)}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: iIdx * 0.03 }}
                        >
                          <div style={styles.serviceName}>{item.service}</div>
                          <ul style={styles.factList}>
                            {item.facts.map((fact, fIdx) => (
                              <li
                                key={fIdx}
                                style={styles.factItem}
                                title="Click to copy"
                                onClick={() => copyFact(item.service, fact)}
                              >
                                <span style={styles.factBullet(color)}>
                                  &#9656;
                                </span>
                                <span>{fact}</span>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      <AnimatePresence>
        {copiedFact && (
          <motion.div
            style={styles.copyToast}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            Copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

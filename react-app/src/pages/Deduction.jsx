import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import scenarios from '../data/deduction.json';

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const DIFFICULTY_CONFIG = {
  easy: { color: '#22c55e', label: 'Easy', bg: 'rgba(34,197,94,0.12)' },
  medium: { color: '#eab308', label: 'Medium', bg: 'rgba(234,179,8,0.12)' },
  hard: { color: '#ef4444', label: 'Hard', bg: 'rgba(239,68,68,0.12)' },
};

function highlightKeywords(text, keywords) {
  if (!keywords || keywords.length === 0) return text;
  const escaped = keywords.map((k) =>
    k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) => {
    const isKeyword = keywords.some(
      (k) => k.toLowerCase() === part.toLowerCase()
    );
    if (isKeyword) {
      return (
        <span
          key={i}
          style={{
            fontWeight: 700,
            color: 'var(--accent-orange)',
            background: 'rgba(249,115,22,0.1)',
            padding: '1px 4px',
            borderRadius: 4,
          }}
        >
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

const st = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    padding: '32px 24px',
    fontFamily: "'Inter', system-ui, sans-serif",
    maxWidth: 860,
    margin: '0 auto',
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 8px',
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    margin: '0 0 24px',
  },
  filterBar: {
    display: 'flex',
    gap: 8,
    marginBottom: 20,
  },
  pill: (active, color) => ({
    padding: '6px 18px',
    borderRadius: 20,
    border: 'none',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    background: active ? color : 'var(--bg-secondary)',
    color: active ? '#fff' : 'var(--text-secondary)',
    transition: 'all 0.2s',
  }),
  statsRow: {
    display: 'flex',
    gap: 14,
    marginBottom: 20,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  stat: (bg) => ({
    padding: '6px 14px',
    borderRadius: 10,
    background: bg,
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
  }),
  progressBar: {
    width: '100%',
    height: 6,
    background: 'var(--bg-secondary)',
    borderRadius: 3,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: (pct) => ({
    height: '100%',
    width: `${pct}%`,
    background: 'var(--accent-green)',
    borderRadius: 3,
    transition: 'width 0.4s ease',
  }),
  card: {
    background: 'var(--bg-card)',
    borderRadius: 16,
    padding: 28,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    border: '1px solid var(--border-color)',
    marginBottom: 24,
  },
  diffBadge: (diff) => ({
    display: 'inline-block',
    padding: '4px 14px',
    borderRadius: 12,
    background: DIFFICULTY_CONFIG[diff]?.bg || 'var(--bg-secondary)',
    color: DIFFICULTY_CONFIG[diff]?.color || 'var(--text-secondary)',
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  }),
  scenarioText: {
    fontSize: 17,
    lineHeight: 1.7,
    color: 'var(--text-primary)',
    marginBottom: 24,
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 14,
    marginBottom: 24,
  },
  optionCard: (state) => {
    // state: 'default' | 'selected' | 'correct' | 'wrong' | 'eliminated'
    const configs = {
      default: {
        bg: 'var(--bg-secondary)',
        border: '2px solid var(--border-color)',
        color: 'var(--text-primary)',
        opacity: 1,
        textDecoration: 'none',
      },
      selected: {
        bg: 'rgba(59,130,246,0.1)',
        border: '2px solid var(--accent-blue)',
        color: 'var(--text-primary)',
        opacity: 1,
        textDecoration: 'none',
      },
      correct: {
        bg: 'rgba(34,197,94,0.15)',
        border: '2px solid var(--accent-green)',
        color: 'var(--accent-green)',
        opacity: 1,
        textDecoration: 'none',
      },
      wrong: {
        bg: 'rgba(239,68,68,0.1)',
        border: '2px solid var(--accent-red)',
        color: 'var(--accent-red)',
        opacity: 1,
        textDecoration: 'none',
      },
      eliminated: {
        bg: 'var(--bg-secondary)',
        border: '2px solid var(--border-color)',
        color: 'var(--text-secondary)',
        opacity: 0.5,
        textDecoration: 'line-through',
      },
    };
    const c = configs[state] || configs.default;
    return {
      padding: '16px 18px',
      borderRadius: 14,
      background: c.bg,
      border: c.border,
      color: c.color,
      opacity: c.opacity,
      cursor: state === 'default' ? 'pointer' : 'default',
      transition: 'all 0.3s',
      textAlign: 'left',
      fontSize: 14,
      lineHeight: 1.5,
      position: 'relative',
    };
  },
  letterBadge: (color) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 8,
    background: color || 'var(--accent-blue)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
    marginRight: 10,
    flexShrink: 0,
  }),
  reason: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 1.4,
  },
  deductionBox: {
    background: 'var(--bg-secondary)',
    borderRadius: 14,
    padding: 24,
    marginBottom: 24,
    border: '1px solid var(--border-color)',
  },
  deductionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  stepItem: (index) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
    position: 'relative',
  }),
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    background: 'var(--accent-blue)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 13,
    flexShrink: 0,
  },
  stepLine: {
    position: 'absolute',
    left: 14,
    top: 34,
    width: 2,
    height: 'calc(100% - 10px)',
    background: 'rgba(59,130,246,0.2)',
  },
  stepText: {
    fontSize: 14,
    color: 'var(--text-primary)',
    lineHeight: 1.5,
    paddingTop: 4,
  },
  btn: (bg, color = '#fff') => ({
    padding: '12px 24px',
    borderRadius: 12,
    border: 'none',
    background: bg,
    color,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.1s',
  }),
  summaryCard: {
    background: 'var(--bg-card)',
    borderRadius: 16,
    padding: 48,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    border: '1px solid var(--border-color)',
    textAlign: 'center',
  },
  bigScore: {
    fontSize: 56,
    fontWeight: 800,
    color: 'var(--accent-green)',
    margin: '16px 0',
  },
};

export default function Deduction() {
  const [difficulty, setDifficulty] = useState('all');
  const [order, setOrder] = useState(() =>
    shuffleArray(scenarios.map((_, i) => i))
  );
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [results, setResults] = useState([]); // { id, picked, correct }

  const filtered = useMemo(() => {
    if (difficulty === 'all') return order;
    return order.filter(
      (i) => scenarios[i].difficulty === difficulty
    );
  }, [difficulty, order]);

  const totalFiltered = filtered.length;
  const qIndex = filtered[current];
  const question = qIndex !== undefined ? scenarios[qIndex] : null;
  const isDone = current >= filtered.length;

  const handleSelect = (letter) => {
    if (selected !== null) return;
    setSelected(letter);
    const correct = letter === question.answer;
    if (correct) setScore((s) => s + 1);
    setAnswered((a) => a + 1);
    setResults((r) => [
      ...r,
      { id: question.id, picked: letter, correct },
    ]);
  };

  const goNext = () => {
    setCurrent((c) => c + 1);
    setSelected(null);
  };

  const reset = () => {
    setOrder(shuffleArray(scenarios.map((_, i) => i)));
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setAnswered(0);
    setResults([]);
    setShowReview(false);
  };

  const changeDifficulty = (d) => {
    setDifficulty(d);
    setCurrent(0);
    setSelected(null);
  };

  const getOptionState = (opt) => {
    if (selected === null) return 'default';
    if (opt.letter === question.answer) return 'correct';
    if (opt.letter === selected && selected !== question.answer) return 'wrong';
    if (opt.eliminate) return 'eliminated';
    return 'eliminated';
  };

  const progressPct =
    totalFiltered > 0 ? (Math.min(current + 1, totalFiltered) / totalFiltered) * 100 : 0;

  return (
    <div style={st.page}>
      <h1 style={st.title}>Deduction Trainer</h1>
      <p style={st.subtitle}>
        Master the art of elimination -- think like the exam
      </p>

      {/* Difficulty Filter */}
      <div style={st.filterBar}>
        <button
          style={st.pill(difficulty === 'all', 'var(--accent-blue)')}
          onClick={() => changeDifficulty('all')}
        >
          All
        </button>
        {Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => (
          <button
            key={key}
            style={st.pill(difficulty === key, cfg.color)}
            onClick={() => changeDifficulty(key)}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div style={st.statsRow}>
        <span style={st.stat('var(--accent-green)')}>
          Score: {score}/{answered}
        </span>
        <span style={st.stat('var(--accent-blue)')}>
          {Math.min(current + 1, totalFiltered)}/{totalFiltered}
        </span>
        {answered > 0 && (
          <span style={st.stat('var(--accent-orange)')}>
            {Math.round((score / answered) * 100)}%
          </span>
        )}
      </div>

      <div style={st.progressBar}>
        <div style={st.progressFill(progressPct)} />
      </div>

      <AnimatePresence mode="wait">
        {isDone ? (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            style={st.summaryCard}
          >
            <h2
              style={{
                color: 'var(--text-primary)',
                fontSize: 24,
                marginTop: 0,
              }}
            >
              Session Complete!
            </h2>
            <div style={st.bigScore}>
              {answered > 0 ? Math.round((score / answered) * 100) : 0}%
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              {score} correct out of {answered} questions
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button style={st.btn('var(--accent-blue)')} onClick={reset}>
                Start Over
              </button>
              <button
                style={st.btn('var(--bg-secondary)', 'var(--text-primary)')}
                onClick={() => setShowReview(!showReview)}
              >
                {showReview ? 'Hide Review' : 'Review Answers'}
              </button>
            </div>

            {showReview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{ marginTop: 24, textAlign: 'left' }}
              >
                {results.map((r, i) => {
                  const q = scenarios.find((s) => s.id === r.id);
                  if (!q) return null;
                  return (
                    <div
                      key={i}
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        background: r.correct
                          ? 'rgba(34,197,94,0.08)'
                          : 'rgba(239,68,68,0.08)',
                        border: `1px solid ${r.correct ? 'var(--accent-green)' : 'var(--accent-red)'}`,
                        marginBottom: 10,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 13,
                          color: 'var(--text-primary)',
                          margin: '0 0 4px',
                        }}
                      >
                        Q{i + 1}: {q.scenario.slice(0, 100)}...
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: 'var(--text-secondary)',
                          margin: 0,
                        }}
                      >
                        Your answer: {r.picked} | Correct: {q.answer}{' '}
                        {r.correct ? '✓' : '✗'}
                      </p>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        ) : question ? (
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.3 }}
          >
            <div style={st.card}>
              <div style={st.diffBadge(question.difficulty)}>
                {DIFFICULTY_CONFIG[question.difficulty]?.label ||
                  question.difficulty}
              </div>
              <div style={st.scenarioText}>
                {highlightKeywords(question.scenario, question.keywords)}
              </div>

              {/* Options Grid */}
              <div style={st.optionsGrid}>
                {question.options.map((opt) => {
                  const state = getOptionState(opt);
                  return (
                    <motion.div
                      key={opt.letter}
                      whileTap={selected === null ? { scale: 0.97 } : {}}
                      onClick={() => handleSelect(opt.letter)}
                      style={st.optionCard(state)}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <span
                          style={st.letterBadge(
                            state === 'correct'
                              ? 'var(--accent-green)'
                              : state === 'wrong'
                                ? 'var(--accent-red)'
                                : 'var(--accent-blue)'
                          )}
                        >
                          {opt.letter}
                        </span>
                        <span
                          style={{
                            textDecoration:
                              state === 'eliminated' ? 'line-through' : 'none',
                          }}
                        >
                          {opt.text}
                        </span>
                      </div>
                      {selected !== null && opt.reason && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          style={st.reason}
                        >
                          {opt.reason}
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Deduction Steps */}
            {selected !== null && question.deduction && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                style={st.deductionBox}
              >
                <div style={st.deductionTitle}>
                  <span style={{ fontSize: 20 }}>🔍</span>
                  Deduction Path
                </div>
                {question.deduction.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.12 }}
                    style={st.stepItem(i)}
                  >
                    {i < question.deduction.length - 1 && (
                      <div style={st.stepLine} />
                    )}
                    <div style={st.stepNumber}>{i + 1}</div>
                    <div style={st.stepText}>{step}</div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {selected !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ textAlign: 'center' }}
              >
                <button
                  style={st.btn('var(--accent-blue)')}
                  onClick={goNext}
                >
                  Next Question →
                </button>
              </motion.div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gameData from '../data/connections.json';

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MODES = ['Match Pairs', 'Find the Link', 'Category Sort'];
const CATEGORY_OPTIONS = ['Compute', 'Storage', 'Database', 'Network', 'Security'];
const CATEGORY_COLORS = {
  Compute: '#f97316',
  Storage: '#3b82f6',
  Database: '#8b5cf6',
  Network: '#06b6d4',
  Security: '#ef4444',
};
const BATCH_SIZE = 8;

const s = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    padding: '32px 24px',
    fontFamily: "'Inter', system-ui, sans-serif",
    maxWidth: 900,
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
  tabs: {
    display: 'flex',
    gap: 0,
    marginBottom: 24,
    borderRadius: 12,
    overflow: 'hidden',
    border: '1px solid var(--border-color)',
  },
  tab: (active) => ({
    flex: 1,
    padding: '14px 8px',
    border: 'none',
    background: active ? 'var(--accent-blue)' : 'var(--bg-card)',
    color: active ? '#fff' : 'var(--text-secondary)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
  }),
  card: {
    background: 'var(--bg-card)',
    borderRadius: 16,
    padding: 28,
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    border: '1px solid var(--border-color)',
    marginBottom: 24,
  },
  statsRow: {
    display: 'flex',
    gap: 16,
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

/* ========== MATCH PAIRS ========== */
function MatchPairs({ pairs, onComplete }) {
  const [batch, setBatch] = useState(0);
  const [matched, setMatched] = useState(new Set());
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [flash, setFlash] = useState(null); // { type: 'correct'|'wrong', left, right }
  const [score, setScore] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  const batchStart = batch * BATCH_SIZE;
  const currentPairs = pairs.slice(batchStart, batchStart + BATCH_SIZE);
  const isLastBatch = batchStart + BATCH_SIZE >= pairs.length;

  const leftItems = useMemo(
    () => shuffleArray(currentPairs.map((p, i) => ({ label: p.service, idx: batchStart + i }))),
    [batch, pairs]
  );
  const rightItems = useMemo(
    () => shuffleArray(currentPairs.map((p, i) => ({ label: p.match, idx: batchStart + i }))),
    [batch, pairs]
  );

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startTime]);

  const handleSelect = useCallback(
    (side, idx) => {
      if (matched.has(idx)) return;
      if (flash) return;

      if (side === 'left') {
        setSelectedLeft(idx);
        if (selectedRight !== null) {
          // Check match
          if (idx === selectedRight) {
            setFlash({ type: 'correct', left: idx, right: selectedRight });
            setScore((s) => s + 1);
            setTimeout(() => {
              setMatched((prev) => new Set([...prev, idx]));
              setFlash(null);
              setSelectedLeft(null);
              setSelectedRight(null);
            }, 600);
          } else {
            setFlash({ type: 'wrong', left: idx, right: selectedRight });
            setWrongCount((c) => c + 1);
            setTimeout(() => {
              setFlash(null);
              setSelectedLeft(null);
              setSelectedRight(null);
            }, 800);
          }
        }
      } else {
        setSelectedRight(idx);
        if (selectedLeft !== null) {
          if (selectedLeft === idx) {
            setFlash({ type: 'correct', left: selectedLeft, right: idx });
            setScore((s) => s + 1);
            setTimeout(() => {
              setMatched((prev) => new Set([...prev, idx]));
              setFlash(null);
              setSelectedLeft(null);
              setSelectedRight(null);
            }, 600);
          } else {
            setFlash({ type: 'wrong', left: selectedLeft, right: idx });
            setWrongCount((c) => c + 1);
            setTimeout(() => {
              setFlash(null);
              setSelectedLeft(null);
              setSelectedRight(null);
            }, 800);
          }
        }
      }
    },
    [selectedLeft, selectedRight, matched, flash]
  );

  const allMatched = currentPairs.every((_, i) => matched.has(batchStart + i));

  const nextBatch = () => {
    setBatch((b) => b + 1);
    setMatched(new Set());
    setSelectedLeft(null);
    setSelectedRight(null);
  };

  if (allMatched && isLastBatch) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={s.summaryCard}
      >
        <h2 style={{ color: 'var(--text-primary)', fontSize: 24 }}>Match Pairs Complete!</h2>
        <div style={s.bigScore}>
          {score}/{pairs.length}
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
          Mistakes: {wrongCount} | Time: {elapsed}s
        </p>
        <button style={s.btn('var(--accent-blue)')} onClick={onComplete}>
          Play Again
        </button>
      </motion.div>
    );
  }

  const getItemStyle = (side, idx, isMatched) => {
    const isSelected =
      side === 'left' ? selectedLeft === idx : selectedRight === idx;
    const flashThis =
      flash &&
      ((side === 'left' && flash.left === idx) ||
        (side === 'right' && flash.right === idx));
    let bg = 'var(--bg-secondary)';
    let border = '2px solid var(--border-color)';
    let opacity = 1;

    if (isMatched) {
      bg = 'rgba(34,197,94,0.15)';
      border = '2px solid var(--accent-green)';
      opacity = 0.5;
    } else if (flashThis && flash.type === 'correct') {
      bg = 'rgba(34,197,94,0.25)';
      border = '2px solid var(--accent-green)';
    } else if (flashThis && flash.type === 'wrong') {
      bg = 'rgba(239,68,68,0.15)';
      border = '2px solid var(--accent-red)';
    } else if (isSelected) {
      bg = 'rgba(59,130,246,0.12)';
      border = '2px solid var(--accent-blue)';
    }

    return {
      padding: '12px 16px',
      borderRadius: 10,
      background: bg,
      border,
      opacity,
      cursor: isMatched ? 'default' : 'pointer',
      fontSize: 14,
      fontWeight: 500,
      color: 'var(--text-primary)',
      transition: 'all 0.2s',
      textAlign: 'center',
    };
  };

  return (
    <div>
      <div style={s.statsRow}>
        <span style={s.stat('var(--accent-green)')}>Matched: {score}</span>
        <span style={s.stat('var(--accent-red)')}>Mistakes: {wrongCount}</span>
        <span style={s.stat('var(--accent-blue)')}>Time: {elapsed}s</span>
      </div>
      <div style={s.progressBar}>
        <div style={s.progressFill((score / pairs.length) * 100)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            Services
          </div>
          {leftItems.map((item) => (
            <motion.div
              key={item.idx}
              whileTap={{ scale: 0.97 }}
              style={getItemStyle('left', item.idx, matched.has(item.idx))}
              onClick={() => handleSelect('left', item.idx)}
            >
              {item.label}
            </motion.div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            Values
          </div>
          {rightItems.map((item) => (
            <motion.div
              key={item.idx}
              whileTap={{ scale: 0.97 }}
              style={getItemStyle('right', item.idx, matched.has(item.idx))}
              onClick={() => handleSelect('right', item.idx)}
            >
              {item.label}
            </motion.div>
          ))}
        </div>
      </div>
      {allMatched && !isLastBatch && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center', marginTop: 24 }}
        >
          <button style={s.btn('var(--accent-blue)')} onClick={nextBatch}>
            Next Batch →
          </button>
        </motion.div>
      )}
    </div>
  );
}

/* ========== FIND THE LINK ========== */
function FindTheLink({ questions, onComplete }) {
  const [order] = useState(() => shuffleArray(questions.map((_, i) => i)));
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);

  const qIdx = order[current];
  const q = questions[qIdx];
  const isDone = current >= order.length;

  const handleSelect = (optIdx) => {
    if (selected !== null) return;
    setSelected(optIdx);
    if (optIdx === q.answer) setScore((s) => s + 1);
  };

  const next = () => {
    setCurrent((c) => c + 1);
    setSelected(null);
  };

  if (isDone) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={s.summaryCard}
      >
        <h2 style={{ color: 'var(--text-primary)', fontSize: 24 }}>Find the Link Complete!</h2>
        <div style={s.bigScore}>
          {score}/{questions.length}
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
          {Math.round((score / questions.length) * 100)}% accuracy
        </p>
        <button style={s.btn('var(--accent-blue)')} onClick={onComplete}>
          Play Again
        </button>
      </motion.div>
    );
  }

  return (
    <div>
      <div style={s.statsRow}>
        <span style={s.stat('var(--accent-green)')}>Score: {score}</span>
        <span style={s.stat('var(--accent-blue)')}>
          {current + 1}/{questions.length}
        </span>
      </div>
      <div style={s.progressBar}>
        <div style={s.progressFill(((current + 1) / questions.length) * 100)} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={qIdx}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          style={s.card}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              marginBottom: 20,
            }}
          >
            <span
              style={{
                padding: '10px 20px',
                borderRadius: 12,
                background: 'rgba(59,130,246,0.12)',
                color: 'var(--accent-blue)',
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              {q.service1}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: 24 }}>↔</span>
            <span
              style={{
                padding: '10px 20px',
                borderRadius: 12,
                background: 'rgba(249,115,22,0.12)',
                color: 'var(--accent-orange)',
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              {q.service2}
            </span>
          </div>
          <p
            style={{
              textAlign: 'center',
              color: 'var(--text-primary)',
              fontSize: 18,
              fontWeight: 500,
              marginBottom: 24,
            }}
          >
            {q.question}
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            {q.options.map((opt, i) => {
              let bg = 'var(--bg-secondary)';
              let border = '2px solid var(--border-color)';
              let col = 'var(--text-primary)';
              if (selected !== null) {
                if (i === q.answer) {
                  bg = 'rgba(34,197,94,0.15)';
                  border = '2px solid var(--accent-green)';
                  col = 'var(--accent-green)';
                } else if (i === selected && i !== q.answer) {
                  bg = 'rgba(239,68,68,0.1)';
                  border = '2px solid var(--accent-red)';
                  col = 'var(--accent-red)';
                }
              }
              return (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSelect(i)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 12,
                    background: bg,
                    border,
                    color: col,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: selected !== null ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {opt}
                </motion.button>
              );
            })}
          </div>
          {selected !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'center', marginTop: 20 }}
            >
              <button style={s.btn('var(--accent-blue)')} onClick={next}>
                Next →
              </button>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ========== CATEGORY SORT ========== */
function CategorySort({ items, onComplete }) {
  const [order] = useState(() => shuffleArray(items.map((_, i) => i)));
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startTime]);

  const isDone = current >= order.length;
  const item = !isDone ? items[order[current]] : null;

  const handlePick = (cat) => {
    if (feedback) return;
    const correct = cat.toLowerCase() === item.category.toLowerCase();
    setFeedback({ correct, picked: cat });
    if (correct) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
    setTimeout(() => {
      setCurrent((c) => c + 1);
      setFeedback(null);
    }, 700);
  };

  if (isDone) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={s.summaryCard}
      >
        <h2 style={{ color: 'var(--text-primary)', fontSize: 24 }}>Category Sort Complete!</h2>
        <div style={s.bigScore}>
          {score}/{items.length}
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
          Time: {elapsed}s | Accuracy: {Math.round((score / items.length) * 100)}%
        </p>
        <button style={s.btn('var(--accent-blue)')} onClick={onComplete}>
          Play Again
        </button>
      </motion.div>
    );
  }

  return (
    <div>
      <div style={s.statsRow}>
        <span style={s.stat('var(--accent-green)')}>Score: {score}</span>
        <span style={s.stat('var(--accent-orange)')}>
          {streak >= 3 && (
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
              style={{ marginRight: 4 }}
            >
              🔥
            </motion.span>
          )}
          Streak: {streak}
        </span>
        <span style={s.stat('var(--accent-blue)')}>Time: {elapsed}s</span>
        <span style={s.stat('var(--accent-blue)')}>
          {current + 1}/{items.length}
        </span>
      </div>
      <div style={s.progressBar}>
        <div style={s.progressFill(((current + 1) / items.length) * 100)} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={order[current]}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          style={{ ...s.card, textAlign: 'center' }}
        >
          <p
            style={{
              fontSize: 12,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: 1,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            Which category?
          </p>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 28,
              marginTop: 0,
            }}
          >
            {item.service}
          </h2>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 12,
              justifyContent: 'center',
            }}
          >
            {CATEGORY_OPTIONS.map((cat) => {
              let bg = CATEGORY_COLORS[cat] || '#666';
              let opacity = 1;
              if (feedback) {
                if (feedback.correct && feedback.picked === cat) {
                  bg = 'var(--accent-green)';
                } else if (!feedback.correct && feedback.picked === cat) {
                  bg = 'var(--accent-red)';
                } else if (
                  !feedback.correct &&
                  cat.toLowerCase() === item.category.toLowerCase()
                ) {
                  bg = 'var(--accent-green)';
                } else {
                  opacity = 0.4;
                }
              }
              return (
                <motion.button
                  key={cat}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePick(cat)}
                  style={{
                    padding: '14px 28px',
                    borderRadius: 12,
                    border: 'none',
                    background: bg,
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: feedback ? 'default' : 'pointer',
                    opacity,
                    transition: 'all 0.2s',
                    minWidth: 120,
                  }}
                >
                  {cat}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ========== MAIN COMPONENT ========== */
export default function ConnectionGame() {
  const [mode, setMode] = useState(0);
  const [key, setKey] = useState(0); // force remount on replay

  const replay = () => setKey((k) => k + 1);

  return (
    <div style={s.page}>
      <h1 style={s.title}>Connection Game</h1>
      <p style={s.subtitle}>Match, link, and categorize AWS services</p>

      <div style={s.tabs}>
        {MODES.map((m, i) => (
          <button
            key={m}
            style={s.tab(mode === i)}
            onClick={() => {
              setMode(i);
              setKey((k) => k + 1);
            }}
          >
            {m}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${mode}-${key}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25 }}
        >
          {mode === 0 && (
            <MatchPairs pairs={gameData.matchPairs} onComplete={replay} />
          )}
          {mode === 1 && (
            <FindTheLink questions={gameData.linkQuestions} onComplete={replay} />
          )}
          {mode === 2 && (
            <CategorySort items={gameData.categorySort} onComplete={replay} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

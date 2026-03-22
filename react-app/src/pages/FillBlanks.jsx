import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import questions from '../data/fillBlanks.json';

const CATEGORY_COLORS = {
  compute: '#f97316',
  storage: '#3b82f6',
  database: '#8b5cf6',
  networking: '#06b6d4',
  security: '#ef4444',
  serverless: '#f59e0b',
  monitoring: '#10b981',
  migration: '#ec4899',
  analytics: '#6366f1',
  ml: '#14b8a6',
};

function getCategoryColor(cat) {
  return CATEGORY_COLORS[cat?.toLowerCase()] || 'var(--accent-orange)';
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderQuestionText(text) {
  const parts = text.split('_____');
  return parts.map((part, i) => (
    <span key={i}>
      {part}
      {i < parts.length - 1 && (
        <span
          style={{
            display: 'inline-block',
            minWidth: 80,
            borderBottom: '3px solid var(--accent-orange)',
            margin: '0 4px',
            padding: '0 8px',
          }}
        >
          &nbsp;
        </span>
      )}
    </span>
  ));
}

export default function FillBlanks() {
  const categories = useMemo(() => {
    const cats = [...new Set(questions.map((q) => q.category))];
    return cats.sort();
  }, []);

  const [activeCategory, setActiveCategory] = useState('all');
  const [questionOrder, setQuestionOrder] = useState(() =>
    shuffleArray(questions.map((q) => q.id))
  );
  const [answered, setAnswered] = useState(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [score, setScore] = useState({ correct: 0, attempted: 0 });
  const [streak, setStreak] = useState(0);

  const filtered = useMemo(() => {
    const ids =
      activeCategory === 'all'
        ? questionOrder
        : questionOrder.filter((id) => {
            const q = questions.find((qq) => qq.id === id);
            return q && q.category === activeCategory;
          });
    return ids.filter((id) => !answered.has(id));
  }, [activeCategory, questionOrder, answered]);

  const totalInFilter = useMemo(() => {
    if (activeCategory === 'all') return questions.length;
    return questions.filter((q) => q.category === activeCategory).length;
  }, [activeCategory]);

  const answeredInFilter = totalInFilter - filtered.length;
  const currentId = filtered[currentIndex] ?? null;
  const currentQuestion = currentId
    ? questions.find((q) => q.id === currentId)
    : null;
  const isDone = filtered.length === 0;

  const checkAnswer = useCallback(() => {
    if (!currentQuestion || checked) return;
    const trimmed = input.trim().toLowerCase();
    const correct =
      trimmed === currentQuestion.answer.toLowerCase() ||
      (currentQuestion.aliases || []).some(
        (a) => a.toLowerCase() === trimmed
      );
    setIsCorrect(correct);
    setChecked(true);
    setScore((s) => ({
      correct: s.correct + (correct ? 1 : 0),
      attempted: s.attempted + 1,
    }));
    setStreak((s) => (correct ? s + 1 : 0));
  }, [currentQuestion, input, checked]);

  const goNext = useCallback(() => {
    if (currentId !== null) {
      setAnswered((prev) => new Set([...prev, currentId]));
    }
    setInput('');
    setChecked(false);
    setIsCorrect(false);
    setShowHint(false);
    setCurrentIndex(0);
  }, [currentId]);

  const skip = useCallback(() => {
    if (filtered.length <= 1) return;
    setCurrentIndex((i) => (i + 1) % filtered.length);
    setInput('');
    setChecked(false);
    setIsCorrect(false);
    setShowHint(false);
  }, [filtered.length]);

  const shuffle = useCallback(() => {
    setQuestionOrder(shuffleArray(questions.map((q) => q.id)));
    setCurrentIndex(0);
    setInput('');
    setChecked(false);
    setIsCorrect(false);
    setShowHint(false);
  }, []);

  const reset = useCallback(() => {
    setAnswered(new Set());
    setCurrentIndex(0);
    setInput('');
    setChecked(false);
    setIsCorrect(false);
    setShowHint(false);
    setScore({ correct: 0, attempted: 0 });
    setStreak(0);
    setQuestionOrder(shuffleArray(questions.map((q) => q.id)));
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (checked) goNext();
      else checkAnswer();
    }
  };

  const styles = {
    page: {
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: '32px 24px',
      fontFamily: "'Inter', system-ui, sans-serif",
      maxWidth: 800,
      margin: '0 auto',
    },
    header: {
      marginBottom: 24,
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
      margin: 0,
    },
    filterBar: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 20,
    },
    pill: (active, color) => ({
      padding: '6px 16px',
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
      gap: 16,
      marginBottom: 20,
      flexWrap: 'wrap',
    },
    statBadge: (bg) => ({
      padding: '8px 16px',
      borderRadius: 12,
      background: bg,
      color: '#fff',
      fontSize: 14,
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }),
    progressBar: {
      width: '100%',
      height: 8,
      background: 'var(--bg-secondary)',
      borderRadius: 4,
      marginBottom: 24,
      overflow: 'hidden',
    },
    progressFill: (pct) => ({
      height: '100%',
      width: `${pct}%`,
      background: 'var(--accent-green)',
      borderRadius: 4,
      transition: 'width 0.4s ease',
    }),
    card: {
      background: 'var(--bg-card)',
      borderRadius: 16,
      padding: 32,
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      border: '1px solid var(--border-color)',
      marginBottom: 24,
    },
    categoryBadge: (color) => ({
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: 12,
      background: color + '22',
      color: color,
      fontSize: 12,
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 16,
    }),
    questionText: {
      fontSize: 22,
      fontWeight: 500,
      color: 'var(--text-primary)',
      lineHeight: 1.6,
      marginBottom: 24,
    },
    inputRow: {
      display: 'flex',
      gap: 12,
      marginBottom: 16,
      flexWrap: 'wrap',
    },
    input: {
      flex: 1,
      minWidth: 200,
      padding: '12px 16px',
      borderRadius: 12,
      border: '2px solid var(--border-color)',
      background: 'var(--bg-secondary)',
      color: 'var(--text-primary)',
      fontSize: 16,
      outline: 'none',
      transition: 'border-color 0.2s',
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
      transition: 'transform 0.1s, opacity 0.2s',
      whiteSpace: 'nowrap',
    }),
    btnSecondary: {
      padding: '12px 24px',
      borderRadius: 12,
      border: '2px solid var(--border-color)',
      background: 'transparent',
      color: 'var(--text-secondary)',
      fontSize: 15,
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    feedback: (correct) => ({
      padding: 16,
      borderRadius: 12,
      background: correct ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
      border: `1px solid ${correct ? 'var(--accent-green)' : 'var(--accent-red)'}`,
      marginTop: 16,
    }),
    feedbackTitle: (correct) => ({
      fontSize: 18,
      fontWeight: 700,
      color: correct ? 'var(--accent-green)' : 'var(--accent-red)',
      marginBottom: 8,
    }),
    tip: {
      fontSize: 14,
      color: 'var(--text-secondary)',
      lineHeight: 1.5,
    },
    hint: {
      padding: '12px 16px',
      borderRadius: 12,
      background: 'rgba(59,130,246,0.08)',
      border: '1px solid rgba(59,130,246,0.2)',
      color: 'var(--accent-blue)',
      fontSize: 14,
      marginTop: 12,
    },
    actionRow: {
      display: 'flex',
      gap: 12,
      marginTop: 20,
    },
    summaryCard: {
      background: 'var(--bg-card)',
      borderRadius: 16,
      padding: 48,
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      border: '1px solid var(--border-color)',
      textAlign: 'center',
    },
    summaryTitle: {
      fontSize: 28,
      fontWeight: 700,
      color: 'var(--text-primary)',
      marginBottom: 8,
    },
    summaryScore: {
      fontSize: 64,
      fontWeight: 800,
      color: 'var(--accent-green)',
      margin: '16px 0',
    },
    streakFire: {
      display: 'inline-block',
      fontSize: 20,
    },
  };

  const progressPct = totalInFilter > 0 ? (answeredInFilter / totalInFilter) * 100 : 0;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Fill in the Blanks</h1>
        <p style={styles.subtitle}>
          Test your AWS knowledge with active recall
        </p>
      </div>

      {/* Category Filters */}
      <div style={styles.filterBar}>
        <button
          style={styles.pill(activeCategory === 'all', 'var(--accent-blue)')}
          onClick={() => {
            setActiveCategory('all');
            setCurrentIndex(0);
            setInput('');
            setChecked(false);
            setShowHint(false);
          }}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            style={styles.pill(activeCategory === cat, getCategoryColor(cat))}
            onClick={() => {
              setActiveCategory(cat);
              setCurrentIndex(0);
              setInput('');
              setChecked(false);
              setShowHint(false);
            }}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Stats Row */}
      <div style={styles.statsRow}>
        <div style={styles.statBadge('var(--accent-green)')}>
          Score: {score.correct}/{score.attempted}
        </div>
        <div style={styles.statBadge('var(--accent-orange)')}>
          <span style={styles.streakFire}>
            {streak >= 3 && (
              <motion.span
                animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
                style={{ display: 'inline-block' }}
              >
                🔥
              </motion.span>
            )}
          </span>
          Streak: {streak}
        </div>
        <div style={styles.statBadge('var(--accent-blue)')}>
          Progress: {answeredInFilter}/{totalInFilter}
        </div>
        <button style={styles.btnSecondary} onClick={shuffle}>
          🔀 Shuffle
        </button>
      </div>

      {/* Progress Bar */}
      <div style={styles.progressBar}>
        <motion.div
          style={styles.progressFill(progressPct)}
          layout
          transition={{ duration: 0.4 }}
        />
      </div>

      <AnimatePresence mode="wait">
        {isDone ? (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            style={styles.summaryCard}
          >
            <div style={styles.summaryTitle}>Session Complete!</div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
              You answered all{' '}
              {activeCategory !== 'all'
                ? `"${activeCategory}" `
                : ''}
              questions
            </p>
            <div style={styles.summaryScore}>
              {score.attempted > 0
                ? Math.round((score.correct / score.attempted) * 100)
                : 0}
              %
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
              {score.correct} correct out of {score.attempted} attempted
            </p>
            <button style={styles.btn('var(--accent-blue)')} onClick={reset}>
              Start Over
            </button>
          </motion.div>
        ) : currentQuestion ? (
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.3 }}
            style={styles.card}
          >
            <div
              style={styles.categoryBadge(
                getCategoryColor(currentQuestion.category)
              )}
            >
              {currentQuestion.category}
            </div>
            <div style={styles.questionText}>
              {renderQuestionText(currentQuestion.text)}
            </div>

            <div style={styles.inputRow}>
              <input
                style={{
                  ...styles.input,
                  borderColor: checked
                    ? isCorrect
                      ? 'var(--accent-green)'
                      : 'var(--accent-red)'
                    : 'var(--border-color)',
                }}
                type="text"
                placeholder="Type your answer..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={checked}
                autoFocus
              />
              {!checked && (
                <button
                  style={styles.btn(
                    input.trim() ? 'var(--accent-green)' : '#888'
                  )}
                  onClick={checkAnswer}
                  disabled={!input.trim()}
                >
                  Check
                </button>
              )}
            </div>

            {!checked && (
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  style={styles.btnSecondary}
                  onClick={() => setShowHint(!showHint)}
                >
                  {showHint ? 'Hide Hint' : 'Show Hint'}
                </button>
                <button style={styles.btnSecondary} onClick={skip}>
                  Skip →
                </button>
              </div>
            )}

            {showHint && !checked && currentQuestion.hint && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={styles.hint}
              >
                💡 {currentQuestion.hint}
              </motion.div>
            )}

            {checked && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div style={styles.feedback(isCorrect)}>
                  <div style={styles.feedbackTitle(isCorrect)}>
                    {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                  </div>
                  {!isCorrect && (
                    <p
                      style={{
                        color: 'var(--text-primary)',
                        fontSize: 15,
                        marginBottom: 8,
                      }}
                    >
                      The answer is:{' '}
                      <strong>{currentQuestion.answer}</strong>
                    </p>
                  )}
                  {currentQuestion.tip && (
                    <p style={styles.tip}>{currentQuestion.tip}</p>
                  )}
                </div>
                <div style={styles.actionRow}>
                  <button
                    style={styles.btn('var(--accent-blue)')}
                    onClick={goNext}
                  >
                    Next →
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

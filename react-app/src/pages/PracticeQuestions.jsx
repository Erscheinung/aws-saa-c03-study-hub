import { useMemo, useState, useCallback } from 'react'
import questions from '../data/practiceQuestions.json'

// Letters used to label options in both modes.
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

function arrayEqualSet(a, b) {
  if (a.length !== b.length) return false
  const sa = new Set(a)
  for (const x of b) if (!sa.has(x)) return false
  return true
}

function QuestionCard({ q, index, total, state, onSelect, onReveal, onNext, showNext = true }) {
  const multi = q.answers.length > 1
  const selected = state?.selected ?? []
  const revealed = state?.revealed ?? false

  const toggle = (i) => {
    if (revealed) return
    if (multi) {
      const next = selected.includes(i) ? selected.filter((x) => x !== i) : [...selected, i]
      onSelect(next)
    } else {
      onSelect([i])
    }
  }

  const correct = revealed && arrayEqualSet(selected, q.answers)

  return (
    <div style={styles.card}>
      <div style={styles.meta}>
        <span style={styles.qNum}>Q {index + 1}{total ? ` / ${total}` : ''}</span>
        {multi && <span style={styles.multiBadge}>Choose {q.answers.length}</span>}
      </div>
      <div style={styles.qText}>{q.q}</div>
      <ul style={styles.options}>
        {q.options.map((opt, i) => {
          const isSelected = selected.includes(i)
          const isCorrect = q.answers.includes(i)
          let bg = 'transparent'
          let border = 'var(--border)'
          if (revealed) {
            if (isCorrect) { bg = 'rgba(34,197,94,0.18)'; border = '#22c55e' }
            else if (isSelected) { bg = 'rgba(239,68,68,0.18)'; border = '#ef4444' }
          } else if (isSelected) {
            bg = 'rgba(168,85,247,0.18)'; border = 'var(--accent)'
          }
          return (
            <li
              key={i}
              onClick={() => toggle(i)}
              style={{
                ...styles.option,
                background: bg,
                borderColor: border,
                cursor: revealed ? 'default' : 'pointer',
              }}
            >
              <span style={styles.letter}>{LETTERS[i]}</span>
              <span>{opt}</span>
            </li>
          )
        })}
      </ul>
      <div style={styles.actionsRow}>
        {!revealed ? (
          <button
            onClick={onReveal}
            disabled={selected.length === 0}
            style={{ ...styles.btn, opacity: selected.length === 0 ? 0.4 : 1 }}
          >
            Check answer
          </button>
        ) : (
          <>
            <span style={{ ...styles.resultTag, color: correct ? '#22c55e' : '#ef4444' }}>
              {correct ? '✓ Correct' : '✕ Incorrect'}
            </span>
            {showNext && (
              <button onClick={onNext} style={styles.btn}>Next question →</button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function PracticeQuestions() {
  const [mode, setMode] = useState('random') // 'random' | 'all'
  // Random mode state ─────────────────────────────────────────────────────
  const [randomIdx, setRandomIdx] = useState(() => Math.floor(Math.random() * questions.length))
  const [randomState, setRandomState] = useState({ selected: [], revealed: false })
  // View-all mode state ───────────────────────────────────────────────────
  const [allStates, setAllStates] = useState({}) // { [qId]: { selected, revealed } }

  const pickRandom = useCallback(() => {
    let next = randomIdx
    if (questions.length > 1) {
      while (next === randomIdx) next = Math.floor(Math.random() * questions.length)
    }
    setRandomIdx(next)
    setRandomState({ selected: [], revealed: false })
  }, [randomIdx])

  const randomQ = questions[randomIdx]

  const stats = useMemo(() => {
    let answered = 0
    let correct = 0
    for (const [id, st] of Object.entries(allStates)) {
      if (!st?.revealed) continue
      answered++
      const q = questions.find((x) => x.id === Number(id))
      if (q && arrayEqualSet(st.selected, q.answers)) correct++
    }
    return { answered, correct }
  }, [allStates])

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Practice Questions</h1>
          <p style={styles.sub}>
            {questions.length} SAA-C03 practice questions (as of Oct 2025). Credit:{' '}
            <a
              href="https://github.com/Ditectrev/AWS-Certified-Solutions-Architect-Associate-SAA-C03-Practice-Tests-Exams-Questions-Answers"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.creditLink}
            >
              Ditectrev
            </a>
          </p>
        </div>
      </header>

      <div style={styles.tabs} role="tablist">
        <button
          role="tab"
          aria-selected={mode === 'random'}
          onClick={() => setMode('random')}
          style={mode === 'random' ? styles.tabActive : styles.tab}
        >
          🎲 Random Question
        </button>
        <button
          role="tab"
          aria-selected={mode === 'all'}
          onClick={() => setMode('all')}
          style={mode === 'all' ? styles.tabActive : styles.tab}
        >
          📋 View All
        </button>
      </div>

      {mode === 'random' && (
        <div style={styles.randomWrap}>
          <QuestionCard
            q={randomQ}
            index={randomIdx}
            total={questions.length}
            state={randomState}
            onSelect={(sel) => setRandomState((s) => ({ ...s, selected: sel }))}
            onReveal={() => setRandomState((s) => ({ ...s, revealed: true }))}
            onNext={pickRandom}
          />
          <button onClick={pickRandom} style={styles.skipBtn}>
            Skip to another question
          </button>
        </div>
      )}

      {mode === 'all' && (
        <div>
          <div style={styles.statsBar}>
            <span>Answered: <strong>{stats.answered}</strong> / {questions.length}</span>
            <span style={{ color: '#22c55e' }}>Correct: <strong>{stats.correct}</strong></span>
            {stats.answered > 0 && (
              <span>Accuracy: <strong>{Math.round((stats.correct / stats.answered) * 100)}%</strong></span>
            )}
          </div>
          <div style={styles.allList}>
            {questions.map((q, i) => {
              const st = allStates[q.id] || { selected: [], revealed: false }
              return (
                <QuestionCard
                  key={q.id}
                  q={q}
                  index={i}
                  total={questions.length}
                  state={st}
                  showNext={false}
                  onSelect={(sel) => setAllStates((a) => ({ ...a, [q.id]: { ...(a[q.id] || {}), selected: sel, revealed: false } }))}
                  onReveal={() => setAllStates((a) => ({ ...a, [q.id]: { ...(a[q.id] || { selected: [] }), revealed: true } }))}
                  onNext={() => {}}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  page: {
    maxWidth: 860,
    margin: '0 auto',
    padding: '16px 16px 48px',
    fontFamily: 'var(--sans, system-ui)',
    color: 'var(--text-h, #f1f5f9)',
  },
  header: {
    marginBottom: 14,
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 800,
    fontFamily: 'var(--heading, sans-serif)',
  },
  sub: {
    color: 'var(--text, #94a3b8)',
    fontSize: 13,
    margin: '4px 0 0',
    lineHeight: 1.5,
  },
  creditLink: {
    color: 'var(--accent, #a855f7)',
    textDecoration: 'underline',
  },
  tabs: {
    display: 'flex',
    gap: 8,
    marginBottom: 16,
    borderBottom: '1px solid var(--border, #334155)',
    paddingBottom: 0,
  },
  tab: {
    padding: '10px 16px',
    border: 'none',
    background: 'transparent',
    color: 'var(--text, #94a3b8)',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    fontFamily: 'var(--sans, system-ui)',
  },
  tabActive: {
    padding: '10px 16px',
    border: 'none',
    background: 'transparent',
    color: 'var(--accent, #a855f7)',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    borderBottom: '2px solid var(--accent, #a855f7)',
    fontFamily: 'var(--sans, system-ui)',
  },
  randomWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  skipBtn: {
    padding: '8px 14px',
    borderRadius: 8,
    border: '1px solid var(--border, #334155)',
    background: 'transparent',
    color: 'var(--text, #cbd5e1)',
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'var(--sans, system-ui)',
  },
  card: {
    width: '100%',
    background: 'var(--code-bg, #1e293b)',
    border: '1px solid var(--border, #334155)',
    borderRadius: 14,
    padding: '18px 20px 16px',
    marginBottom: 14,
  },
  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  qNum: {
    fontFamily: 'var(--mono, monospace)',
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--accent, #a855f7)',
    letterSpacing: 0.5,
  },
  multiBadge: {
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: 8,
    background: 'rgba(245,158,11,0.18)',
    color: '#fbbf24',
    border: '1px solid rgba(245,158,11,0.4)',
    fontFamily: 'var(--mono, monospace)',
    letterSpacing: 0.5,
  },
  qText: {
    fontSize: 15,
    lineHeight: 1.55,
    color: 'var(--text-h, #f8fafc)',
    marginBottom: 12,
  },
  options: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  option: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '10px 12px',
    border: '1px solid',
    borderRadius: 10,
    fontSize: 13.5,
    lineHeight: 1.5,
    color: 'var(--text, #e2e8f0)',
    transition: 'background 0.15s, border-color 0.15s',
  },
  letter: {
    flexShrink: 0,
    width: 22,
    height: 22,
    borderRadius: 6,
    background: 'rgba(148,163,184,0.18)',
    color: 'var(--text-h, #f1f5f9)',
    fontFamily: 'var(--mono, monospace)',
    fontSize: 11,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  btn: {
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    background: 'var(--accent, #a855f7)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: 'var(--sans, system-ui)',
  },
  resultTag: {
    fontSize: 13,
    fontWeight: 800,
    fontFamily: 'var(--mono, monospace)',
  },
  statsBar: {
    display: 'flex',
    gap: 20,
    flexWrap: 'wrap',
    padding: '10px 14px',
    background: 'var(--code-bg, #1e293b)',
    border: '1px solid var(--border, #334155)',
    borderRadius: 10,
    marginBottom: 14,
    fontSize: 13,
    color: 'var(--text, #cbd5e1)',
    fontFamily: 'var(--mono, monospace)',
    position: 'sticky',
    top: 8,
    zIndex: 5,
    backdropFilter: 'blur(6px)',
  },
  allList: {
    display: 'flex',
    flexDirection: 'column',
  },
}

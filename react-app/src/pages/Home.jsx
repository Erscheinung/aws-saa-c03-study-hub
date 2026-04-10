import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getLogoUrl, getAbbreviation } from '../data/serviceLogos'
import AwsLogo from '../components/common/AwsLogo'

/* ─── Service Catcher Game ─── */

const GAME_W = 600
const GAME_H = 300
const BUCKET_W = 80
const BUCKET_H = 22
const ITEM_SIZE = 38
const MAX_MISSES = 3

// Service catalog used by both the catcher and the logo quiz.
// Adding a new service is one line — just append to this list.
const SERVICES = [
  { id: 'ec2', name: 'EC2' },
  { id: 's3', name: 'S3' },
  { id: 'iam', name: 'IAM' },
  { id: 'lambda', name: 'Lambda' },
  { id: 'dynamodb', name: 'DynamoDB' },
  { id: 'cloudfront', name: 'CloudFront' },
  { id: 'sqs', name: 'SQS' },
  { id: 'sns', name: 'SNS' },
  { id: 'waf', name: 'WAF' },
  { id: 'cloudwatch', name: 'CloudWatch' },
  { id: 'route53', name: 'Route 53' },
  { id: 'kms', name: 'KMS' },
  { id: 'ecs', name: 'ECS' },
  { id: 'elb', name: 'ELB' },
  { id: 'ebs', name: 'EBS' },
  { id: 'rds', name: 'RDS' },
  { id: 'aurora', name: 'Aurora' },
  { id: 'vpc', name: 'VPC' },
  { id: 'cloudformation', name: 'CloudFormation' },
  { id: 'sns', name: 'SNS' },
]

// Image cache so the canvas catcher can draw real SVG logos.
// Falls back to a styled abbreviation chip if the network image fails.
const logoImageCache = new Map()
function getLogoImage(svc) {
  const url = getLogoUrl(svc.id) || getLogoUrl(svc.name)
  if (!url) return null
  let entry = logoImageCache.get(svc.id)
  if (entry) return entry
  const img = new Image()
  img.crossOrigin = 'anonymous'
  entry = { img, loaded: false, failed: false }
  img.onload = () => { entry.loaded = true }
  img.onerror = () => { entry.failed = true }
  img.src = url
  logoImageCache.set(svc.id, entry)
  return entry
}

function ServiceCatcherGame() {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const animRef = useRef(null)
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(MAX_MISSES)
  const [gameOver, setGameOver] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [highScore, setHighScore] = useState(() => {
    try { return parseInt(localStorage.getItem('serviceCatcherHigh') || '0', 10) } catch { return 0 }
  })
  const [caughtName, setCaughtName] = useState('')
  const caughtTimer = useRef(null)

  const initState = useCallback(() => ({
    bucketX: GAME_W / 2 - BUCKET_W / 2,
    items: [],
    particles: [],
    spawnTimer: 0,
    spawnInterval: 60,
    speedMult: 1,
    score: 0,
    lives: MAX_MISSES,
    frame: 0,
    gameOver: false,
  }), [])

  const startGame = useCallback(() => {
    stateRef.current = initState()
    setScore(0)
    setLives(MAX_MISSES)
    setGameOver(false)
    setPlaying(true)
    setCaughtName('')
  }, [initState])

  // Mouse / touch tracking
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const handleMove = (clientX) => {
      if (!stateRef.current || stateRef.current.gameOver) return
      const rect = canvas.getBoundingClientRect()
      const scaleX = GAME_W / rect.width
      const x = (clientX - rect.left) * scaleX
      stateRef.current.bucketX = Math.max(0, Math.min(GAME_W - BUCKET_W, x - BUCKET_W / 2))
    }
    const onMouse = (e) => handleMove(e.clientX)
    const onTouch = (e) => { e.preventDefault(); handleMove(e.touches[0].clientX) }
    canvas.addEventListener('mousemove', onMouse)
    canvas.addEventListener('touchmove', onTouch, { passive: false })
    return () => {
      canvas.removeEventListener('mousemove', onMouse)
      canvas.removeEventListener('touchmove', onTouch)
    }
  }, [])

  // Game loop
  useEffect(() => {
    if (!playing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const loop = () => {
      const s = stateRef.current
      if (!s || s.gameOver) return

      s.frame++
      // increase difficulty
      if (s.frame % 300 === 0) {
        s.speedMult += 0.15
        s.spawnInterval = Math.max(20, s.spawnInterval - 4)
      }

      // spawn
      s.spawnTimer++
      if (s.spawnTimer >= s.spawnInterval) {
        s.spawnTimer = 0
        const svc = SERVICES[Math.floor(Math.random() * SERVICES.length)]
        // Kick off the image load (cached after the first time).
        getLogoImage(svc)
        s.items.push({
          x: Math.random() * (GAME_W - ITEM_SIZE),
          y: -ITEM_SIZE,
          speed: (1.2 + Math.random() * 1.5) * s.speedMult,
          id: svc.id,
          name: svc.name,
          size: ITEM_SIZE,
        })
      }

      // update items
      for (let i = s.items.length - 1; i >= 0; i--) {
        const item = s.items[i]
        item.y += item.speed

        // caught?
        if (
          item.y + item.size >= GAME_H - BUCKET_H - 4 &&
          item.y + item.size <= GAME_H &&
          item.x + item.size / 2 >= s.bucketX &&
          item.x + item.size / 2 <= s.bucketX + BUCKET_W
        ) {
          s.score++
          setScore(s.score)
          setCaughtName(item.name)
          clearTimeout(caughtTimer.current)
          caughtTimer.current = setTimeout(() => setCaughtName(''), 800)
          // particles
          for (let p = 0; p < 8; p++) {
            s.particles.push({
              x: item.x + item.size / 2,
              y: GAME_H - BUCKET_H,
              vx: (Math.random() - 0.5) * 4,
              vy: -Math.random() * 3 - 1,
              life: 30,
              color: `hsl(${Math.random() * 60 + 260}, 90%, 65%)`,
            })
          }
          s.items.splice(i, 1)
          continue
        }

        // missed
        if (item.y > GAME_H + 10) {
          s.items.splice(i, 1)
          s.lives--
          setLives(s.lives)
          if (s.lives <= 0) {
            s.gameOver = true
            setGameOver(true)
            setPlaying(false)
            const prev = parseInt(localStorage.getItem('serviceCatcherHigh') || '0', 10)
            if (s.score > prev) {
              localStorage.setItem('serviceCatcherHigh', String(s.score))
              setHighScore(s.score)
            }
            return
          }
        }
      }

      // update particles
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.1
        p.life--
        if (p.life <= 0) s.particles.splice(i, 1)
      }

      // draw
      ctx.clearRect(0, 0, GAME_W, GAME_H)

      // subtle grid
      ctx.strokeStyle = 'rgba(140,100,255,0.06)'
      ctx.lineWidth = 1
      for (let gx = 0; gx < GAME_W; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, GAME_H); ctx.stroke()
      }
      for (let gy = 0; gy < GAME_H; gy += 40) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(GAME_W, gy); ctx.stroke()
      }

      // items — draw official logos with abbreviation fallback
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      for (const item of s.items) {
        const entry = getLogoImage({ id: item.id, name: item.name })
        if (entry && entry.loaded) {
          // White rounded chip behind the logo so it pops on the dark canvas.
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.roundRect(item.x, item.y, item.size, item.size, 8)
          ctx.fill()
          const pad = 4
          ctx.drawImage(entry.img, item.x + pad, item.y + pad, item.size - pad * 2, item.size - pad * 2)
        } else {
          // Fallback chip with abbreviation
          const grad = ctx.createLinearGradient(item.x, item.y, item.x + item.size, item.y + item.size)
          grad.addColorStop(0, '#a855f7')
          grad.addColorStop(1, '#6366f1')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.roundRect(item.x, item.y, item.size, item.size, 8)
          ctx.fill()
          ctx.fillStyle = '#fff'
          ctx.font = 'bold 13px var(--mono, monospace)'
          ctx.fillText(getAbbreviation(item.name), item.x + item.size / 2, item.y + item.size / 2)
        }
      }
      ctx.textAlign = 'start'
      ctx.textBaseline = 'top'

      // particles
      for (const p of s.particles) {
        ctx.globalAlpha = p.life / 30
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      // bucket
      const gradient = ctx.createLinearGradient(s.bucketX, GAME_H - BUCKET_H, s.bucketX + BUCKET_W, GAME_H)
      gradient.addColorStop(0, '#a855f7')
      gradient.addColorStop(1, '#6366f1')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.roundRect(s.bucketX, GAME_H - BUCKET_H, BUCKET_W, BUCKET_H, [4, 4, 0, 0])
      ctx.fill()

      // bucket shine
      ctx.fillStyle = 'rgba(255,255,255,0.25)'
      ctx.beginPath()
      ctx.roundRect(s.bucketX + 4, GAME_H - BUCKET_H + 2, BUCKET_W - 8, 6, 3)
      ctx.fill()

      animRef.current = requestAnimationFrame(loop)
    }

    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [playing])

  // Draw idle canvas
  useEffect(() => {
    if (playing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, GAME_W, GAME_H)
    ctx.strokeStyle = 'rgba(140,100,255,0.06)'
    ctx.lineWidth = 1
    for (let gx = 0; gx < GAME_W; gx += 40) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, GAME_H); ctx.stroke()
    }
    for (let gy = 0; gy < GAME_H; gy += 40) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(GAME_W, gy); ctx.stroke()
    }
  }, [playing])

  return (
    <div style={gameStyles.wrapper}>
      <div style={gameStyles.header}>
        <div style={gameStyles.scoreRow}>
          <span style={gameStyles.scoreText}>Score: {score}</span>
          <span style={gameStyles.livesText}>
            {Array.from({ length: MAX_MISSES }, (_, i) => (
              <span key={i} style={{ opacity: i < lives ? 1 : 0.2 }}>{'\u2764\uFE0F'}</span>
            ))}
          </span>
          <span style={gameStyles.highScoreText}>Best: {highScore}</span>
        </div>
        {caughtName && (
          <motion.span
            key={caughtName + score}
            style={gameStyles.caughtBadge}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            +1 {caughtName}!
          </motion.span>
        )}
      </div>
      <div style={gameStyles.canvasWrap}>
        <canvas
          ref={canvasRef}
          width={GAME_W}
          height={GAME_H}
          style={gameStyles.canvas}
        />
        {!playing && (
          <div style={gameStyles.overlay}>
            {gameOver ? (
              <>
                <div style={gameStyles.gameOverText}>Game Over!</div>
                <div style={gameStyles.finalScore}>Score: {score}</div>
              </>
            ) : (
              <div style={gameStyles.tagline}>{'\uD83C\uDF1F'} Catch AWS Services! {'\uD83C\uDF1F'}</div>
            )}
            <button onClick={startGame} style={gameStyles.playBtn}>
              {gameOver ? '\uD83D\uDD04 Play Again' : '\u25B6\uFE0F Start Game'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const gameStyles = {
  wrapper: {
    width: '100%',
    maxWidth: '620px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '10px',
    minHeight: '32px',
  },
  scoreRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flex: 1,
  },
  scoreText: {
    fontFamily: 'var(--mono)',
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--accent)',
  },
  livesText: {
    fontSize: '16px',
    display: 'flex',
    gap: '2px',
  },
  highScoreText: {
    fontFamily: 'var(--mono)',
    fontSize: '13px',
    color: 'var(--text)',
    marginLeft: 'auto',
  },
  caughtBadge: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '20px',
    background: 'var(--accent-bg)',
    color: 'var(--accent)',
    fontSize: '13px',
    fontWeight: 600,
    fontFamily: 'var(--mono)',
  },
  canvasWrap: {
    position: 'relative',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid var(--border)',
    background: '#0d0d1a',
    aspectRatio: '2 / 1',
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    background: 'rgba(13,13,26,0.85)',
    backdropFilter: 'blur(4px)',
  },
  tagline: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#e2e8f0',
  },
  gameOverText: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#f87171',
    fontFamily: 'var(--heading)',
  },
  finalScore: {
    fontSize: '18px',
    color: '#c084fc',
    fontFamily: 'var(--mono)',
    fontWeight: 600,
  },
  playBtn: {
    padding: '10px 28px',
    border: 'none',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--sans)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: '0 4px 20px rgba(168,85,247,0.35)',
  },
}

/* ─── Logo Quiz Mini Game ─── */
// Pop-quiz: render an AWS logo, ask the user to pick the matching service.
// Uses the same shared SERVICES list (and serviceLogos.js) as the catcher.

function pickRandom(arr, n, exclude) {
  const pool = arr.filter((x) => !exclude || x.id !== exclude.id)
  const result = []
  while (result.length < n && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length)
    result.push(pool.splice(idx, 1)[0])
  }
  return result
}

function makeQuestion() {
  const target = SERVICES[Math.floor(Math.random() * SERVICES.length)]
  const distractors = pickRandom(SERVICES, 3, target)
  const options = [...distractors, target].sort(() => Math.random() - 0.5)
  return { target, options }
}

function LogoQuizGame() {
  const [question, setQuestion] = useState(makeQuestion)
  const [picked, setPicked] = useState(null)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(() => {
    try { return parseInt(localStorage.getItem('logoQuizBestStreak') || '0', 10) } catch { return 0 }
  })

  const onPick = (opt) => {
    if (picked) return
    setPicked(opt)
    if (opt.id === question.target.id) {
      setScore((v) => v + 1)
      setStreak((v) => {
        const next = v + 1
        if (next > bestStreak) {
          setBestStreak(next)
          try { localStorage.setItem('logoQuizBestStreak', String(next)) } catch { /* noop */ }
        }
        return next
      })
    } else {
      setStreak(0)
    }
    setTimeout(() => {
      setPicked(null)
      setQuestion(makeQuestion())
    }, 900)
  }

  return (
    <div style={quizStyles.wrapper}>
      <div style={quizStyles.scoreRow}>
        <span style={quizStyles.scoreText}>Score: {score}</span>
        <span style={quizStyles.streakText}>Streak: {streak}</span>
        <span style={quizStyles.bestText}>Best: {bestStreak}</span>
      </div>

      <div style={quizStyles.logoStage}>
        <AnimatePresence mode="wait">
          <motion.div
            key={question.target.id + '-' + score}
            initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            style={quizStyles.logoCard}
          >
            <AwsLogo service={question.target.id} size={120} />
          </motion.div>
        </AnimatePresence>
        <p style={quizStyles.prompt}>Which AWS service is this?</p>
      </div>

      <div style={quizStyles.optionsGrid}>
        {question.options.map((opt) => {
          const isCorrect = picked && opt.id === question.target.id
          const isWrongPick = picked && picked.id === opt.id && opt.id !== question.target.id
          let bg = 'var(--code-bg, #1e293b)'
          let border = 'var(--border, #334155)'
          let color = 'var(--text-h, #f1f5f9)'
          if (isCorrect) { bg = 'rgba(34,197,94,0.18)'; border = '#22c55e'; color = '#22c55e' }
          else if (isWrongPick) { bg = 'rgba(239,68,68,0.18)'; border = '#ef4444'; color = '#ef4444' }
          return (
            <motion.button
              key={opt.id + opt.name}
              onClick={() => onPick(opt)}
              disabled={!!picked}
              whileHover={!picked ? { scale: 1.04 } : undefined}
              whileTap={!picked ? { scale: 0.97 } : undefined}
              style={{
                ...quizStyles.option,
                background: bg,
                borderColor: border,
                color,
                cursor: picked ? 'default' : 'pointer',
              }}
            >
              {opt.name}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

const quizStyles = {
  wrapper: {
    width: '100%',
    maxWidth: '620px',
    margin: '0 auto',
    padding: '20px',
    borderRadius: '16px',
    border: '1px solid var(--border, #334155)',
    background: 'var(--code-bg, #0d0d1a)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  scoreRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    fontFamily: 'var(--mono, monospace)',
    fontSize: '14px',
  },
  scoreText: { color: 'var(--accent, #a855f7)', fontWeight: 700 },
  streakText: { color: '#22c55e', fontWeight: 700 },
  bestText: { color: 'var(--text, #94a3b8)' },
  logoStage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 0',
  },
  logoCard: {
    padding: '14px',
    borderRadius: '20px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border, #334155)',
    boxShadow: '0 8px 32px rgba(168,85,247,0.18)',
  },
  prompt: {
    margin: 0,
    color: 'var(--text-h, #e2e8f0)',
    fontWeight: 600,
    fontSize: '15px',
    fontFamily: 'var(--sans)',
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
  },
  option: {
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid',
    fontWeight: 600,
    fontSize: '14px',
    fontFamily: 'var(--sans)',
    transition: 'background 0.2s, border-color 0.2s, color 0.2s',
  },
}

/* ─── Section animation wrapper ─── */

function Section({ children, style, delay = 0 }) {
  return (
    <motion.section
      style={style}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.section>
  )
}

/* ─── Study Module Cards ─── */

const modules = [
  { emoji: '\uD83E\uDDE0', title: 'Mind Map', desc: 'Interactive service explorer with 50+ AWS services', to: '/mindmap' },
  { emoji: '\u270D\uFE0F', title: 'Fill Blanks', desc: 'Test your memory on critical AWS limits', to: '/exercises/fill-blanks' },
  { emoji: '\uD83D\uDD17', title: 'Connection Game', desc: 'Match services, find links, sort categories', to: '/exercises/connection-game' },
  { emoji: '\uD83D\uDD0D', title: 'Deduction Trainer', desc: 'Master exam elimination strategy', to: '/exercises/deduction' },
  { emoji: '\uD83C\uDFAE', title: 'Cloud Walker', desc: 'Explore an AWS pixel world', to: '/games/cloud-walker' },
  { emoji: '\uD83C\uDFC6', title: 'Jeopardy', desc: 'Classic quiz show with AWS categories', to: '/games/jeopardy' },
  { emoji: '\uD83D\uDCE6', title: 'Service Sorter', desc: 'Sort services into categories at speed', to: '/games/service-sorter' },
  { emoji: '\uD83D\uDCCB', title: 'Cheatsheet', desc: 'Quick reference for exam day', to: '/cheatsheet' },
  { emoji: '\uD83D\uDCDA', title: 'Chapters', desc: 'Domain-by-domain deep dive', to: '/chapters' },
]

function ModuleCard({ emoji, title, desc, to, index }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <motion.div
        style={{
          ...s.card,
          ...(hovered ? s.cardHover : {}),
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay: index * 0.07 }}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.98 }}
      >
        <span style={s.cardEmoji}>{emoji}</span>
        <h3 style={s.cardTitle}>{title}</h3>
        <p style={s.cardDesc}>{desc}</p>
      </motion.div>
    </Link>
  )
}

/* ─── Domain Bar Chart ─── */

const domains = [
  { name: 'Security', pct: 30, color: '#ef4444' },
  { name: 'Resilient Architecture', pct: 26, color: '#3b82f6' },
  { name: 'High-Performing', pct: 24, color: '#a855f7' },
  { name: 'Cost-Optimized', pct: 20, color: '#22c55e' },
]

function DomainBar({ name, pct, color, index }) {
  return (
    <motion.div
      style={s.domainRow}
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <div style={s.domainLabel}>
        <span style={s.domainName}>{name}</span>
        <span style={{ ...s.domainPct, color }}>{pct}%</span>
      </div>
      <div style={s.barTrack}>
        <motion.div
          style={{ ...s.barFill, background: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: index * 0.1 + 0.3, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  )
}

/* ─── Tips ─── */

const tips = [
  'Read ALL options before answering',
  'Look for keywords: cost-effective, highly available, etc.',
  'Eliminate obviously wrong answers first',
  'When in doubt, choose the AWS-managed option',
  'Multi-AZ = High Availability, Multi-Region = Disaster Recovery',
  'Serverless first unless specific requirements say otherwise',
]

/* ─── Floating particles background ─── */

function ParticleBackground() {
  return (
    <div style={s.particleBg} aria-hidden="true">
      <style>{`
        @keyframes float-particle {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-100vh) translateX(40px) scale(0.5); opacity: 0; }
        }
        .home-particle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
      `}</style>
      {Array.from({ length: 20 }, (_, i) => {
        const size = 4 + Math.random() * 8
        const left = Math.random() * 100
        const delay = Math.random() * 12
        const duration = 10 + Math.random() * 10
        const hue = 260 + Math.random() * 40
        return (
          <div
            key={i}
            className="home-particle"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              bottom: '-20px',
              background: `hsla(${hue}, 80%, 65%, 0.5)`,
              animation: `float-particle ${duration}s ${delay}s infinite linear`,
            }}
          />
        )
      })}
    </div>
  )
}

/* ─── Main Home Component ─── */

export default function Home() {
  return (
    <div style={s.page}>
      {/* Hero */}
      <section style={s.hero}>
        <ParticleBackground />
        <div style={s.heroContent}>
          <motion.h1
            style={s.heroTitle}
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            AWS SAA-C03{' '}
            <span style={s.heroTitleAccent}>Study Hub</span>
          </motion.h1>
          <motion.p
            style={s.heroSub}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            Master AWS Solutions Architect &ndash; Associate
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Link to="/mindmap" style={s.ctaBtn}>
              Start Studying {'\u2192'}
            </Link>
          </motion.div>
          <motion.div
            style={s.statsRow}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            {['65+ Questions', '50+ Services', '6 Game Modes'].map((text, i) => (
              <span key={i} style={s.statBadge}>
                {text}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mini Game */}
      <Section style={s.section}>
        <h2 style={s.sectionTitle}>{'\uD83C\uDFAE'} Service Catcher</h2>
        <p style={s.sectionSub}>Can you catch all the AWS services? Move your mouse to steer the bucket!</p>
        <ServiceCatcherGame />
      </Section>

      {/* Logo Quiz */}
      <Section style={s.section} delay={0.05}>
        <h2 style={s.sectionTitle}>{'\uD83C\uDFAF'} Logo Quiz</h2>
        <p style={s.sectionSub}>Identify the AWS service from its official logo &mdash; great for cementing recognition.</p>
        <LogoQuizGame />
      </Section>

      {/* Study Modules */}
      <Section style={s.section} delay={0.1}>
        <h2 style={s.sectionTitle}>{'\uD83D\uDCDA'} Study Modules</h2>
        <p style={s.sectionSub}>Everything you need to pass the SAA-C03 exam</p>
        <div style={s.grid}>
          {modules.map((m, i) => (
            <ModuleCard key={m.title} {...m} index={i} />
          ))}
        </div>
      </Section>

      {/* Exam Info */}
      <Section style={s.section} delay={0.1}>
        <h2 style={s.sectionTitle}>{'\uD83D\uDCCA'} Exam Domains</h2>
        <p style={s.sectionSub}>Know the weight of each domain to focus your studies</p>
        <div style={s.domainsWrap}>
          {domains.map((d, i) => (
            <DomainBar key={d.name} {...d} index={i} />
          ))}
        </div>
        <div style={s.examFacts}>
          {[
            { label: 'Questions', value: '65' },
            { label: 'Duration', value: '130 min' },
            { label: 'Pass Score', value: '720/1000' },
            { label: 'Cost', value: '$150' },
          ].map((f) => (
            <div key={f.label} style={s.factCard}>
              <div style={s.factValue}>{f.value}</div>
              <div style={s.factLabel}>{f.label}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Tips */}
      <Section style={{ ...s.section, paddingBottom: '80px' }} delay={0.1}>
        <h2 style={s.sectionTitle}>{'\uD83D\uDCA1'} Exam Tips</h2>
        <p style={s.sectionSub}>Pro strategies to maximize your score</p>
        <div style={s.tipsGrid}>
          {tips.map((tip, i) => (
            <motion.div
              key={i}
              style={s.tipCard}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ scale: 1.03, borderColor: 'var(--accent-border)' }}
            >
              <span style={s.tipNumber}>{String(i + 1).padStart(2, '0')}</span>
              <p style={s.tipText}>{tip}</p>
            </motion.div>
          ))}
        </div>
      </Section>
    </div>
  )
}

/* ─── All Styles ─── */

const s = {
  page: {
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
  },

  /* Hero */
  hero: {
    position: 'relative',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  particleBg: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  heroContent: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '20px',
    maxWidth: '700px',
  },
  heroTitle: {
    fontSize: 'clamp(2.5rem, 6vw, 4rem)',
    fontWeight: 800,
    fontFamily: 'var(--heading)',
    color: 'var(--text-h)',
    lineHeight: 1.1,
    letterSpacing: '-2px',
    margin: 0,
  },
  heroTitleAccent: {
    background: 'linear-gradient(135deg, #a855f7, #6366f1, #06b6d4)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  heroSub: {
    fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
    color: 'var(--text)',
    fontWeight: 400,
    margin: 0,
    maxWidth: '500px',
  },
  ctaBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '14px 36px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
    color: '#fff',
    fontSize: '18px',
    fontWeight: 600,
    textDecoration: 'none',
    fontFamily: 'var(--sans)',
    boxShadow: '0 8px 30px rgba(168,85,247,0.35)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  statsRow: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: '12px',
  },
  statBadge: {
    padding: '6px 16px',
    borderRadius: '20px',
    background: 'var(--accent-bg)',
    color: 'var(--accent)',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'var(--mono)',
    border: '1px solid var(--accent-border)',
  },

  /* Sections */
  section: {
    padding: '60px 20px',
    maxWidth: '900px',
    margin: '0 auto',
  },
  sectionTitle: {
    fontSize: 'clamp(1.5rem, 3vw, 2rem)',
    fontWeight: 700,
    fontFamily: 'var(--heading)',
    color: 'var(--text-h)',
    textAlign: 'center',
    margin: '0 0 8px',
  },
  sectionSub: {
    textAlign: 'center',
    color: 'var(--text)',
    fontSize: '16px',
    margin: '0 0 36px',
  },

  /* Module Cards */
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  card: {
    padding: '28px 24px',
    borderRadius: '16px',
    border: '1px solid var(--border)',
    background: 'var(--code-bg)',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'border-color 0.3s, box-shadow 0.3s',
  },
  cardHover: {
    borderColor: 'var(--accent-border)',
    boxShadow: '0 0 30px rgba(168,85,247,0.15)',
  },
  cardEmoji: {
    display: 'block',
    fontSize: '36px',
    marginBottom: '12px',
  },
  cardTitle: {
    margin: '0 0 6px',
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-h)',
    fontFamily: 'var(--heading)',
  },
  cardDesc: {
    margin: 0,
    fontSize: '14px',
    color: 'var(--text)',
    lineHeight: 1.5,
  },

  /* Domains */
  domainsWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '36px',
  },
  domainRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  domainLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  domainName: {
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text-h)',
  },
  domainPct: {
    fontSize: '15px',
    fontWeight: 700,
    fontFamily: 'var(--mono)',
  },
  barTrack: {
    height: '10px',
    borderRadius: '5px',
    background: 'var(--code-bg)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '5px',
  },

  /* Exam Facts */
  examFacts: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '16px',
  },
  factCard: {
    padding: '20px',
    borderRadius: '12px',
    background: 'var(--code-bg)',
    border: '1px solid var(--border)',
    textAlign: 'center',
  },
  factValue: {
    fontSize: '24px',
    fontWeight: 800,
    color: 'var(--accent)',
    fontFamily: 'var(--mono)',
    marginBottom: '4px',
  },
  factLabel: {
    fontSize: '13px',
    color: 'var(--text)',
    fontWeight: 500,
  },

  /* Tips */
  tipsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
  tipCard: {
    padding: '20px 24px',
    borderRadius: '12px',
    border: '1px solid var(--border)',
    background: 'var(--code-bg)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '14px',
    transition: 'border-color 0.3s, box-shadow 0.3s',
  },
  tipNumber: {
    fontFamily: 'var(--mono)',
    fontSize: '20px',
    fontWeight: 800,
    color: 'var(--accent)',
    lineHeight: 1.4,
    flexShrink: 0,
  },
  tipText: {
    margin: 0,
    fontSize: '15px',
    color: 'var(--text-h)',
    lineHeight: 1.5,
    fontWeight: 500,
  },
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AwsLogo from '../components/common/AwsLogo';

const AWS_SERVICES = [
  // Compute
  { name: 'EC2', category: 'Compute' },
  { name: 'Lambda', category: 'Compute' },
  { name: 'Fargate', category: 'Compute' },
  { name: 'ECS', category: 'Compute' },
  { name: 'EKS', category: 'Compute' },
  { name: 'Elastic Beanstalk', category: 'Compute' },
  { name: 'Lightsail', category: 'Compute' },
  { name: 'Batch', category: 'Compute' },
  { name: 'Outposts', category: 'Compute' },
  { name: 'App Runner', category: 'Compute' },
  { name: 'Wavelength', category: 'Compute' },
  // Storage
  { name: 'S3', category: 'Storage' },
  { name: 'EBS', category: 'Storage' },
  { name: 'EFS', category: 'Storage' },
  { name: 'FSx', category: 'Storage' },
  { name: 'S3 Glacier', category: 'Storage' },
  { name: 'Storage Gateway', category: 'Storage' },
  { name: 'Snow Family', category: 'Storage' },
  { name: 'Backup', category: 'Storage' },
  { name: 'S3 Outposts', category: 'Storage' },
  { name: 'DataSync', category: 'Storage' },
  // Database
  { name: 'RDS', category: 'Database' },
  { name: 'DynamoDB', category: 'Database' },
  { name: 'Aurora', category: 'Database' },
  { name: 'ElastiCache', category: 'Database' },
  { name: 'Redshift', category: 'Database' },
  { name: 'Neptune', category: 'Database' },
  { name: 'DocumentDB', category: 'Database' },
  { name: 'Keyspaces', category: 'Database' },
  { name: 'QLDB', category: 'Database' },
  { name: 'Timestream', category: 'Database' },
  { name: 'MemoryDB', category: 'Database' },
  // Networking
  { name: 'VPC', category: 'Networking' },
  { name: 'CloudFront', category: 'Networking' },
  { name: 'Route 53', category: 'Networking' },
  { name: 'API Gateway', category: 'Networking' },
  { name: 'Direct Connect', category: 'Networking' },
  { name: 'Global Accelerator', category: 'Networking' },
  { name: 'Transit Gateway', category: 'Networking' },
  { name: 'PrivateLink', category: 'Networking' },
  { name: 'ELB', category: 'Networking' },
  { name: 'App Mesh', category: 'Networking' },
  { name: 'Cloud Map', category: 'Networking' },
  // Security
  { name: 'IAM', category: 'Security' },
  { name: 'WAF', category: 'Security' },
  { name: 'Shield', category: 'Security' },
  { name: 'KMS', category: 'Security' },
  { name: 'CloudHSM', category: 'Security' },
  { name: 'Cognito', category: 'Security' },
  { name: 'GuardDuty', category: 'Security' },
  { name: 'Inspector', category: 'Security' },
  { name: 'Macie', category: 'Security' },
  { name: 'Secrets Manager', category: 'Security' },
  { name: 'ACM', category: 'Security' },
  { name: 'Security Hub', category: 'Security' },
];

const CATEGORIES = ['Compute', 'Storage', 'Database', 'Networking', 'Security'];

const CAT_COLORS = {
  Compute: '#f97316',
  Storage: '#3b82f6',
  Database: '#8b5cf6',
  Networking: '#06b6d4',
  Security: '#ef4444',
};

const CAT_ICONS = {
  Compute: '\u2699',
  Storage: '\u{1F4E6}',
  Database: '\u{1F5C4}',
  Networking: '\u{1F310}',
  Security: '\u{1F512}',
};

const LS_KEY = 'aws-sorter-highscore';
const BASE_SPEED = 0.6; // px per frame
const SPEED_INCREMENT = 0.15;
const SPAWN_INTERVAL_BASE = 2800; // ms
const SPAWN_INTERVAL_MIN = 1200;
const CARD_WIDTH = 140;
const CARD_HEIGHT = 60;
const BELT_HEIGHT = 100;
const BELT_Y = 60; // top offset of the belt area within game zone

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getHighScore() {
  try {
    return parseInt(localStorage.getItem(LS_KEY), 10) || 0;
  } catch {
    return 0;
  }
}

function setHighScore(val) {
  try {
    localStorage.setItem(LS_KEY, String(val));
  } catch { /* noop */ }
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    padding: '24px 16px',
    fontFamily: 'var(--sans)',
    maxWidth: 960,
    margin: '0 auto',
    userSelect: 'none',
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    color: 'var(--text-h)',
    margin: '0 0 4px',
    fontFamily: 'var(--heading)',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: 14,
    color: 'var(--text)',
    margin: '0 0 20px',
    opacity: 0.7,
  },
  startScreen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '70vh',
    textAlign: 'center',
    gap: 20,
  },
  startTitle: {
    fontSize: 42,
    fontWeight: 900,
    fontFamily: 'var(--heading)',
    color: 'var(--text-h)',
    lineHeight: 1.1,
  },
  startSub: {
    fontSize: 16,
    color: 'var(--text)',
    opacity: 0.7,
    maxWidth: 440,
    lineHeight: 1.5,
  },
  startBtn: {
    padding: '16px 48px',
    fontSize: 18,
    fontWeight: 700,
    background: 'var(--accent)',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    fontFamily: 'var(--sans)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
  },
  highScoreLabel: {
    fontSize: 14,
    color: 'var(--accent)',
    fontWeight: 600,
  },
  hud: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  hudStat: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--text)',
    fontFamily: 'var(--mono)',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  livesContainer: {
    display: 'flex',
    gap: 4,
  },
  heart: (alive) => ({
    fontSize: 20,
    opacity: alive ? 1 : 0.2,
    transition: 'opacity 0.3s',
    filter: alive ? 'none' : 'grayscale(1)',
  }),
  gameArea: {
    position: 'relative',
    background: 'var(--code-bg)',
    borderRadius: 16,
    border: '2px solid var(--border)',
    overflow: 'hidden',
    minHeight: 200,
    marginBottom: 16,
  },
  beltTrack: {
    position: 'relative',
    height: BELT_HEIGHT,
    marginTop: BELT_Y,
    borderTop: '3px solid var(--border)',
    borderBottom: '3px solid var(--border)',
    background: 'repeating-linear-gradient(90deg, var(--border) 0px, var(--border) 2px, transparent 2px, transparent 30px)',
    backgroundSize: '30px 100%',
    overflow: 'visible',
  },
  serviceCard: (selected, flash) => ({
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    top: (BELT_HEIGHT - CARD_HEIGHT) / 2,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    fontWeight: 700,
    fontSize: 12,
    fontFamily: 'var(--mono)',
    color: '#fff',
    cursor: 'pointer',
    transition: 'box-shadow 0.15s, transform 0.1s',
    boxShadow: selected
      ? '0 0 0 3px #fff, 0 0 20px rgba(255,255,255,0.4)'
      : '0 2px 8px rgba(0,0,0,0.3)',
    transform: selected ? 'scale(1.08)' : 'scale(1)',
    zIndex: selected ? 10 : 1,
    background: flash === 'correct'
      ? '#22c55e'
      : flash === 'wrong'
        ? '#ef4444'
        : 'linear-gradient(135deg, var(--accent) 0%, var(--accent-border) 100%)',
    padding: '6px 8px',
    lineHeight: 1.15,
    gap: 4,
  }),
  binsRow: {
    display: 'flex',
    gap: 8,
    justifyContent: 'center',
    flexWrap: 'wrap',
    padding: '0 8px',
  },
  bin: (color, hover) => ({
    flex: '1 1 120px',
    maxWidth: 170,
    minWidth: 90,
    padding: '18px 8px 14px',
    borderRadius: 14,
    border: `2px solid ${color}`,
    background: hover ? `${color}22` : 'var(--code-bg)',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'background 0.15s, transform 0.1s, box-shadow 0.15s',
    transform: hover ? 'translateY(-3px)' : 'none',
    boxShadow: hover ? `0 6px 20px ${color}44` : '0 2px 8px rgba(0,0,0,0.15)',
  }),
  binIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  binLabel: (color) => ({
    fontSize: 13,
    fontWeight: 700,
    color: color,
    fontFamily: 'var(--sans)',
  }),
  comboPopup: {
    position: 'absolute',
    top: 10,
    right: 16,
    fontSize: 22,
    fontWeight: 900,
    fontFamily: 'var(--heading)',
    pointerEvents: 'none',
  },
  gameOverScreen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '70vh',
    textAlign: 'center',
    gap: 16,
  },
  gameOverTitle: {
    fontSize: 48,
    fontWeight: 900,
    fontFamily: 'var(--heading)',
    color: '#ef4444',
  },
  finalScore: {
    fontSize: 28,
    fontWeight: 800,
    color: 'var(--text-h)',
    fontFamily: 'var(--heading)',
  },
  newHighScore: {
    fontSize: 16,
    fontWeight: 700,
    color: '#22c55e',
  },
  statGrid: {
    display: 'flex',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
    margin: '8px 0',
  },
  statBox: {
    background: 'var(--code-bg)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '12px 20px',
    textAlign: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 800,
    color: 'var(--accent)',
    fontFamily: 'var(--mono)',
  },
  statLabel: {
    fontSize: 11,
    color: 'var(--text)',
    opacity: 0.6,
    marginTop: 2,
  },
  beltRollerLeft: {
    position: 'absolute',
    left: -6,
    top: -8,
    width: 16,
    height: BELT_HEIGHT + 16,
    borderRadius: 8,
    background: 'var(--border)',
    zIndex: 5,
  },
  beltRollerRight: {
    position: 'absolute',
    right: -6,
    top: -8,
    width: 16,
    height: BELT_HEIGHT + 16,
    borderRadius: 8,
    background: 'var(--border)',
    zIndex: 5,
  },
  instructions: {
    display: 'flex',
    gap: 24,
    justifyContent: 'center',
    flexWrap: 'wrap',
    margin: '16px 0',
  },
  instructionStep: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    color: 'var(--text)',
    opacity: 0.8,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'var(--accent)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 800,
    fontSize: 13,
    flexShrink: 0,
  },
};

let idCounter = 0;

export default function ServiceSorter() {
  const [screen, setScreen] = useState('start'); // start | play | over
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [level, setLevel] = useState(1);
  const [sorted, setSorted] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredBin, setHoveredBin] = useState(null);
  const [flashes, setFlashes] = useState({}); // { cardId: 'correct'|'wrong' }
  const [comboPopup, setComboPopup] = useState(null);
  const [highScore, setHigh] = useState(getHighScore);
  const [isNewHigh, setIsNewHigh] = useState(false);
  const [finalStats, setFinalStats] = useState({});

  const cardsRef = useRef([]); // { id, service, x }
  const animRef = useRef(null);
  const spawnTimerRef = useRef(null);
  const gameAreaRef = useRef(null);
  const livesRef = useRef(3);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const sortedRef = useRef(0);
  const levelRef = useRef(1);
  const serviceQueueRef = useRef([]);
  const totalMissedRef = useRef(0);
  const totalWrongRef = useRef(0);
  const bestComboRef = useRef(0);
  const beltOffsetRef = useRef(0);
  const lastFrameRef = useRef(0);

  const getSpeed = useCallback(() => {
    return BASE_SPEED + (levelRef.current - 1) * SPEED_INCREMENT;
  }, []);

  const getSpawnInterval = useCallback(() => {
    return Math.max(SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_BASE - (levelRef.current - 1) * 150);
  }, []);

  const getAreaWidth = useCallback(() => {
    if (gameAreaRef.current) return gameAreaRef.current.offsetWidth;
    return 800;
  }, []);

  const nextService = useCallback(() => {
    if (serviceQueueRef.current.length === 0) {
      serviceQueueRef.current = shuffle(AWS_SERVICES);
    }
    return serviceQueueRef.current.pop();
  }, []);

  const spawnCard = useCallback(() => {
    const svc = nextService();
    const w = getAreaWidth();
    idCounter += 1;
    cardsRef.current.push({
      id: idCounter,
      service: svc,
      x: w + 20,
    });
  }, [nextService, getAreaWidth]);

  const endGame = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    clearInterval(spawnTimerRef.current);
    const finalScore = scoreRef.current;
    const isNew = finalScore > getHighScore();
    if (isNew) {
      setHighScore(finalScore);
      setHigh(finalScore);
    }
    setIsNewHigh(isNew);
    setFinalStats({
      score: finalScore,
      sorted: sortedRef.current,
      missed: totalMissedRef.current,
      wrong: totalWrongRef.current,
      bestCombo: bestComboRef.current,
      level: levelRef.current,
    });
    setScreen('over');
  }, []);

  const gameLoop = useCallback((timestamp) => {
    if (!lastFrameRef.current) lastFrameRef.current = timestamp;
    const delta = timestamp - lastFrameRef.current;
    lastFrameRef.current = timestamp;

    const speed = getSpeed();
    const pxMove = speed * (delta / 16.67); // normalize to ~60fps

    // Move belt pattern
    beltOffsetRef.current = (beltOffsetRef.current - pxMove) % 30;

    const cards = cardsRef.current;
    const toRemove = [];

    for (let i = 0; i < cards.length; i++) {
      cards[i].x -= pxMove;
      if (cards[i].x < -CARD_WIDTH - 20) {
        toRemove.push(cards[i].id);
      }
    }

    if (toRemove.length > 0) {
      for (const id of toRemove) {
        totalMissedRef.current += 1;
        livesRef.current -= 1;
        comboRef.current = 0;
        setCombo(0);
      }
      cardsRef.current = cards.filter((c) => !toRemove.includes(c.id));
      setLives(livesRef.current);

      if (livesRef.current <= 0) {
        endGame();
        return;
      }
    }

    // Force re-render by updating a trivial state (we use score as proxy, but also need positional updates)
    setScore(scoreRef.current);
    animRef.current = requestAnimationFrame(gameLoop);
  }, [getSpeed, endGame]);

  const startGame = useCallback(() => {
    cardsRef.current = [];
    serviceQueueRef.current = shuffle(AWS_SERVICES);
    livesRef.current = 3;
    scoreRef.current = 0;
    comboRef.current = 0;
    sortedRef.current = 0;
    levelRef.current = 1;
    totalMissedRef.current = 0;
    totalWrongRef.current = 0;
    bestComboRef.current = 0;
    beltOffsetRef.current = 0;
    lastFrameRef.current = 0;
    idCounter = 0;

    setScore(0);
    setLives(3);
    setCombo(0);
    setLevel(1);
    setSorted(0);
    setSelectedId(null);
    setFlashes({});
    setComboPopup(null);
    setIsNewHigh(false);
    setScreen('play');

    // Spawn first card immediately
    spawnCard();

    // Start spawn timer
    spawnTimerRef.current = setInterval(() => {
      // Don't over-fill belt
      if (cardsRef.current.length < 6) {
        spawnCard();
      }
    }, getSpawnInterval());

    // Start animation
    animRef.current = requestAnimationFrame(gameLoop);
  }, [spawnCard, getSpawnInterval, gameLoop]);

  // Update spawn interval when level changes
  useEffect(() => {
    if (screen !== 'play') return;
    clearInterval(spawnTimerRef.current);
    spawnTimerRef.current = setInterval(() => {
      if (cardsRef.current.length < 6) {
        spawnCard();
      }
    }, getSpawnInterval());
    return () => clearInterval(spawnTimerRef.current);
  }, [level, screen, spawnCard, getSpawnInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current);
      clearInterval(spawnTimerRef.current);
    };
  }, []);

  const handleCardClick = useCallback((id) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleBinClick = useCallback((category) => {
    if (selectedId === null) return;

    const card = cardsRef.current.find((c) => c.id === selectedId);
    if (!card) {
      setSelectedId(null);
      return;
    }

    const correct = card.service.category === category;

    // Flash effect
    setFlashes((prev) => ({ ...prev, [card.id]: correct ? 'correct' : 'wrong' }));
    setTimeout(() => {
      setFlashes((prev) => {
        const next = { ...prev };
        delete next[card.id];
        return next;
      });
    }, 400);

    if (correct) {
      comboRef.current += 1;
      const multiplier = Math.max(1, comboRef.current);
      const points = 10 * multiplier;
      scoreRef.current += points;
      sortedRef.current += 1;
      if (comboRef.current > bestComboRef.current) {
        bestComboRef.current = comboRef.current;
      }

      setScore(scoreRef.current);
      setCombo(comboRef.current);
      setSorted(sortedRef.current);

      if (comboRef.current >= 2) {
        setComboPopup({ multiplier: comboRef.current, key: Date.now() });
      }

      // Level up every 10 sorted
      if (sortedRef.current % 10 === 0) {
        levelRef.current += 1;
        setLevel(levelRef.current);
      }

      // Remove card
      cardsRef.current = cardsRef.current.filter((c) => c.id !== card.id);
    } else {
      comboRef.current = 0;
      livesRef.current -= 1;
      totalWrongRef.current += 1;
      setCombo(0);
      setLives(livesRef.current);

      if (livesRef.current <= 0) {
        // Small delay so player sees the red flash
        setTimeout(() => endGame(), 350);
      }
    }

    setSelectedId(null);
  }, [selectedId, endGame]);

  // ---- RENDER ----

  if (screen === 'start') {
    return (
      <div style={s.page}>
        <div style={s.startScreen}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            <div style={s.startTitle}>AWS Service</div>
            <div style={{ ...s.startTitle, color: 'var(--accent)' }}>Sorter</div>
          </motion.div>
          <motion.p
            style={s.startSub}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            AWS services roll in on a conveyor belt. Click a service, then sort it
            into the correct category bin before it falls off the edge!
          </motion.p>
          <div style={s.instructions}>
            <div style={s.instructionStep}>
              <div style={s.stepNum}>1</div>
              <span>Click a service card</span>
            </div>
            <div style={s.instructionStep}>
              <div style={s.stepNum}>2</div>
              <span>Click the correct bin</span>
            </div>
            <div style={s.instructionStep}>
              <div style={s.stepNum}>3</div>
              <span>Build combos for points</span>
            </div>
          </div>
          <motion.button
            style={s.startBtn}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={startGame}
          >
            Start Sorting
          </motion.button>
          {highScore > 0 && (
            <motion.div
              style={s.highScoreLabel}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              High Score: {highScore}
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  if (screen === 'over') {
    return (
      <div style={s.page}>
        <div style={s.gameOverScreen}>
          <motion.div
            style={s.gameOverTitle}
            initial={{ scale: 2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 150, damping: 12 }}
          >
            Game Over
          </motion.div>
          <motion.div
            style={s.finalScore}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Score: {finalStats.score}
          </motion.div>
          {isNewHigh && (
            <motion.div
              style={s.newHighScore}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
            >
              New High Score!
            </motion.div>
          )}
          <motion.div
            style={s.statGrid}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div style={s.statBox}>
              <div style={s.statValue}>{finalStats.sorted}</div>
              <div style={s.statLabel}>Sorted</div>
            </div>
            <div style={s.statBox}>
              <div style={s.statValue}>{finalStats.missed}</div>
              <div style={s.statLabel}>Missed</div>
            </div>
            <div style={s.statBox}>
              <div style={s.statValue}>{finalStats.wrong}</div>
              <div style={s.statLabel}>Wrong</div>
            </div>
            <div style={s.statBox}>
              <div style={s.statValue}>{finalStats.bestCombo}x</div>
              <div style={s.statLabel}>Best Combo</div>
            </div>
            <div style={s.statBox}>
              <div style={s.statValue}>Lv.{finalStats.level}</div>
              <div style={s.statLabel}>Level</div>
            </div>
          </motion.div>
          <motion.button
            style={s.startBtn}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={startGame}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Play Again
          </motion.button>
          <motion.div
            style={s.highScoreLabel}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            High Score: {Math.max(highScore, finalStats.score)}
          </motion.div>
        </div>
      </div>
    );
  }

  // ---- PLAY SCREEN ----
  const cards = cardsRef.current;
  const beltBgPos = `${beltOffsetRef.current}px 0`;

  return (
    <div style={s.page}>
      <div style={s.hud}>
        <div style={s.hudStat}>
          Score: <span style={{ color: 'var(--accent)' }}>{score}</span>
        </div>
        <div style={s.hudStat}>
          Lv.{level}
        </div>
        <div style={s.hudStat}>
          Sorted: {sorted}
        </div>
        {combo >= 2 && (
          <div style={{ ...s.hudStat, color: '#22c55e' }}>
            {combo}x Combo
          </div>
        )}
        <div style={s.livesContainer}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={s.heart(i < lives)}>
              {'\u2764'}
            </span>
          ))}
        </div>
      </div>

      <div style={s.gameArea} ref={gameAreaRef}>
        <div
          style={{
            ...s.beltTrack,
            backgroundPosition: beltBgPos,
          }}
        >
          <div style={s.beltRollerLeft} />
          <div style={s.beltRollerRight} />

          {cards.map((card) => (
            <div
              key={card.id}
              style={{
                ...s.serviceCard(
                  selectedId === card.id,
                  flashes[card.id] || null
                ),
                left: card.x,
              }}
              onClick={() => handleCardClick(card.id)}
            >
              {/* Phase 5: official AWS logo with text fallback (shared serviceLogos.js) */}
              <AwsLogo
                service={card.service.name}
                size={34}
                style={{ marginRight: 6 }}
              />
              <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {card.service.name}
              </span>
            </div>
          ))}
        </div>

        <AnimatePresence>
          {comboPopup && (
            <motion.div
              key={comboPopup.key}
              style={{ ...s.comboPopup, color: '#22c55e' }}
              initial={{ opacity: 1, scale: 0.5, y: 0 }}
              animate={{ opacity: 0, scale: 1.5, y: -40 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              {comboPopup.multiplier}x
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={s.binsRow}>
        {CATEGORIES.map((cat) => (
          <motion.div
            key={cat}
            style={s.bin(CAT_COLORS[cat], hoveredBin === cat)}
            onMouseEnter={() => setHoveredBin(cat)}
            onMouseLeave={() => setHoveredBin(null)}
            onClick={() => handleBinClick(cat)}
            whileTap={{ scale: 0.95 }}
          >
            <div style={s.binIcon}>{CAT_ICONS[cat]}</div>
            <div style={s.binLabel(CAT_COLORS[cat])}>{cat}</div>
          </motion.div>
        ))}
      </div>

      {selectedId && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            textAlign: 'center',
            marginTop: 12,
            fontSize: 14,
            color: 'var(--text)',
            opacity: 0.7,
          }}
        >
          Now click the correct category bin above
        </motion.div>
      )}
    </div>
  );
}

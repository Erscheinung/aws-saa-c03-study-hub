import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['Compute', 'Storage', 'Database', 'Networking', 'Security', 'Serverless'];
const POINT_VALUES = [100, 200, 300, 400, 500];

const CLUES = {
  Compute: [
    {
      points: 100,
      clue: 'This service provides resizable virtual servers in the cloud.',
      answer: 'EC2',
      options: ['EC2', 'Lambda', 'Lightsail', 'Batch'],
    },
    {
      points: 200,
      clue: 'This placement group type places instances on different physical hardware for high availability (max 7 per AZ).',
      answer: 'Spread',
      options: ['Cluster', 'Spread', 'Partition', 'Default'],
    },
    {
      points: 300,
      clue: 'This pricing model offers up to 90% discount but your instance can be terminated with a 2-minute warning.',
      answer: 'Spot Instances',
      options: ['Reserved Instances', 'Spot Instances', 'Savings Plans', 'Dedicated Hosts'],
    },
    {
      points: 400,
      clue: 'This feature lets you run containers without managing the underlying EC2 instances.',
      answer: 'Fargate',
      options: ['ECS', 'Fargate', 'EKS', 'App Runner'],
    },
    {
      points: 500,
      clue: 'This enhanced networking adapter provides OS-bypass for HPC workloads with MPI support.',
      answer: 'EFA (Elastic Fabric Adapter)',
      options: ['ENA', 'EFA (Elastic Fabric Adapter)', 'SR-IOV', 'Intel VF'],
    },
  ],
  Storage: [
    {
      points: 100,
      clue: 'This service offers 11 nines (99.999999999%) of durability for object storage.',
      answer: 'S3',
      options: ['S3', 'EBS', 'EFS', 'FSx'],
    },
    {
      points: 200,
      clue: 'This EBS volume type provides a baseline of 3,000 IOPS regardless of volume size.',
      answer: 'gp3',
      options: ['gp2', 'gp3', 'io1', 'st1'],
    },
    {
      points: 300,
      clue: 'This S3 storage class automatically moves objects between access tiers with no retrieval fees.',
      answer: 'S3 Intelligent-Tiering',
      options: ['S3 Standard-IA', 'S3 Intelligent-Tiering', 'S3 One Zone-IA', 'S3 Glacier Instant'],
    },
    {
      points: 400,
      clue: 'This storage provides the highest I/O performance but data is lost when the instance stops.',
      answer: 'Instance Store',
      options: ['EBS io2', 'Instance Store', 'EFS', 'FSx for Lustre'],
    },
    {
      points: 500,
      clue: 'This S3 feature prevents object deletion even by the root user when set to Compliance mode.',
      answer: 'S3 Object Lock',
      options: ['S3 Versioning', 'S3 Object Lock', 'S3 MFA Delete', 'S3 Bucket Policy'],
    },
  ],
  Database: [
    {
      points: 100,
      clue: 'This managed relational database service supports MySQL, PostgreSQL, MariaDB, Oracle, and SQL Server.',
      answer: 'RDS',
      options: ['RDS', 'Aurora', 'DynamoDB', 'Redshift'],
    },
    {
      points: 200,
      clue: 'This Aurora feature replicates data across multiple AWS regions with sub-second replication lag.',
      answer: 'Aurora Global Database',
      options: ['Aurora Read Replicas', 'Aurora Global Database', 'Aurora Multi-Master', 'Aurora Serverless'],
    },
    {
      points: 300,
      clue: 'This in-memory caching layer for DynamoDB provides microsecond read latency.',
      answer: 'DAX',
      options: ['ElastiCache Redis', 'ElastiCache Memcached', 'DAX', 'MemoryDB'],
    },
    {
      points: 400,
      clue: 'This database service uses columnar storage and Massively Parallel Processing for data warehousing.',
      answer: 'Redshift',
      options: ['Aurora', 'RDS', 'Redshift', 'Athena'],
    },
    {
      points: 500,
      clue: 'This DynamoDB feature provides continuous backups for the last 35 days with second-granularity restore.',
      answer: 'Point-in-Time Recovery (PITR)',
      options: ['On-Demand Backup', 'Point-in-Time Recovery (PITR)', 'DynamoDB Streams', 'Global Tables'],
    },
  ],
  Networking: [
    {
      points: 100,
      clue: 'This service distributes incoming traffic across multiple targets in one or more Availability Zones.',
      answer: 'ELB (Elastic Load Balancer)',
      options: ['ELB (Elastic Load Balancer)', 'Route 53', 'CloudFront', 'API Gateway'],
    },
    {
      points: 200,
      clue: 'This service caches content at 400+ edge locations globally to reduce latency.',
      answer: 'CloudFront',
      options: ['Global Accelerator', 'CloudFront', 'Route 53', 'Direct Connect'],
    },
    {
      points: 300,
      clue: 'This service provides a dedicated private connection from on-premises to AWS, bypassing the public internet.',
      answer: 'Direct Connect',
      options: ['Site-to-Site VPN', 'Direct Connect', 'Transit Gateway', 'PrivateLink'],
    },
    {
      points: 400,
      clue: 'This service uses Anycast IPs and the AWS global backbone to route traffic to the optimal regional endpoint.',
      answer: 'Global Accelerator',
      options: ['CloudFront', 'Global Accelerator', 'Route 53', 'Transit Gateway'],
    },
    {
      points: 500,
      clue: 'This VPC feature allows private connectivity to AWS services without needing a NAT Gateway or internet gateway.',
      answer: 'VPC Endpoints',
      options: ['VPC Peering', 'VPC Endpoints', 'Transit Gateway', 'PrivateLink'],
    },
  ],
  Security: [
    {
      points: 100,
      clue: 'This service lets you manage users, groups, roles, and policies for access control.',
      answer: 'IAM',
      options: ['IAM', 'Cognito', 'Directory Service', 'SSO'],
    },
    {
      points: 200,
      clue: 'This firewall type is stateful, allows only allow rules, and operates at the instance level.',
      answer: 'Security Groups',
      options: ['Security Groups', 'NACLs', 'WAF', 'Network Firewall'],
    },
    {
      points: 300,
      clue: 'This service provides ML-based threat detection by analyzing CloudTrail, VPC Flow Logs, and DNS logs.',
      answer: 'GuardDuty',
      options: ['Inspector', 'GuardDuty', 'Detective', 'Macie'],
    },
    {
      points: 400,
      clue: 'This managed encryption key service provides an audit trail of key usage via CloudTrail integration.',
      answer: 'KMS',
      options: ['KMS', 'CloudHSM', 'ACM', 'Secrets Manager'],
    },
    {
      points: 500,
      clue: 'This service provides dedicated FIPS 140-2 Level 3 validated hardware security modules for regulatory compliance.',
      answer: 'CloudHSM',
      options: ['KMS', 'CloudHSM', 'ACM', 'Secrets Manager'],
    },
  ],
  Serverless: [
    {
      points: 100,
      clue: 'This compute service runs code in response to events with a maximum execution time of 15 minutes.',
      answer: 'Lambda',
      options: ['Lambda', 'Fargate', 'App Runner', 'Step Functions'],
    },
    {
      points: 200,
      clue: 'This service provides a fully managed REST and WebSocket API with caching, throttling, and authorization.',
      answer: 'API Gateway',
      options: ['ALB', 'API Gateway', 'AppSync', 'CloudFront'],
    },
    {
      points: 300,
      clue: 'This service orchestrates complex multi-step workflows using a visual state machine.',
      answer: 'Step Functions',
      options: ['SWF', 'Step Functions', 'EventBridge', 'Lambda'],
    },
    {
      points: 400,
      clue: 'This serverless event bus supports event-driven architectures with pattern matching and filtering.',
      answer: 'EventBridge',
      options: ['SNS', 'SQS', 'EventBridge', 'Kinesis'],
    },
    {
      points: 500,
      clue: 'This serverless query service lets you analyze data directly in S3 using standard SQL without loading it into a database.',
      answer: 'Athena',
      options: ['Redshift Spectrum', 'Athena', 'Glue', 'EMR'],
    },
  ],
};

const FINAL_JEOPARDY = {
  category: 'Well-Architected Framework',
  clue: 'These are the six pillars of the AWS Well-Architected Framework: Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, and this sixth pillar added in 2021.',
  answer: 'Sustainability',
  options: ['Sustainability', 'Scalability', 'Governance', 'Automation'],
};

function playSound(correct) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (correct) {
      osc.frequency.value = 523;
      osc.type = 'sine';
      gain.gain.value = 0.15;
      osc.start();
      setTimeout(() => { osc.frequency.value = 659; }, 100);
      setTimeout(() => { osc.frequency.value = 784; }, 200);
      setTimeout(() => { osc.stop(); ctx.close(); }, 400);
    } else {
      osc.frequency.value = 200;
      osc.type = 'sawtooth';
      gain.gain.value = 0.1;
      osc.start();
      setTimeout(() => { osc.frequency.value = 150; }, 150);
      setTimeout(() => { osc.stop(); ctx.close(); }, 400);
    }
  } catch {}
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Jeopardy() {
  const [score, setScore] = useState(0);
  const [usedCells, setUsedCells] = useState(new Set());
  const [activeClue, setActiveClue] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [phase, setPhase] = useState('board'); // board, clue, final, wager, done
  const [wager, setWager] = useState(0);
  const [wagerInput, setWagerInput] = useState('');
  const [isDaily, setIsDaily] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [highScore] = useState(() => {
    try { return parseInt(localStorage.getItem('jeopardyHigh') || '0', 10); } catch { return 0; }
  });

  const dailyDoubles = useMemo(() => {
    const cells = [];
    CATEGORIES.forEach((cat) => {
      POINT_VALUES.forEach((pts) => {
        cells.push(`${cat}-${pts}`);
      });
    });
    const shuffled = shuffleArray(cells);
    return new Set([shuffled[0], shuffled[1]]);
  }, []);

  const totalCells = CATEGORIES.length * POINT_VALUES.length;
  const allDone = usedCells.size >= totalCells;

  const handleCellClick = useCallback((category, points) => {
    const key = `${category}-${points}`;
    if (usedCells.has(key)) return;
    const clue = CLUES[category].find((c) => c.points === points);
    if (!clue) return;

    setActiveClue({ ...clue, category });
    setSelectedAnswer(null);
    setShowResult(false);

    if (dailyDoubles.has(key)) {
      setIsDaily(true);
      setWagerInput('');
      setPhase('wager');
    } else {
      setIsDaily(false);
      setWager(points);
      setPhase('clue');
    }
  }, [usedCells, dailyDoubles]);

  const handleWagerSubmit = useCallback(() => {
    const w = parseInt(wagerInput, 10);
    const maxWager = Math.max(score, 500);
    const clamped = Math.min(Math.max(isNaN(w) ? 0 : w, 0), maxWager);
    setWager(clamped);
    setPhase('clue');
  }, [wagerInput, score]);

  const handleAnswer = useCallback((option) => {
    if (showResult) return;
    setSelectedAnswer(option);
    setShowResult(true);

    const correct = option === activeClue.answer;
    playSound(correct);

    const key = `${activeClue.category}-${activeClue.points}`;
    setUsedCells((prev) => new Set([...prev, key]));

    if (correct) {
      setScore((s) => s + wager);
    } else {
      setScore((s) => s - wager);
    }
  }, [showResult, activeClue, wager]);

  const handleBackToBoard = useCallback(() => {
    setPhase('board');
    setActiveClue(null);

    if (usedCells.size >= totalCells) {
      setPhase('final');
      setWagerInput('');
    }
  }, [usedCells.size, totalCells]);

  const handleFinalWager = useCallback(() => {
    const w = parseInt(wagerInput, 10);
    const maxW = Math.max(score, 0);
    const clamped = Math.min(Math.max(isNaN(w) ? 0 : w, 0), maxW);
    setWager(clamped);
    setActiveClue({ ...FINAL_JEOPARDY });
    setSelectedAnswer(null);
    setShowResult(false);
    setPhase('clue');
  }, [wagerInput, score]);

  const handleFinalAnswer = useCallback((option) => {
    if (showResult) return;
    setSelectedAnswer(option);
    setShowResult(true);

    const correct = option === FINAL_JEOPARDY.answer;
    playSound(correct);

    const finalScore = correct ? score + wager : score - wager;
    setScore(finalScore);

    try {
      const prev = parseInt(localStorage.getItem('jeopardyHigh') || '0', 10);
      if (finalScore > prev) localStorage.setItem('jeopardyHigh', String(finalScore));
    } catch {}
  }, [showResult, score, wager]);

  const handleFinish = useCallback(() => {
    setPhase('done');
    try {
      const prev = parseInt(localStorage.getItem('jeopardyHigh') || '0', 10);
      if (score > prev) localStorage.setItem('jeopardyHigh', String(score));
    } catch {}
  }, [score]);

  const resetGame = useCallback(() => {
    setScore(0);
    setUsedCells(new Set());
    setActiveClue(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setPhase('board');
    setGameStarted(true);
  }, []);

  if (!gameStarted) {
    return (
      <div style={s.startScreen}>
        <motion.div
          style={s.startCard}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 style={s.startTitle}>AWS Jeopardy!</h1>
          <p style={s.startSub}>Test your AWS SAA-C03 knowledge</p>
          <div style={s.startInfo}>
            <div style={s.startInfoItem}>6 Categories</div>
            <div style={s.startInfoItem}>30 Clues</div>
            <div style={s.startInfoItem}>2 Daily Doubles</div>
            <div style={s.startInfoItem}>Final Jeopardy</div>
          </div>
          {highScore > 0 && (
            <p style={s.highScoreText}>High Score: ${highScore.toLocaleString()}</p>
          )}
          <motion.button
            style={s.startBtn}
            onClick={resetGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Play Jeopardy!
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div style={s.startScreen}>
        <motion.div
          style={s.startCard}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h1 style={s.startTitle}>Game Over!</h1>
          <p style={{ ...s.startSub, fontSize: 28, color: score >= 0 ? '#22c55e' : '#ef4444' }}>
            Final Score: ${score.toLocaleString()}
          </p>
          <motion.button
            style={s.startBtn}
            onClick={resetGame}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Play Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Wager screen (Daily Double or Final Jeopardy)
  if (phase === 'wager' || phase === 'final') {
    const maxWager = phase === 'final' ? Math.max(score, 0) : Math.max(score, 500);
    return (
      <div style={s.startScreen}>
        <motion.div
          style={s.wagerCard}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          {phase === 'wager' && (
            <div style={s.dailyDoubleBadge}>DAILY DOUBLE!</div>
          )}
          {phase === 'final' && (
            <div style={s.finalBadge}>FINAL JEOPARDY</div>
          )}
          <h2 style={s.wagerTitle}>
            {phase === 'final' ? FINAL_JEOPARDY.category : activeClue?.category}
          </h2>
          <p style={s.wagerSub}>
            Current Score: <span style={{ color: score >= 0 ? '#22c55e' : '#ef4444' }}>${score.toLocaleString()}</span>
          </p>
          <p style={s.wagerLabel}>Enter your wager (max ${maxWager.toLocaleString()}):</p>
          <input
            type="number"
            value={wagerInput}
            onChange={(e) => setWagerInput(e.target.value)}
            style={s.wagerInputField}
            placeholder="0"
            min="0"
            max={maxWager}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                phase === 'final' ? handleFinalWager() : handleWagerSubmit();
              }
            }}
          />
          <motion.button
            style={s.wagerBtn}
            onClick={phase === 'final' ? handleFinalWager : handleWagerSubmit}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Lock In Wager
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Clue screen
  if (phase === 'clue' && activeClue) {
    const isFinal = allDone || activeClue.category === FINAL_JEOPARDY.category;
    const answerHandler = isFinal && activeClue.clue === FINAL_JEOPARDY.clue ? handleFinalAnswer : handleAnswer;
    return (
      <div style={s.clueScreen}>
        <motion.div
          style={s.clueCard}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div style={s.clueHeader}>
            <span style={s.clueCategory}>{activeClue.category}</span>
            {isDaily && <span style={s.dailyDoubleBadge}>DAILY DOUBLE</span>}
            <span style={s.cluePoints}>${wager}</span>
          </div>
          <p style={s.clueText}>{activeClue.clue}</p>
          <div style={s.optionsGrid}>
            {activeClue.options.map((opt) => {
              let bg = s.optionBtn.background;
              let borderColor = '#475569';
              if (showResult) {
                if (opt === activeClue.answer) {
                  bg = 'rgba(34,197,94,0.2)';
                  borderColor = '#22c55e';
                } else if (opt === selectedAnswer && opt !== activeClue.answer) {
                  bg = 'rgba(239,68,68,0.2)';
                  borderColor = '#ef4444';
                }
              } else if (opt === selectedAnswer) {
                borderColor = '#c4a35a';
              }
              return (
                <motion.button
                  key={opt}
                  style={{ ...s.optionBtn, background: bg, borderColor }}
                  onClick={() => answerHandler(opt)}
                  whileHover={!showResult ? { scale: 1.02 } : {}}
                  whileTap={!showResult ? { scale: 0.98 } : {}}
                  disabled={showResult}
                >
                  {opt}
                </motion.button>
              );
            })}
          </div>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={s.resultBanner}
            >
              {selectedAnswer === activeClue.answer ? (
                <span style={{ color: '#22c55e' }}>Correct! +${wager}</span>
              ) : (
                <span style={{ color: '#ef4444' }}>
                  Wrong! -{wager}. Answer: {activeClue.answer}
                </span>
              )}
              <motion.button
                style={s.continueBtn}
                onClick={isFinal && activeClue.clue === FINAL_JEOPARDY.clue ? handleFinish : handleBackToBoard}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isFinal && activeClue.clue === FINAL_JEOPARDY.clue ? 'See Final Score' : 'Back to Board'}
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  // Board
  return (
    <div style={s.page}>
      <div style={s.scoreBar}>
        <h1 style={s.boardTitle}>AWS Jeopardy!</h1>
        <div style={s.scoreDisplay}>
          Score: <span style={{ color: score >= 0 ? '#22c55e' : '#ef4444' }}>${score.toLocaleString()}</span>
        </div>
      </div>
      <div style={s.boardGrid}>
        {/* Category Headers */}
        {CATEGORIES.map((cat) => (
          <div key={cat} style={s.categoryHeader}>{cat}</div>
        ))}
        {/* Clue Cells */}
        {POINT_VALUES.map((pts) =>
          CATEGORIES.map((cat) => {
            const key = `${cat}-${pts}`;
            const used = usedCells.has(key);
            return (
              <motion.button
                key={key}
                style={{
                  ...s.cell,
                  ...(used ? s.cellUsed : {}),
                }}
                onClick={() => !used && handleCellClick(cat, pts)}
                whileHover={!used ? { scale: 1.05, boxShadow: '0 0 20px rgba(196,163,90,0.3)' } : {}}
                whileTap={!used ? { scale: 0.95 } : {}}
                disabled={used}
              >
                {used ? '' : `$${pts}`}
              </motion.button>
            );
          })
        )}
      </div>
      <p style={s.progressText}>
        {usedCells.size}/{totalCells} answered
        {allDone && (
          <motion.button
            style={s.finalBtn}
            onClick={() => { setPhase('final'); setWagerInput(''); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Go to Final Jeopardy!
          </motion.button>
        )}
      </p>
    </div>
  );
}

const s = {
  page: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '1.5rem 1rem',
    fontFamily: 'var(--sans)',
  },
  scoreBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  boardTitle: {
    fontSize: '1.8rem',
    fontWeight: 800,
    color: '#c4a35a',
    fontFamily: 'var(--heading)',
    margin: 0,
  },
  scoreDisplay: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: 'var(--text-h)',
    fontFamily: 'var(--mono)',
  },
  boardGrid: {
    display: 'grid',
    gridTemplateColumns: `repeat(6, 1fr)`,
    gap: '6px',
  },
  categoryHeader: {
    background: '#1a237e',
    color: '#fff',
    padding: '12px 8px',
    textAlign: 'center',
    fontWeight: 700,
    fontSize: '0.85rem',
    borderRadius: '8px 8px 0 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  cell: {
    background: '#1a237e',
    color: '#c4a35a',
    border: '2px solid #283593',
    borderRadius: 6,
    padding: '18px 8px',
    fontSize: '1.3rem',
    fontWeight: 800,
    fontFamily: 'var(--mono)',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s',
    minHeight: 60,
  },
  cellUsed: {
    background: '#0d1137',
    color: '#1e293b',
    cursor: 'default',
    border: '2px solid #1a1a3e',
  },
  progressText: {
    textAlign: 'center',
    color: 'var(--text)',
    marginTop: '1rem',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
  },

  // Start/End screens
  startScreen: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '70vh',
    padding: '2rem',
  },
  startCard: {
    textAlign: 'center',
    padding: '3rem 2rem',
    borderRadius: 20,
    background: '#1a237e',
    border: '3px solid #c4a35a',
    maxWidth: 500,
    width: '100%',
    boxShadow: '0 8px 40px rgba(26,35,126,0.4)',
  },
  startTitle: {
    fontSize: '2.5rem',
    fontWeight: 800,
    color: '#c4a35a',
    fontFamily: 'var(--heading)',
    margin: '0 0 0.5rem',
  },
  startSub: {
    color: '#94a3b8',
    fontSize: '1.1rem',
    margin: '0 0 1.5rem',
  },
  startInfo: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  startInfoItem: {
    padding: '6px 14px',
    borderRadius: 20,
    background: 'rgba(196,163,90,0.15)',
    color: '#c4a35a',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
  highScoreText: {
    color: '#22c55e',
    fontFamily: 'var(--mono)',
    fontWeight: 600,
    margin: '0 0 1rem',
  },
  startBtn: {
    padding: '14px 40px',
    borderRadius: 12,
    background: '#c4a35a',
    color: '#0d1137',
    fontSize: '1.1rem',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--sans)',
  },

  // Wager
  wagerCard: {
    textAlign: 'center',
    padding: '2.5rem 2rem',
    borderRadius: 20,
    background: '#1a237e',
    border: '3px solid #c4a35a',
    maxWidth: 450,
    width: '100%',
    boxShadow: '0 8px 40px rgba(26,35,126,0.4)',
  },
  dailyDoubleBadge: {
    display: 'inline-block',
    padding: '6px 18px',
    borderRadius: 20,
    background: '#c4a35a',
    color: '#0d1137',
    fontWeight: 800,
    fontSize: '0.9rem',
    marginBottom: '1rem',
    letterSpacing: '1px',
  },
  finalBadge: {
    display: 'inline-block',
    padding: '6px 18px',
    borderRadius: 20,
    background: 'linear-gradient(135deg, #c4a35a, #ffd700)',
    color: '#0d1137',
    fontWeight: 800,
    fontSize: '0.9rem',
    marginBottom: '1rem',
    letterSpacing: '1px',
  },
  wagerTitle: {
    color: '#e2e8f0',
    fontSize: '1.4rem',
    fontWeight: 700,
    margin: '0 0 0.5rem',
  },
  wagerSub: {
    color: '#94a3b8',
    fontSize: '1rem',
    margin: '0 0 1rem',
  },
  wagerLabel: {
    color: '#c4a35a',
    fontSize: '0.95rem',
    fontWeight: 600,
    margin: '0 0 0.5rem',
  },
  wagerInputField: {
    display: 'block',
    width: '100%',
    maxWidth: 200,
    margin: '0 auto 1rem',
    padding: '12px',
    borderRadius: 10,
    border: '2px solid #c4a35a',
    background: '#0d1137',
    color: '#c4a35a',
    fontSize: '1.3rem',
    fontWeight: 700,
    fontFamily: 'var(--mono)',
    textAlign: 'center',
    outline: 'none',
  },
  wagerBtn: {
    padding: '12px 32px',
    borderRadius: 10,
    background: '#c4a35a',
    color: '#0d1137',
    fontSize: '1rem',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--sans)',
  },

  // Clue screen
  clueScreen: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '70vh',
    padding: '2rem 1rem',
  },
  clueCard: {
    maxWidth: 650,
    width: '100%',
    padding: '2rem',
    borderRadius: 20,
    background: '#1a237e',
    border: '2px solid #283593',
    boxShadow: '0 8px 40px rgba(26,35,126,0.4)',
  },
  clueHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.5rem',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  clueCategory: {
    color: '#94a3b8',
    fontSize: '0.85rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  cluePoints: {
    color: '#c4a35a',
    fontSize: '1.2rem',
    fontWeight: 800,
    fontFamily: 'var(--mono)',
  },
  clueText: {
    color: '#fff',
    fontSize: '1.25rem',
    lineHeight: 1.6,
    fontWeight: 500,
    textAlign: 'center',
    margin: '0 0 2rem',
    padding: '1rem',
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  optionBtn: {
    padding: '14px 16px',
    borderRadius: 10,
    border: '2px solid #475569',
    background: '#0d1137',
    color: '#e2e8f0',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s',
    fontFamily: 'var(--sans)',
  },
  resultBanner: {
    textAlign: 'center',
    marginTop: '1.5rem',
    fontSize: '1.1rem',
    fontWeight: 700,
  },
  continueBtn: {
    display: 'block',
    margin: '1rem auto 0',
    padding: '10px 28px',
    borderRadius: 10,
    background: '#c4a35a',
    color: '#0d1137',
    fontSize: '0.95rem',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--sans)',
  },
  finalBtn: {
    padding: '8px 20px',
    borderRadius: 10,
    background: 'linear-gradient(135deg, #c4a35a, #ffd700)',
    color: '#0d1137',
    fontSize: '0.9rem',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--sans)',
  },
};

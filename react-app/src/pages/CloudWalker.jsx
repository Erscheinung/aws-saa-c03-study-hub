import { useState, useEffect, useRef, useCallback } from 'react';

const TILE = 32;
const COLS = 20;
const ROWS = 14;
const W = COLS * TILE;
const H = ROWS * TILE;

const COLORS = {
  sky: '#1a1a2e',
  ground: '#16213e',
  grass: '#0f3460',
  path: '#1e3a5f',
  building: '#2d4059',
  buildingTop: '#3d5a80',
  door: '#e94560',
  window: '#ffd369',
  player: '#06d6a0',
  playerOutline: '#04a87d',
  npc: '#ffd369',
  text: '#e0e0e0',
  textBg: 'rgba(13, 17, 35, 0.92)',
  accent: '#a855f7',
  cloud: 'rgba(255,255,255,0.08)',
};

const AWS_BUILDINGS = [
  {
    id: 'compute',
    name: 'Compute Center',
    x: 2, y: 5, w: 3, h: 4,
    color: '#f97316',
    facts: [
      'EC2 provides resizable compute capacity in the cloud.',
      'Lambda lets you run code without provisioning servers - max 15 min.',
      'Fargate runs containers without managing EC2 instances.',
      'Auto Scaling adjusts capacity based on conditions you define.',
      'Spot Instances can save up to 90% but may be interrupted.',
    ],
  },
  {
    id: 'storage',
    name: 'Storage Vault',
    x: 7, y: 3, w: 3, h: 5,
    color: '#3b82f6',
    facts: [
      'S3 provides 11 nines (99.999999999%) of durability.',
      'EBS volumes are AZ-locked. Use snapshots to move cross-AZ.',
      'EFS is a managed NFS that scales automatically to petabytes.',
      'S3 Glacier Deep Archive: cheapest storage, 12-48h retrieval.',
      'Use S3 Lifecycle rules to auto-transition between storage classes.',
    ],
  },
  {
    id: 'database',
    name: 'Database Tower',
    x: 12, y: 4, w: 3, h: 5,
    color: '#8b5cf6',
    facts: [
      'RDS Multi-AZ = synchronous standby for high availability.',
      'Aurora stores 6 copies of data across 3 AZs automatically.',
      'DynamoDB: single-digit ms latency at any scale. NoSQL.',
      'ElastiCache Redis: in-memory caching with sub-ms latency.',
      'Read Replicas scale reads. Multi-AZ provides failover.',
    ],
  },
  {
    id: 'security',
    name: 'Security Fortress',
    x: 16, y: 5, w: 3, h: 4,
    color: '#ef4444',
    facts: [
      'IAM: Users, Groups, Roles, Policies. Least privilege always.',
      'Security Groups are stateful. NACLs are stateless.',
      'KMS manages encryption keys. SSE-KMS provides audit trail.',
      'WAF protects against SQL injection and XSS attacks.',
      'Shield Advanced: $3,000/mo for DDoS protection + response team.',
    ],
  },
];

const NPC_POSITIONS = [
  { x: 6, y: 10, name: 'Cloud Guru', tip: 'Tip: Multi-AZ = High Availability. Multi-Region = Disaster Recovery. Know the difference!' },
  { x: 11, y: 10, name: 'Cost Sage', tip: 'Tip: Reserved Instances save up to 72%. Spot saves up to 90% but can be interrupted!' },
  { x: 15, y: 11, name: 'Net Wizard', tip: 'Tip: ALB = Layer 7 (HTTP). NLB = Layer 4 (TCP). Choose based on your protocol needs.' },
];

function drawPixelChar(ctx, x, y, color, outline) {
  const s = TILE * 0.7;
  const cx = x + TILE / 2;
  const cy = y + TILE - 2;

  // Body
  ctx.fillStyle = color;
  ctx.fillRect(cx - s / 4, cy - s, s / 2, s * 0.6);

  // Head
  ctx.beginPath();
  ctx.arc(cx, cy - s, s / 4, 0, Math.PI * 2);
  ctx.fill();

  // Outline
  ctx.strokeStyle = outline || '#333';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy - s, s / 4, 0, Math.PI * 2);
  ctx.stroke();

  // Legs
  ctx.fillRect(cx - s / 4, cy - s * 0.4, s / 5, s * 0.4);
  ctx.fillRect(cx + s / 20, cy - s * 0.4, s / 5, s * 0.4);
}

export default function CloudWalker() {
  const canvasRef = useRef(null);
  const [playerPos, setPlayerPos] = useState({ x: 10, y: 10 });
  const [activeDialog, setActiveDialog] = useState(null);
  const [factIndex, setFactIndex] = useState(0);
  const [discoveredBuildings, setDiscoveredBuildings] = useState(new Set());
  const [discoveredNpcs, setDiscoveredNpcs] = useState(new Set());
  const keysRef = useRef(new Set());

  // Check proximity to buildings and NPCs
  const checkInteractions = useCallback((px, py) => {
    for (const b of AWS_BUILDINGS) {
      if (px >= b.x - 1 && px <= b.x + b.w && py >= b.y - 1 && py <= b.y + b.h) {
        return { type: 'building', data: b };
      }
    }
    for (const n of NPC_POSITIONS) {
      if (Math.abs(px - n.x) <= 1 && Math.abs(py - n.y) <= 1) {
        return { type: 'npc', data: n };
      }
    }
    return null;
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const onDown = (e) => {
      keysRef.current.add(e.key);

      if (activeDialog) {
        if (e.key === 'Escape' || e.key === 'e' || e.key === 'E') {
          setActiveDialog(null);
          return;
        }
        if (e.key === ' ' || e.key === 'Enter') {
          if (activeDialog.type === 'building') {
            setFactIndex((i) => (i + 1) % activeDialog.data.facts.length);
          }
          return;
        }
        return;
      }

      let dx = 0, dy = 0;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') dy = -1;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') dy = 1;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') dx = -1;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') dx = 1;

      if (dx !== 0 || dy !== 0) {
        e.preventDefault();
        setPlayerPos((prev) => {
          const nx = Math.max(0, Math.min(COLS - 1, prev.x + dx));
          const ny = Math.max(0, Math.min(ROWS - 1, prev.y + dy));

          // Check collision with buildings
          for (const b of AWS_BUILDINGS) {
            if (nx >= b.x && nx < b.x + b.w && ny >= b.y + 1 && ny < b.y + b.h) {
              return prev; // blocked by building
            }
          }
          return { x: nx, y: ny };
        });
      }

      if (e.key === 'e' || e.key === 'E' || e.key === ' ') {
        setPlayerPos((prev) => {
          const interaction = checkInteractions(prev.x, prev.y);
          if (interaction) {
            setFactIndex(0);
            setActiveDialog(interaction);
            if (interaction.type === 'building') {
              setDiscoveredBuildings((s) => new Set([...s, interaction.data.id]));
            } else {
              setDiscoveredNpcs((s) => new Set([...s, interaction.data.name]));
            }
          }
          return prev;
        });
      }
    };

    const onUp = (e) => keysRef.current.delete(e.key);

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [activeDialog, checkInteractions]);

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Sky
    ctx.fillStyle = COLORS.sky;
    ctx.fillRect(0, 0, W, H);

    // Clouds
    ctx.fillStyle = COLORS.cloud;
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 137 + 50) % W);
      const cy = 20 + (i * 23) % 60;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 40 + i * 5, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ground
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, ROWS * TILE * 0.55, W, H);

    // Grid/grass
    ctx.fillStyle = COLORS.grass;
    for (let r = Math.floor(ROWS * 0.55); r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if ((r + c) % 3 === 0) {
          ctx.fillRect(c * TILE + 4, r * TILE + 4, TILE - 8, TILE - 8);
        }
      }
    }

    // Path
    ctx.fillStyle = COLORS.path;
    for (let c = 0; c < COLS; c++) {
      ctx.fillRect(c * TILE, 10 * TILE, TILE, TILE);
      ctx.fillRect(c * TILE, 11 * TILE, TILE, TILE);
    }

    // Buildings
    for (const b of AWS_BUILDINGS) {
      const bx = b.x * TILE;
      const by = b.y * TILE;
      const bw = b.w * TILE;
      const bh = b.h * TILE;

      // Building body
      ctx.fillStyle = COLORS.building;
      ctx.fillRect(bx, by, bw, bh);

      // Roof
      ctx.fillStyle = b.color;
      ctx.fillRect(bx - 2, by - 4, bw + 4, 8);

      // Windows
      ctx.fillStyle = COLORS.window;
      const windowRows = Math.floor((bh - TILE) / TILE);
      const windowCols = Math.floor(bw / TILE);
      for (let wr = 0; wr < windowRows; wr++) {
        for (let wc = 0; wc < windowCols; wc++) {
          if ((wr + wc) % 2 === 0) {
            ctx.fillRect(
              bx + wc * TILE + 8,
              by + 12 + wr * TILE,
              TILE - 16,
              TILE - 16
            );
          }
        }
      }

      // Door
      ctx.fillStyle = COLORS.door;
      const doorX = bx + bw / 2 - TILE / 4;
      ctx.fillRect(doorX, by + bh - TILE + 4, TILE / 2, TILE - 4);

      // Label
      ctx.fillStyle = b.color;
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(b.name, bx + bw / 2, by - 8);

      // Discovered indicator
      if (discoveredBuildings.has(b.id)) {
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(bx + bw - 6, by + 6, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('✓', bx + bw - 6, by + 9);
      }
    }

    // NPCs
    for (const npc of NPC_POSITIONS) {
      drawPixelChar(ctx, npc.x * TILE, npc.y * TILE, COLORS.npc, '#b8860b');
      ctx.fillStyle = '#ffd369';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(npc.name, npc.x * TILE + TILE / 2, npc.y * TILE - 6);

      if (discoveredNpcs.has(npc.name)) {
        ctx.fillStyle = '#22c55e';
        ctx.font = '10px monospace';
        ctx.fillText('✓', npc.x * TILE + TILE / 2 + 30, npc.y * TILE - 4);
      }
    }

    // Player
    drawPixelChar(
      ctx,
      playerPos.x * TILE,
      playerPos.y * TILE,
      COLORS.player,
      COLORS.playerOutline
    );

    // Interaction hint
    const nearby = checkInteractions(playerPos.x, playerPos.y);
    if (nearby && !activeDialog) {
      ctx.fillStyle = COLORS.textBg;
      const hintText = `Press E or Space to interact with ${nearby.type === 'building' ? nearby.data.name : nearby.data.name}`;
      const tw = ctx.measureText(hintText).width + 20;
      ctx.fillRect(W / 2 - tw / 2, H - 36, tw, 24);
      ctx.fillStyle = COLORS.accent;
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(hintText, W / 2, H - 20);
    }

    ctx.textAlign = 'start';
  }, [playerPos, activeDialog, discoveredBuildings, discoveredNpcs, checkInteractions]);

  const totalDiscoverable = AWS_BUILDINGS.length + NPC_POSITIONS.length;
  const totalDiscovered = discoveredBuildings.size + discoveredNpcs.size;

  return (
    <div style={st.page}>
      <h1 style={st.title}>Cloud Walker</h1>
      <p style={st.subtitle}>Explore the AWS Cloud Village and discover services!</p>

      <div style={st.controls}>
        <span style={st.badge}>
          Discovered: {totalDiscovered}/{totalDiscoverable}
        </span>
        <span style={st.hint}>WASD / Arrow keys to move | E / Space to interact</span>
      </div>

      <div style={st.canvasWrap}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          style={st.canvas}
          tabIndex={0}
        />

        {activeDialog && (
          <div style={st.dialogOverlay}>
            <div style={st.dialogBox}>
              <div style={st.dialogHeader}>
                <span style={{
                  ...st.dialogIcon,
                  background: activeDialog.type === 'building' ? activeDialog.data.color : COLORS.npc,
                }}>
                  {activeDialog.type === 'building' ? '🏢' : '💬'}
                </span>
                <h3 style={st.dialogTitle}>
                  {activeDialog.data.name}
                </h3>
                <button style={st.dialogClose} onClick={() => setActiveDialog(null)}>
                  ✕
                </button>
              </div>

              <div style={st.dialogBody}>
                {activeDialog.type === 'building' ? (
                  <>
                    <p style={st.dialogFact}>
                      {activeDialog.data.facts[factIndex]}
                    </p>
                    <div style={st.dialogNav}>
                      <span style={st.factCounter}>
                        {factIndex + 1} / {activeDialog.data.facts.length}
                      </span>
                      <button
                        style={st.dialogBtn}
                        onClick={() =>
                          setFactIndex((i) => (i + 1) % activeDialog.data.facts.length)
                        }
                      >
                        Next Fact →
                      </button>
                    </div>
                  </>
                ) : (
                  <p style={st.dialogFact}>{activeDialog.data.tip}</p>
                )}
              </div>

              <div style={st.dialogFooter}>
                Press <kbd style={st.kbd}>E</kbd> or <kbd style={st.kbd}>Esc</kbd> to close
              </div>
            </div>
          </div>
        )}
      </div>

      {totalDiscovered === totalDiscoverable && (
        <div style={st.completeMsg}>
          You discovered everything! You're ready for the SAA-C03 exam!
        </div>
      )}
    </div>
  );
}

const st = {
  page: {
    maxWidth: 700,
    margin: '0 auto',
    padding: '2rem 1rem',
    fontFamily: 'var(--sans)',
    color: 'var(--text)',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    color: 'var(--text-h)',
    margin: '0 0 0.25rem',
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: 'var(--text)',
    fontSize: '0.95rem',
    margin: '0 0 1rem',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  badge: {
    padding: '0.35rem 0.85rem',
    borderRadius: 20,
    background: 'rgba(168,85,247,0.15)',
    color: '#a855f7',
    fontSize: '0.85rem',
    fontWeight: 600,
    fontFamily: 'var(--mono)',
  },
  hint: {
    fontSize: '0.8rem',
    color: 'var(--text)',
    opacity: 0.6,
  },
  canvasWrap: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    border: '2px solid var(--border)',
    background: COLORS.sky,
  },
  canvas: {
    display: 'block',
    width: '100%',
    height: 'auto',
    imageRendering: 'pixelated',
  },
  dialogOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(2px)',
  },
  dialogBox: {
    width: '85%',
    maxWidth: 380,
    background: '#1a1a2e',
    border: '2px solid #a855f7',
    borderRadius: 16,
    overflow: 'hidden',
  },
  dialogHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.85rem 1rem',
    borderBottom: '1px solid rgba(168,85,247,0.3)',
  },
  dialogIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.1rem',
    flexShrink: 0,
  },
  dialogTitle: {
    flex: 1,
    fontSize: '1rem',
    fontWeight: 700,
    color: '#e0e0e0',
    margin: 0,
  },
  dialogClose: {
    background: 'none',
    border: 'none',
    color: '#888',
    fontSize: '1.1rem',
    cursor: 'pointer',
    padding: '4px 8px',
  },
  dialogBody: {
    padding: '1rem',
  },
  dialogFact: {
    fontSize: '0.9rem',
    lineHeight: 1.7,
    color: '#d0d0d0',
    margin: '0 0 1rem',
  },
  dialogNav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  factCounter: {
    fontSize: '0.8rem',
    color: '#888',
    fontFamily: 'var(--mono)',
  },
  dialogBtn: {
    padding: '0.5rem 1rem',
    borderRadius: 8,
    border: 'none',
    background: '#a855f7',
    color: '#fff',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
  dialogFooter: {
    padding: '0.5rem 1rem',
    borderTop: '1px solid rgba(168,85,247,0.2)',
    fontSize: '0.75rem',
    color: '#666',
    textAlign: 'center',
  },
  kbd: {
    display: 'inline-block',
    padding: '1px 6px',
    borderRadius: 4,
    background: '#333',
    border: '1px solid #555',
    fontSize: '0.75rem',
    fontFamily: 'var(--mono)',
    color: '#ccc',
  },
  completeMsg: {
    textAlign: 'center',
    marginTop: '1rem',
    padding: '1rem',
    borderRadius: 12,
    background: 'rgba(34,197,94,0.1)',
    border: '1px solid rgba(34,197,94,0.3)',
    color: '#22c55e',
    fontWeight: 600,
    fontSize: '1rem',
  },
};

import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import { SCENE_OBJECTS, WORLD_SIZE, SPAWN } from '../data/cloudWalker3DScene'
import { buildStructures, buildAuroraDome } from '../three/builders'
import { checkerTexture } from '../three/pixelTexture'

// ─────────────────────────────────────────────────────────────────────────────
// Cloud Walker 3D — retro-anime pixel memory palace.
//
// The scene is drawn into a low-resolution render target and upscaled with
// NearestFilter, giving every surface the chunky N64/PS1 pixel look. Geometry
// is flat-shaded low-poly. Each SCENE_OBJECTS entry is built by a dedicated
// builder in src/three/builders.js, so the whole list — S3 warehouse, Glacier
// ice cave, EC2 server rack, Lambda floating orbs, RDS sunken vault, Aurora
// ribbon dome, CloudFront edge beams, VPC walled city, IAM guarded gate,
// Route 53 signpost — lives as literal architecture you can walk up to.
//
// Controls: WASD/arrows to walk, mouse look, Space to jump, Shift to sprint,
// Click or E to read the service. Visited count persists in localStorage.
// ─────────────────────────────────────────────────────────────────────────────

const MOVE_SPEED = 9
const SPRINT_MULT = 1.8
const INTERACT_RADIUS = 10
const GRAVITY = 22
const JUMP_VELOCITY = 8
const PIXEL_SCALE = 3 // render target is this many times smaller than viewport

const VISITED_KEY = 'cloudWalker3DVisited'

export default function CloudWalker3D() {
  const mountRef = useRef(null)
  const [locked, setLocked] = useState(false)
  const [activeService, setActiveService] = useState(null)
  const [error, setError] = useState(null)
  const [visited, setVisited] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(VISITED_KEY) || '[]'))
    } catch {
      return new Set()
    }
  })
  const [fps, setFps] = useState(0)
  const [compass, setCompass] = useState({ angle: 0, name: '' })
  const [showTutorial, setShowTutorial] = useState(() => {
    return !localStorage.getItem('cloudWalker3DSeenTutorial')
  })

  const markVisited = useCallback((id) => {
    setVisited((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      try {
        localStorage.setItem(VISITED_KEY, JSON.stringify([...next]))
      } catch { /* storage blocked — progress lives for the session only */ }
      return next
    })
  }, [])

  // Mutable bridges from React state into the render loop — updating these
  // on state change avoids respawning the whole Three.js scene.
  const visitedRef = useRef(visited)
  useEffect(() => { visitedRef.current = visited }, [visited])
  const compassRef = useRef({ angle: 0, name: '' })

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // ── Scene, camera, renderer ────────────────────────────────────────────
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x1a1033)
    scene.fog = new THREE.Fog(0x1a1033, 50, 180)

    const camera = new THREE.PerspectiveCamera(
      70,
      mount.clientWidth / mount.clientHeight,
      0.1,
      500,
    )
    camera.position.set(SPAWN.x, SPAWN.y, SPAWN.z)

    const renderer = new THREE.WebGLRenderer({
      antialias: false, // antialiasing defeats the pixel look
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(1) // render target handles the downscale
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.domElement.style.imageRendering = 'pixelated'
    renderer.domElement.style.display = 'block'
    renderer.outputColorSpace = THREE.SRGBColorSpace
    mount.appendChild(renderer.domElement)

    // Low-res render target for the chunky pixel look. We draw the whole
    // scene into this small target, then blit it to the full-size canvas
    // via a NearestFilter'd orthographic fullscreen quad.
    const rtWidth = Math.max(160, Math.floor(mount.clientWidth / PIXEL_SCALE))
    const rtHeight = Math.max(90, Math.floor(mount.clientHeight / PIXEL_SCALE))
    const renderTarget = new THREE.WebGLRenderTarget(rtWidth, rtHeight, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      depthBuffer: true,
      stencilBuffer: false,
      colorSpace: THREE.SRGBColorSpace,
    })

    // Fullscreen quad that samples the render target
    const postScene = new THREE.Scene()
    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const postQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.MeshBasicMaterial({ map: renderTarget.texture, depthTest: false }),
    )
    postScene.add(postQuad)

    // ── Lights ──
    scene.add(new THREE.AmbientLight(0x9999cc, 0.75))
    const sun = new THREE.DirectionalLight(0xfff2d6, 0.9)
    sun.position.set(50, 90, 30)
    scene.add(sun)
    scene.add(new THREE.HemisphereLight(0xfca5a5, 0x312e81, 0.45))

    // ── Ground ──
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 1, 1),
      new THREE.MeshLambertMaterial({
        map: (() => {
          const t = checkerTexture('#1e293b', '#0f172a', 4)
          t.repeat.set(40, 40)
          return t
        })(),
      }),
    )
    ground.rotation.x = -Math.PI / 2
    scene.add(ground)

    // Starfield backdrop sprite — a huge dark sphere with pinprick stars
    // baked into a texture. Cheaper than a skybox on a lazy-loaded chunk.
    const starMat = new THREE.MeshBasicMaterial({ color: 0x0b0620, side: THREE.BackSide, fog: false })
    const starSphere = new THREE.Mesh(new THREE.SphereGeometry(220, 16, 8), starMat)
    scene.add(starSphere)
    // Sparse star particles
    const starGeo = new THREE.BufferGeometry()
    const starCount = 320
    const starPos = new Float32Array(starCount * 3)
    for (let i = 0; i < starCount; i++) {
      const r = 200
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(1 - Math.random() * 0.8)
      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      starPos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 30
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3))
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xfef3c7, size: 1.4, sizeAttenuation: false, fog: false }),
    )
    scene.add(stars)

    // ── Aurora dome ──
    const auroraDome = buildAuroraDome(scene, WORLD_SIZE / 2)

    // ── Build all service structures via dispatcher ──
    const interactables = buildStructures(scene, SCENE_OBJECTS)

    // ── Controls ──
    const controls = new PointerLockControls(camera, renderer.domElement)
    scene.add(controls.object)
    controls.addEventListener('lock', () => setLocked(true))
    controls.addEventListener('unlock', () => setLocked(false))

    const keys = { w: false, a: false, s: false, d: false, shift: false }
    let vy = 0
    let onGround = true

    const onKeyDown = (e) => {
      const k = e.key.toLowerCase()
      if (k === 'w' || k === 'arrowup') keys.w = true
      if (k === 's' || k === 'arrowdown') keys.s = true
      if (k === 'a' || k === 'arrowleft') keys.a = true
      if (k === 'd' || k === 'arrowright') keys.d = true
      if (k === 'shift') keys.shift = true
      if (k === ' ' && onGround) { vy = JUMP_VELOCITY; onGround = false }
      if (k === 'e') tryInteract()
      if (k === 'escape' && controls.isLocked) controls.unlock()
    }
    const onKeyUp = (e) => {
      const k = e.key.toLowerCase()
      if (k === 'w' || k === 'arrowup') keys.w = false
      if (k === 's' || k === 'arrowdown') keys.s = false
      if (k === 'a' || k === 'arrowleft') keys.a = false
      if (k === 'd' || k === 'arrowright') keys.d = false
      if (k === 'shift') keys.shift = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    const raycaster = new THREE.Raycaster()
    const screenCentre = new THREE.Vector2(0, 0)

    const tryInteract = () => {
      // Prefer the closest interactable within radius, even if there is
      // geometry in front (makes it forgiving — you don't need to aim
      // perfectly at the small core of Lambda).
      let closest = null
      let closestDist = Infinity
      for (const i of interactables) {
        const d = controls.object.position.distanceTo(i.center)
        if (d < closestDist) { closestDist = d; closest = i }
      }
      if (closest && closestDist <= INTERACT_RADIUS) {
        setActiveService(closest.service)
        markVisited(closest.service.id)
        if (controls.isLocked) controls.unlock()
        return
      }
      // Fallback: raycast hit-test for farther structures.
      raycaster.setFromCamera(screenCentre, camera)
      const hits = raycaster.intersectObjects(
        interactables.map((i) => i.main).filter(Boolean),
        true,
      )
      if (hits.length > 0) {
        const hit = hits[0].object
        const svc = interactables.find((i) => i.main === hit || i.main.children?.includes(hit))
        if (svc) {
          setActiveService(svc.service)
          markVisited(svc.service.id)
          if (controls.isLocked) controls.unlock()
        }
      }
    }

    const onClick = () => {
      if (!controls.isLocked) { controls.lock(); return }
      tryInteract()
    }
    renderer.domElement.addEventListener('click', onClick)

    // ── Resize ──
    const onResize = () => {
      if (!mount) return
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      renderTarget.setSize(
        Math.max(160, Math.floor(w / PIXEL_SCALE)),
        Math.max(90, Math.floor(h / PIXEL_SCALE)),
      )
    }
    window.addEventListener('resize', onResize)

    // ── Render loop ──
    const clock = new THREE.Clock()
    let raf = 0
    let frames = 0
    let fpsTimer = 0

    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.1)
      const t = clock.elapsedTime

      if (controls.isLocked) {
        const speed = MOVE_SPEED * (keys.shift ? SPRINT_MULT : 1) * dt
        const forward = new THREE.Vector3()
        camera.getWorldDirection(forward)
        forward.y = 0
        forward.normalize()
        const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize()

        if (keys.w) controls.object.position.addScaledVector(forward, speed)
        if (keys.s) controls.object.position.addScaledVector(forward, -speed)
        if (keys.d) controls.object.position.addScaledVector(right, speed)
        if (keys.a) controls.object.position.addScaledVector(right, -speed)

        // Gravity + jump
        vy -= GRAVITY * dt
        controls.object.position.y += vy * dt
        if (controls.object.position.y <= SPAWN.y) {
          controls.object.position.y = SPAWN.y
          vy = 0
          onGround = true
        }

        const half = WORLD_SIZE / 2 - 2
        controls.object.position.x = Math.max(-half, Math.min(half, controls.object.position.x))
        controls.object.position.z = Math.max(-half, Math.min(half, controls.object.position.z))
      }

      // Aurora ribbons + per-structure ticks
      auroraDome.tick?.(t)
      for (const i of interactables) {
        i.tick?.(t)
        const dist = controls.object.position.distanceTo(i.center)
        const near = dist < INTERACT_RADIUS * 1.4
        if (i.ring) {
          i.ring.material.opacity = near ? 0.7 + Math.sin(t * 4) * 0.25 : 0.35
        }
        if (i.label) {
          // Make label always face the camera (sprites already billboard, but
          // gently bob so the scene feels alive)
          i.label.position.y = 10 + Math.sin(t * 1.2 + i.center.x) * 0.2
        }
      }

      // Compass: find nearest unvisited service
      let nearestUnvisited = null
      let nearestDist = Infinity
      const playerPos = controls.object.position
      for (const i of interactables) {
        if (visitedRef.current.has(i.service.id)) continue
        const d = playerPos.distanceTo(i.center)
        if (d < nearestDist) { nearestDist = d; nearestUnvisited = i }
      }
      if (nearestUnvisited) {
        const dx = nearestUnvisited.center.x - playerPos.x
        const dz = nearestUnvisited.center.z - playerPos.z
        const targetAngle = Math.atan2(dx, -dz) // world angle
        const camForward = new THREE.Vector3()
        camera.getWorldDirection(camForward)
        const camAngle = Math.atan2(camForward.x, -camForward.z)
        let rel = (targetAngle - camAngle) * (180 / Math.PI)
        while (rel > 180) rel -= 360
        while (rel < -180) rel += 360
        compassRef.current = { angle: rel, name: nearestUnvisited.service.name.split(' — ')[0] }
      } else {
        compassRef.current = { angle: 0, name: '' }
      }

      // Render scene → low-res target → blit to canvas
      renderer.setRenderTarget(renderTarget)
      renderer.render(scene, camera)
      renderer.setRenderTarget(null)
      renderer.render(postScene, postCamera)

      // FPS + compass state flush (throttled to avoid React churn)
      frames++
      fpsTimer += dt
      if (fpsTimer >= 0.5) {
        setFps(Math.round(frames / fpsTimer))
        setCompass({ ...compassRef.current })
        frames = 0
        fpsTimer = 0
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      renderer.domElement.removeEventListener('click', onClick)
      controls.dispose()
      renderTarget.dispose()
      renderer.dispose()
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose())
          else obj.material.dispose()
        }
      })
      if (mount && renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onErr = (e) => setError(e?.error?.message || String(e?.message || e))
    window.addEventListener('error', onErr)
    return () => window.removeEventListener('error', onErr)
  }, [])

  const dismissTutorial = () => {
    localStorage.setItem('cloudWalker3DSeenTutorial', '1')
    setShowTutorial(false)
  }

  const totalStructures = SCENE_OBJECTS.filter((s) => s.kind !== 'auroraSky').length

  return (
    <div style={pageStyles.wrapper}>
      <div style={pageStyles.header}>
        <h1 style={pageStyles.title}>Cloud Walker — 3D Memory Palace</h1>
        <Link to="/games/cloud-walker" style={pageStyles.backLink}>← 2D Pixel World</Link>
      </div>
      <p style={pageStyles.subtitle}>
        Low-poly pixel memory palace: each AWS service is a literal
        environment. Walk up to one and click (or press <kbd>E</kbd>) to read
        it. Your visit progress persists across sessions.
      </p>

      <div ref={mountRef} style={pageStyles.canvasMount}>
        {/* Crosshair */}
        <div style={pageStyles.crosshair} />

        {/* Compass HUD */}
        {locked && compass.name && (
          <div style={pageStyles.compass}>
            <div style={pageStyles.compassLabel}>→ {compass.name}</div>
            <div style={pageStyles.compassDial}>
              <div
                style={{
                  ...pageStyles.compassArrow,
                  transform: `rotate(${compass.angle}deg)`,
                }}
              >
                ▲
              </div>
            </div>
          </div>
        )}

        {/* Visited badge */}
        <div style={pageStyles.badge}>
          VISITED {visited.size} / {totalStructures}
        </div>

        {/* FPS */}
        <div style={pageStyles.fps}>{fps} FPS</div>

        {!locked && !showTutorial && (
          <div style={pageStyles.lockOverlay}>
            <div style={pageStyles.lockCard}>
              <h2 style={{ margin: '0 0 8px', fontSize: 22 }}>Click to enter</h2>
              <p style={pageStyles.lockBody}>
                <strong>WASD / Arrows</strong> — move<br />
                <strong>Mouse</strong> — look<br />
                <strong>Space</strong> — jump<br />
                <strong>Shift</strong> — sprint<br />
                <strong>Click / E</strong> — interact<br />
                <strong>Esc</strong> — release mouse
              </p>
            </div>
          </div>
        )}

        {showTutorial && (
          <div style={pageStyles.lockOverlay}>
            <div style={{ ...pageStyles.lockCard, maxWidth: 420 }}>
              <h2 style={{ margin: '0 0 10px', fontSize: 24 }}>Welcome to the Palace</h2>
              <p style={pageStyles.lockBody}>
                Every AWS service here is an actual building or structure you
                can walk to. The bright ring on the ground means "you can
                click this". The compass in the corner points to the nearest
                service you haven&rsquo;t read yet.
              </p>
              <p style={{ ...pageStyles.lockBody, marginTop: 10 }}>
                Desktop-only — pointer lock needs a mouse.
              </p>
              <button onClick={dismissTutorial} style={pageStyles.primaryBtn}>
                Let me in
              </button>
            </div>
          </div>
        )}

        {error && (
          <div style={pageStyles.errorOverlay}>
            <strong>3D init error:</strong> {error}
          </div>
        )}
      </div>

      {activeService && (
        <aside style={pageStyles.sidebar}>
          <button
            onClick={() => setActiveService(null)}
            style={pageStyles.closeBtn}
            aria-label="Close info panel"
          >
            ×
          </button>
          <h2 style={{ margin: '0 0 6px', color: '#f8fafc' }}>{activeService.name}</h2>
          <span
            style={{
              ...pageStyles.tag,
              background: hexToRgba(activeService.color, 0.2),
              color: hexToCss(activeService.color),
              borderColor: hexToRgba(activeService.color, 0.5),
            }}
          >
            {activeService.kind}
          </span>
          <ul style={pageStyles.factsList}>
            {activeService.facts.map((f, i) => (
              <li key={i} style={pageStyles.factItem}>{f}</li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  )
}

function hexToCss(num) {
  return '#' + num.toString(16).padStart(6, '0')
}
function hexToRgba(num, alpha) {
  const r = (num >> 16) & 0xff
  const g = (num >> 8) & 0xff
  const b = num & 0xff
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

const pageStyles = {
  wrapper: {
    position: 'relative',
    width: '100%',
    maxWidth: 1200,
    margin: '0 auto',
    color: 'var(--text-h, #f1f5f9)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontFamily: 'var(--heading, sans-serif)',
    fontWeight: 800,
  },
  backLink: {
    color: 'var(--accent, #a855f7)',
    textDecoration: 'none',
    fontSize: 13,
    padding: '6px 12px',
    border: '1px solid var(--border, #334155)',
    borderRadius: 8,
    fontFamily: 'var(--mono, monospace)',
  },
  subtitle: {
    color: 'var(--text, #94a3b8)',
    fontSize: 13,
    margin: '4px 0 14px',
    lineHeight: 1.5,
  },
  canvasMount: {
    position: 'relative',
    width: '100%',
    height: 'min(70vh, 640px)',
    borderRadius: 16,
    overflow: 'hidden',
    border: '1px solid var(--border, #334155)',
    background: '#0b0620',
    boxShadow: '0 30px 80px rgba(2,6,23,0.5)',
    cursor: 'crosshair',
    imageRendering: 'pixelated',
  },
  crosshair: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 14,
    height: 14,
    marginLeft: -7,
    marginTop: -7,
    border: '2px solid rgba(250, 250, 250, 0.85)',
    borderRadius: '50%',
    pointerEvents: 'none',
    mixBlendMode: 'difference',
    zIndex: 5,
  },
  compass: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: '10px 14px',
    background: 'rgba(2,6,23,0.7)',
    border: '1px solid rgba(148,163,184,0.3)',
    borderRadius: 10,
    color: '#fde68a',
    fontFamily: 'var(--mono, monospace)',
    fontSize: 11,
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    zIndex: 6,
    pointerEvents: 'none',
  },
  compassLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  compassDial: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    border: '1px solid #fde68a',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassArrow: {
    fontSize: 14,
    color: '#fde68a',
    transformOrigin: 'center',
    transition: 'transform 0.25s linear',
  },
  badge: {
    position: 'absolute',
    top: 16,
    left: 16,
    padding: '6px 12px',
    background: 'rgba(2,6,23,0.7)',
    border: '1px solid rgba(148,163,184,0.3)',
    borderRadius: 8,
    color: '#cbd5e1',
    fontFamily: 'var(--mono, monospace)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
    zIndex: 6,
    pointerEvents: 'none',
  },
  fps: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    color: 'rgba(226,232,240,0.55)',
    fontFamily: 'var(--mono, monospace)',
    fontSize: 10,
    pointerEvents: 'none',
    zIndex: 6,
  },
  lockOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(2,6,23,0.78)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    zIndex: 10,
  },
  lockCard: {
    padding: '24px 28px',
    background: 'rgba(15, 23, 42, 0.94)',
    border: '1px solid #475569',
    borderRadius: 14,
    fontFamily: 'var(--sans, system-ui)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    maxWidth: 320,
  },
  lockBody: {
    margin: 0,
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 1.7,
  },
  primaryBtn: {
    marginTop: 16,
    padding: '10px 20px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    fontFamily: 'var(--sans, system-ui)',
    letterSpacing: 0.3,
  },
  errorOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    padding: '10px 14px',
    background: 'rgba(239, 68, 68, 0.18)',
    border: '1px solid #ef4444',
    borderRadius: 8,
    color: '#fecaca',
    fontSize: 13,
    fontFamily: 'var(--mono, monospace)',
    zIndex: 20,
  },
  sidebar: {
    position: 'fixed',
    top: 70,
    right: 16,
    width: 360,
    maxWidth: '90vw',
    maxHeight: 'calc(100vh - 100px)',
    overflowY: 'auto',
    padding: '20px 22px 24px',
    background: 'rgba(2,6,23,0.94)',
    border: '1px solid #475569',
    borderRadius: 14,
    boxShadow: '-12px 0 60px rgba(0,0,0,0.5)',
    zIndex: 200,
    fontFamily: 'var(--sans, system-ui)',
  },
  closeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 8,
    border: '1px solid #475569',
    background: '#1e293b',
    color: '#cbd5e1',
    cursor: 'pointer',
    fontSize: 18,
    lineHeight: 1,
  },
  tag: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 12,
    border: '1px solid',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'var(--mono, monospace)',
  },
  factsList: {
    margin: '14px 0 0',
    paddingLeft: 18,
    color: '#e2e8f0',
    fontSize: 13,
    lineHeight: 1.55,
  },
  factItem: {
    marginBottom: 6,
  },
}

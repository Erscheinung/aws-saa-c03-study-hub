import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import * as THREE from 'three'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js'
import { SCENE_OBJECTS, WORLD_SIZE, SPAWN } from '../data/cloudWalker3DScene'

// ─────────────────────────────────────────────────────────────────────────────
// Cloud Walker 3D — Phase 6 foundation chunk.
//
// This is a minimal walkable Three.js scene: pointer-lock controls, WASD
// movement, ground plane, ambient + directional lighting, and one placeholder
// structure per service from cloudWalker3DScene.js. Clicking a structure (or
// being inside its trigger radius and pressing E) opens a sidebar with that
// service's facts — same pattern as the MindMap detail panel.
//
// The bespoke per-service environments described in CLAUDE.md (S3 warehouse
// crates, Glacier ice cave, Aurora ceiling shader, etc.) are NOT yet built —
// every service uses a coloured placeholder block tagged with its name.
// Future chunks add the real geometry, baked lighting, and effects.
//
// See CLAUDE.md "Phase 6 — Cloud Walker 3D" for the sub-task checklist and
// resumption notes.
// ─────────────────────────────────────────────────────────────────────────────

const MOVE_SPEED = 8 // m/sec
const SPRINT_MULT = 1.8
const INTERACT_RADIUS = 6 // metres for the click hit-test glow

export default function CloudWalker3D() {
  const mountRef = useRef(null)
  const overlayRef = useRef(null)
  const [locked, setLocked] = useState(false)
  const [activeService, setActiveService] = useState(null) // SCENE_OBJECTS entry
  const [error, setError] = useState(null)

  // Hold mutable scene state in a ref so React re-renders never recreate it.
  const sceneRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // ── Scene / camera / renderer ──
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0b1228)
    scene.fog = new THREE.Fog(0x0b1228, 40, 180)

    const camera = new THREE.PerspectiveCamera(
      72,
      mount.clientWidth / mount.clientHeight,
      0.1,
      500,
    )
    camera.position.set(SPAWN.x, SPAWN.y, SPAWN.z)

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.shadowMap.enabled = false // perf — bake later
    mount.appendChild(renderer.domElement)

    // ── Lights ──
    const ambient = new THREE.AmbientLight(0x8888aa, 0.55)
    scene.add(ambient)
    const sun = new THREE.DirectionalLight(0xfff2d6, 0.8)
    sun.position.set(40, 80, 30)
    scene.add(sun)
    const fill = new THREE.HemisphereLight(0xa78bfa, 0x1a1a2e, 0.35)
    scene.add(fill)

    // ── Ground plane ──
    const groundGeo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, 1, 1)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.92,
      metalness: 0.05,
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    scene.add(ground)

    // Faint grid to make movement feel real
    const grid = new THREE.GridHelper(WORLD_SIZE, 40, 0x334155, 0x1f2937)
    grid.material.opacity = 0.4
    grid.material.transparent = true
    grid.position.y = 0.01
    scene.add(grid)

    // ── Placeholder structures for every service ──
    // Each service is represented by a labelled coloured block. Future chunks
    // replace these with bespoke geometry per the kind field.
    const interactables = [] // { mesh, service, center }
    SCENE_OBJECTS.forEach((svc) => {
      // Skip ceiling-only items (Aurora) for now — they don't have a footprint.
      if (svc.kind === 'auroraSky') return

      const w = 6
      const h = 5
      const d = 6
      const geo = new THREE.BoxGeometry(w, h, d)
      const mat = new THREE.MeshStandardMaterial({
        color: svc.color,
        roughness: 0.6,
        metalness: 0.2,
        emissive: svc.color,
        emissiveIntensity: 0.18,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(svc.position.x, h / 2, svc.position.z)
      mesh.userData.serviceId = svc.id
      scene.add(mesh)

      // Glow ring at the base so the player can tell things are interactable
      const ringGeo = new THREE.RingGeometry(w * 0.7, w * 0.8, 32)
      const ringMat = new THREE.MeshBasicMaterial({
        color: svc.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55,
      })
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.rotation.x = -Math.PI / 2
      ring.position.set(svc.position.x, 0.05, svc.position.z)
      scene.add(ring)

      interactables.push({
        mesh,
        ring,
        service: svc,
        center: new THREE.Vector3(svc.position.x, h / 2, svc.position.z),
      })
    })

    // Aurora ceiling: a gigantic translucent dome with vertex-coloured gradient.
    // Cheap stand-in for a real GLSL shader; replaced in a future chunk.
    const auroraSvc = SCENE_OBJECTS.find((s) => s.kind === 'auroraSky')
    if (auroraSvc) {
      const domeGeo = new THREE.SphereGeometry(WORLD_SIZE * 0.52, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2)
      const domeMat = new THREE.MeshBasicMaterial({
        color: 0x4c1d95,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.55,
      })
      const dome = new THREE.Mesh(domeGeo, domeMat)
      dome.position.y = 0
      scene.add(dome)
    }

    // ── Pointer-lock controls ──
    const controls = new PointerLockControls(camera, renderer.domElement)
    scene.add(controls.object)
    controls.addEventListener('lock', () => setLocked(true))
    controls.addEventListener('unlock', () => setLocked(false))

    // ── Movement state ──
    const keys = { w: false, a: false, s: false, d: false, shift: false }
    const onKeyDown = (e) => {
      const k = e.key.toLowerCase()
      if (k === 'w' || k === 'arrowup') keys.w = true
      if (k === 's' || k === 'arrowdown') keys.s = true
      if (k === 'a' || k === 'arrowleft') keys.a = true
      if (k === 'd' || k === 'arrowright') keys.d = true
      if (k === 'shift') keys.shift = true
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

    // ── Click-to-interact via raycaster from screen centre ──
    const raycaster = new THREE.Raycaster()
    const screenCentre = new THREE.Vector2(0, 0)
    const tryInteract = () => {
      raycaster.setFromCamera(screenCentre, camera)
      const meshes = interactables.map((i) => i.mesh)
      const hits = raycaster.intersectObjects(meshes, false)
      if (hits.length > 0 && hits[0].distance <= INTERACT_RADIUS * 2) {
        const svcId = hits[0].object.userData.serviceId
        const svc = SCENE_OBJECTS.find((s) => s.id === svcId)
        if (svc) {
          setActiveService(svc)
          if (controls.isLocked) controls.unlock()
        }
      }
    }
    const onClick = () => {
      if (!controls.isLocked) {
        // first click engages pointer lock
        controls.lock()
        return
      }
      tryInteract()
    }
    renderer.domElement.addEventListener('click', onClick)

    // ── Resize handling ──
    const onResize = () => {
      if (!mount) return
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', onResize)

    // ── Render loop ──
    const clock = new THREE.Clock()
    let raf = 0
    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.1)

      // WASD movement (relative to camera yaw)
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

        // Clamp inside world bounds
        const half = WORLD_SIZE / 2 - 2
        controls.object.position.x = Math.max(-half, Math.min(half, controls.object.position.x))
        controls.object.position.z = Math.max(-half, Math.min(half, controls.object.position.z))
        controls.object.position.y = SPAWN.y
      }

      // Pulse the interact rings
      const t = clock.elapsedTime
      for (const i of interactables) {
        const dist = controls.object.position.distanceTo(i.center)
        const near = dist < INTERACT_RADIUS * 2.5
        i.ring.material.opacity = near ? 0.65 + Math.sin(t * 4) * 0.25 : 0.35
        i.mesh.material.emissiveIntensity = near ? 0.45 : 0.18
      }

      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    sceneRef.current = { scene, renderer, controls }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      renderer.domElement.removeEventListener('click', onClick)
      controls.dispose()
      renderer.dispose()
      // Free GPU memory
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
  }, [])

  // Catch unexpected init errors so the page doesn't blank out silently.
  useEffect(() => {
    const onErr = (e) => setError(e?.error?.message || String(e?.message || e))
    window.addEventListener('error', onErr)
    return () => window.removeEventListener('error', onErr)
  }, [])

  return (
    <div style={pageStyles.wrapper}>
      <div style={pageStyles.header}>
        <h1 style={pageStyles.title}>Cloud Walker — 3D Memory Palace</h1>
        <Link to="/games/cloud-walker" style={pageStyles.backLink}>← 2D Pixel World</Link>
      </div>
      <p style={pageStyles.subtitle}>
        Foundation chunk: walk between coloured service blocks. Each service&rsquo;s
        bespoke environment (S3 warehouse, Glacier ice cave, Aurora ceiling
        shader, etc.) is queued for the next session — see <code>CLAUDE.md</code>.
      </p>

      <div ref={mountRef} style={pageStyles.canvasMount}>
        {!locked && (
          <div ref={overlayRef} style={pageStyles.lockOverlay}>
            <div style={pageStyles.lockCard}>
              <h2 style={{ margin: '0 0 8px', fontSize: 22 }}>Click to enter</h2>
              <p style={pageStyles.lockBody}>
                <strong>WASD / Arrows</strong> — move<br />
                <strong>Mouse</strong> — look around<br />
                <strong>Shift</strong> — sprint<br />
                <strong>Click</strong> — interact with structure<br />
                <strong>E</strong> — interact (alt)<br />
                <strong>Esc</strong> — release mouse
              </p>
              <p style={{ ...pageStyles.lockBody, opacity: 0.7, marginTop: 8 }}>
                Click anywhere on the canvas to engage pointer-lock.
              </p>
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
          <span style={{ ...pageStyles.tag, background: hexToRgba(activeService.color, 0.2), color: hexToCss(activeService.color), borderColor: hexToRgba(activeService.color, 0.5) }}>
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
    background: '#0b1228',
    boxShadow: '0 30px 80px rgba(2,6,23,0.5)',
    cursor: 'crosshair',
  },
  lockOverlay: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(2,6,23,0.7)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    pointerEvents: 'none',
    zIndex: 10,
  },
  lockCard: {
    pointerEvents: 'none',
    padding: '24px 28px',
    background: 'rgba(15, 23, 42, 0.92)',
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

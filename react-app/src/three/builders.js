import * as THREE from 'three'
import { checkerTexture, woodTexture, rackTexture, makeLabelSprite } from './pixelTexture'

// Each builder receives `{ svc, parent }` and must return the primary
// interaction mesh (the thing the raycaster hit-tests against) plus the
// per-frame `tick(time, playerPos)` hook for any animation. The common
// scaffold — base glow ring, floating label, translation to svc.position —
// is handled by `buildStructure` below so builders only describe the
// bespoke geometry.
//
// Aesthetic: flat-shaded low-poly with nearest-filtered pixel textures.
// The renderer draws into a low-res render target and upscales with
// NearestFilter, so every face gets the chunky "retro anime 3D" look.

const FLAT = { flatShading: true }

function addRing(group, color, inner, outer) {
  const geo = new THREE.RingGeometry(inner, outer, 24)
  const mat = new THREE.MeshBasicMaterial({
    color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.6,
  })
  const ring = new THREE.Mesh(geo, mat)
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.05
  group.add(ring)
  return ring
}

function addLabel(group, text, color, yOffset) {
  const sprite = makeLabelSprite(text, cssColor(color))
  sprite.position.y = yOffset
  group.add(sprite)
  return sprite
}

function cssColor(num) {
  return '#' + num.toString(16).padStart(6, '0')
}

// ─────────────────────────────────────────────────────────────────────────────
// S3 — warehouse with stacked storage-class crates
// ─────────────────────────────────────────────────────────────────────────────
function buildWarehouse(svc, group) {
  const wood = woodTexture('#c2410c', '#7c2d12')
  wood.repeat.set(3, 2)

  // Main shed — one big box with cutout for door
  const bodyGeo = new THREE.BoxGeometry(12, 7, 10)
  const bodyMat = new THREE.MeshLambertMaterial({ map: wood, ...FLAT })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 3.5
  group.add(body)

  // Roof — big pyramid
  const roofGeo = new THREE.ConeGeometry(9, 3.5, 4)
  const roofMat = new THREE.MeshLambertMaterial({ color: 0x7f1d1d, ...FLAT })
  const roof = new THREE.Mesh(roofGeo, roofMat)
  roof.position.y = 7 + 1.75
  roof.rotation.y = Math.PI / 4
  group.add(roof)

  // Sign above door
  group.add(makeLabelSprite('S3', '#fdba74'))
  group.children[group.children.length - 1].position.set(0, 6, 5.1)

  // Storage-class crates lined up in front
  const classes = ['STD', 'IA', 'GLA']
  classes.forEach((label, i) => {
    const size = 1.6
    const crate = new THREE.Mesh(
      new THREE.BoxGeometry(size, size, size),
      new THREE.MeshLambertMaterial({ map: woodTexture('#f59e0b', '#b45309'), ...FLAT }),
    )
    crate.position.set(-2.6 + i * 2.6, size / 2, 7)
    group.add(crate)
    const lbl = makeLabelSprite(label, '#fff7ed')
    lbl.position.set(crate.position.x, size + 0.6, crate.position.z)
    group.add(lbl)
  })

  return { main: body }
}

// ─────────────────────────────────────────────────────────────────────────────
// Glacier — jagged ice cave
// ─────────────────────────────────────────────────────────────────────────────
function buildIceCave(svc, group) {
  const iceMat = new THREE.MeshLambertMaterial({
    color: 0x7dd3fc,
    transparent: true,
    opacity: 0.72,
    ...FLAT,
  })
  const iceDark = new THREE.MeshLambertMaterial({ color: 0x1e3a8a, ...FLAT })

  // Hollow hemisphere shell (opens upward — the player walks inside)
  const domeGeo = new THREE.SphereGeometry(8, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2)
  domeGeo.scale(1, 0.7, 1)
  const dome = new THREE.Mesh(domeGeo, iceMat)
  dome.position.y = 0
  group.add(dome)

  // Inner darker rock floor so the opening reads as a cave mouth
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(7.5, 16),
    iceDark,
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = 0.02
  group.add(floor)

  // Icy spikes around the rim
  const spikeMat = new THREE.MeshLambertMaterial({ color: 0xbae6fd, ...FLAT })
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.8, 4), spikeMat)
    spike.position.set(Math.cos(a) * 7.2, 1.4, Math.sin(a) * 7.2)
    spike.rotation.y = a
    group.add(spike)
  }

  return { main: dome }
}

// ─────────────────────────────────────────────────────────────────────────────
// EC2 — server-rack room
// ─────────────────────────────────────────────────────────────────────────────
function buildServerRack(svc, group) {
  const rackMat = new THREE.MeshLambertMaterial({ map: rackTexture(), ...FLAT })
  const floorMat = new THREE.MeshLambertMaterial({
    map: checkerTexture('#111827', '#1f2937', 6),
    ...FLAT,
  })

  floorMat.map.repeat.set(4, 3)
  const slabGeo = new THREE.BoxGeometry(14, 0.2, 10)
  const slab = new THREE.Mesh(slabGeo, floorMat)
  slab.position.y = 0.1
  group.add(slab)

  // Three rows of two rack cabinets each
  const rackCount = { cols: 3, rows: 2 }
  const rackGeo = new THREE.BoxGeometry(1.6, 5.4, 1.2)
  const ledMat = new THREE.MeshBasicMaterial({ color: 0x22c55e })
  for (let r = 0; r < rackCount.rows; r++) {
    for (let c = 0; c < rackCount.cols; c++) {
      const rack = new THREE.Mesh(rackGeo, rackMat)
      rack.position.set(-4 + c * 4, 2.7, -2.5 + r * 5)
      group.add(rack)

      // LED strip of tiny boxes along the front
      for (let k = 0; k < 6; k++) {
        const led = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.08), ledMat)
        led.position.set(rack.position.x, 0.8 + k * 0.7, rack.position.z + 0.62)
        led.userData.blink = Math.random() * Math.PI * 2
        group.add(led)
      }
    }
  }

  // Ceiling strip light
  const lightStrip = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.2, 0.4),
    new THREE.MeshBasicMaterial({ color: 0xfde68a }),
  )
  lightStrip.position.set(0, 6, 0)
  group.add(lightStrip)

  return { main: slab }
}

// ─────────────────────────────────────────────────────────────────────────────
// Lambda — floating function orbs
// ─────────────────────────────────────────────────────────────────────────────
function buildFloatingNodes(svc, group) {
  const orbGeo = new THREE.IcosahedronGeometry(0.9, 0)
  const orbs = []
  for (let i = 0; i < 7; i++) {
    const mat = new THREE.MeshLambertMaterial({
      color: 0xfacc15,
      emissive: 0xfacc15,
      emissiveIntensity: 0.6,
      ...FLAT,
    })
    const orb = new THREE.Mesh(orbGeo, mat)
    const a = (i / 7) * Math.PI * 2
    orb.position.set(Math.cos(a) * 4, 2.5 + Math.sin(i * 1.3) * 1.5, Math.sin(a) * 4)
    orb.userData.base = orb.position.y
    orb.userData.phase = i
    orbs.push(orb)
    group.add(orb)
  }

  // Central lambda crystal so there is something to click
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(1.4, 0),
    new THREE.MeshLambertMaterial({
      color: 0xfde047,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.5,
      ...FLAT,
    }),
  )
  core.position.y = 2
  group.add(core)

  return {
    main: core,
    tick: (t) => {
      core.rotation.y = t * 0.8
      core.rotation.x = t * 0.4
      orbs.forEach((o) => {
        o.position.y = o.userData.base + Math.sin(t * 2 + o.userData.phase) * 0.45
        o.rotation.y = t * 1.2
      })
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RDS — circular sunken vault
// ─────────────────────────────────────────────────────────────────────────────
function buildUndergroundVault(svc, group) {
  const stoneMat = new THREE.MeshLambertMaterial({
    map: checkerTexture('#312e81', '#1e1b4b', 6),
    ...FLAT,
  })
  stoneMat.map.repeat.set(3, 1)

  // Ring wall — cylinder with hole-punched opening on one side
  const wallGeo = new THREE.CylinderGeometry(6, 6, 4, 20, 1, true, Math.PI * 0.2, Math.PI * 1.6)
  const wall = new THREE.Mesh(wallGeo, stoneMat)
  wall.position.y = 2
  group.add(wall)

  // Floor
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(6, 20),
    new THREE.MeshLambertMaterial({ color: 0x1e1b4b, ...FLAT }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = 0.03
  group.add(floor)

  // Three database "tanks" inside
  const tankMat = new THREE.MeshLambertMaterial({ color: 0xa78bfa, emissive: 0x6d28d9, emissiveIntensity: 0.25, ...FLAT })
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 2.4, 10), tankMat)
    tank.position.set(Math.cos(a) * 2.6, 1.2, Math.sin(a) * 2.6)
    group.add(tank)
  }

  return { main: wall }
}

// ─────────────────────────────────────────────────────────────────────────────
// Aurora — sky borealis dome (ceiling, fullscreen)
// ─────────────────────────────────────────────────────────────────────────────
// Aurora has no ground-level structure — the real dome lives on the scene
// root and is built via `buildAuroraDome` below. Kept in the dispatch map for
// completeness so adding a future ceiling-only `kind` follows the same shape.
function buildAuroraSky() {
  return { main: null }
}

export function buildAuroraDome(scene, worldRadius) {
  // Dome interior with vertex-gradient and moving ribbon strips.
  const domeGeo = new THREE.SphereGeometry(worldRadius * 0.9, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2)
  const colors = []
  const top = new THREE.Color(0x0b1228)
  const mid = new THREE.Color(0x4c1d95)
  const base = new THREE.Color(0x065f46)
  for (let i = 0; i < domeGeo.attributes.position.count; i++) {
    const y = domeGeo.attributes.position.getY(i)
    const f = Math.max(0, Math.min(1, y / (worldRadius * 0.9)))
    const c = new THREE.Color().lerpColors(base, mid, f).lerp(top, f * f)
    colors.push(c.r, c.g, c.b)
  }
  domeGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  const dome = new THREE.Mesh(
    domeGeo,
    new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide }),
  )
  scene.add(dome)

  // Aurora ribbons — translucent curved planes that drift
  const ribbons = []
  for (let i = 0; i < 4; i++) {
    const geo = new THREE.PlaneGeometry(worldRadius * 0.9, 18, 20, 1)
    // Warp the plane into an arc
    const pos = geo.attributes.position
    for (let v = 0; v < pos.count; v++) {
      const x = pos.getX(v)
      pos.setZ(v, Math.sin((x / (worldRadius * 0.5)) * Math.PI) * 10)
    }
    geo.computeVertexNormals()
    const mat = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? 0x22d3ee : 0xa78bfa,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    })
    const ribbon = new THREE.Mesh(geo, mat)
    ribbon.position.y = 40 + i * 4
    ribbon.rotation.y = (i / 4) * Math.PI
    ribbon.userData.speed = 0.05 + i * 0.02
    scene.add(ribbon)
    ribbons.push(ribbon)
  }

  return {
    tick: (t) => {
      ribbons.forEach((r, i) => {
        r.rotation.y = (i / 4) * Math.PI + t * r.userData.speed
        r.material.opacity = 0.28 + Math.sin(t * 0.6 + i) * 0.12
      })
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CloudFront — edge beams radiating outward
// ─────────────────────────────────────────────────────────────────────────────
function buildEdgeBeams(svc, group) {
  const coreMat = new THREE.MeshLambertMaterial({
    color: 0x06b6d4,
    emissive: 0x0891b2,
    emissiveIntensity: 0.7,
    ...FLAT,
  })
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(1.8, 0), coreMat)
  core.position.y = 3
  group.add(core)

  // Beams
  const beams = []
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const geo = new THREE.CylinderGeometry(0.1, 0.02, 8, 4)
    const mat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.5,
    })
    const beam = new THREE.Mesh(geo, mat)
    beam.position.set(Math.cos(a) * 4, 3, Math.sin(a) * 4)
    beam.lookAt(Math.cos(a) * 12, 3, Math.sin(a) * 12)
    beam.rotateX(Math.PI / 2)
    beams.push(beam)
    group.add(beam)
  }

  return {
    main: core,
    tick: (t) => {
      core.rotation.y = t * 0.6
      beams.forEach((b, i) => {
        b.material.opacity = 0.35 + Math.sin(t * 2 + i) * 0.25
      })
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VPC — walled city with a gate
// ─────────────────────────────────────────────────────────────────────────────
function buildWalledCity(svc, group) {
  const stoneMat = new THREE.MeshLambertMaterial({
    map: checkerTexture('#374151', '#1f2937', 6),
    ...FLAT,
  })
  stoneMat.map.repeat.set(4, 2)

  const wallH = 4
  const wallT = 0.6
  const size = 10

  // Four walls: north has a gate gap, so split it in two
  const longGeo = new THREE.BoxGeometry(size, wallH, wallT)
  const sideGeo = new THREE.BoxGeometry(wallT, wallH, size)

  const south = new THREE.Mesh(longGeo, stoneMat); south.position.set(0, wallH / 2, size / 2); group.add(south)
  const east = new THREE.Mesh(sideGeo, stoneMat); east.position.set(size / 2, wallH / 2, 0); group.add(east)
  const west = new THREE.Mesh(sideGeo, stoneMat); west.position.set(-size / 2, wallH / 2, 0); group.add(west)

  const gateSide = new THREE.BoxGeometry((size - 3) / 2, wallH, wallT)
  const northL = new THREE.Mesh(gateSide, stoneMat)
  northL.position.set(-(size / 2 - (size - 3) / 4), wallH / 2, -size / 2)
  group.add(northL)
  const northR = northL.clone()
  northR.position.x = -northL.position.x
  group.add(northR)

  // Buildings inside
  const bMat = new THREE.MeshLambertMaterial({ color: 0xe879f9, emissive: 0x86198f, emissiveIntensity: 0.2, ...FLAT })
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2
    const b = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), bMat)
    b.position.set(Math.cos(a) * 2.5, 1, Math.sin(a) * 2.5)
    group.add(b)
  }

  return { main: south }
}

// ─────────────────────────────────────────────────────────────────────────────
// IAM — guarded arch gate
// ─────────────────────────────────────────────────────────────────────────────
function buildGuardedGate(svc, group) {
  const stoneMat = new THREE.MeshLambertMaterial({ color: 0x991b1b, ...FLAT })
  const goldMat = new THREE.MeshLambertMaterial({
    color: 0xfcd34d,
    emissive: 0xfbbf24,
    emissiveIntensity: 0.5,
    ...FLAT,
  })

  // Two pillars
  const pillarGeo = new THREE.CylinderGeometry(0.8, 0.9, 5, 8)
  const left = new THREE.Mesh(pillarGeo, stoneMat)
  left.position.set(-2.5, 2.5, 0)
  group.add(left)
  const right = left.clone()
  right.position.x = 2.5
  group.add(right)

  // Arch (a flattened torus half)
  const archGeo = new THREE.TorusGeometry(2.5, 0.4, 6, 12, Math.PI)
  const arch = new THREE.Mesh(archGeo, stoneMat)
  arch.position.set(0, 5, 0)
  arch.rotation.z = Math.PI
  group.add(arch)

  // Floating key above arch
  const keyGroup = new THREE.Group()
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.14, 6, 16), goldMat)
  keyGroup.add(bow)
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.9, 0.18), goldMat)
  shaft.position.y = -0.7
  keyGroup.add(shaft)
  const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.18, 0.18), goldMat)
  tooth.position.set(0.22, -1.05, 0)
  keyGroup.add(tooth)
  keyGroup.position.set(0, 7.5, 0)
  group.add(keyGroup)

  return {
    main: arch,
    tick: (t) => {
      keyGroup.rotation.y = t * 0.8
      keyGroup.position.y = 7.5 + Math.sin(t * 1.5) * 0.25
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Route 53 — signpost junction
// ─────────────────────────────────────────────────────────────────────────────
function buildSignpost(svc, group) {
  const woodMat = new THREE.MeshLambertMaterial({ map: woodTexture('#a16207', '#713f12'), ...FLAT })
  woodMat.map.repeat.set(1, 4)

  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 6, 6), woodMat)
  post.position.y = 3
  group.add(post)

  const signMat = new THREE.MeshLambertMaterial({
    map: woodTexture('#fed7aa', '#c2410c'),
    ...FLAT,
  })
  const labels = ['US-EAST', 'EU-WEST', 'AP-S', 'SA-E', 'GEO', 'WTD']
  labels.forEach((txt, i) => {
    const a = (i / labels.length) * Math.PI * 2
    const sign = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.6, 0.1), signMat)
    sign.position.set(Math.cos(a) * 1, 4.5 - i * 0.6, Math.sin(a) * 1)
    sign.lookAt(Math.cos(a) * 10, sign.position.y, Math.sin(a) * 10)
    group.add(sign)
    const lbl = makeLabelSprite(txt, '#fed7aa')
    lbl.position.copy(sign.position)
    lbl.position.y += 0.05
    lbl.position.x += Math.cos(a) * 0.9
    lbl.position.z += Math.sin(a) * 0.9
    group.add(lbl)
  })

  return { main: post }
}

// ─────────────────────────────────────────────────────────────────────────────
// Dispatch
// ─────────────────────────────────────────────────────────────────────────────
const BUILDERS = {
  warehouse: buildWarehouse,
  iceCave: buildIceCave,
  serverRack: buildServerRack,
  floatingNodes: buildFloatingNodes,
  undergroundVault: buildUndergroundVault,
  auroraSky: buildAuroraSky,
  edgeBeams: buildEdgeBeams,
  walledCity: buildWalledCity,
  guardedGate: buildGuardedGate,
  signpost: buildSignpost,
}

// Build every SCENE_OBJECTS entry as a parented group. Returns an array of
// interactables { group, main, service, center, tick } that the page loop
// can hit-test and animate.
export function buildStructures(scene, sceneObjects) {
  const interactables = []

  for (const svc of sceneObjects) {
    if (svc.kind === 'auroraSky') continue // dome handled separately

    const group = new THREE.Group()
    group.position.set(svc.position.x, 0, svc.position.z)
    scene.add(group)

    const builder = BUILDERS[svc.kind]
    const result = builder ? builder(svc, group) : { main: defaultBlock(svc, group) }
    const main = result.main
    if (!main) continue

    // Shared base ring + floating name label
    const ring = addRing(group, svc.color, 5.2, 6)
    const label = addLabel(group, svc.name.split(' — ')[0], svc.color, 10)

    interactables.push({
      group,
      main,
      ring,
      label,
      service: svc,
      center: new THREE.Vector3(svc.position.x, 2, svc.position.z),
      tick: result.tick,
    })
  }

  return interactables
}

function defaultBlock(svc, group) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(5, 5, 5),
    new THREE.MeshLambertMaterial({ color: svc.color, ...FLAT }),
  )
  mesh.position.y = 2.5
  group.add(mesh)
  return mesh
}

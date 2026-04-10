import * as THREE from 'three'

// Generate a small pixel-art CanvasTexture from a drawing callback. All
// textures created here use NearestFilter so they stay crisp when the scene
// is upscaled from the low-resolution render target.
export function makePixelTexture(size, draw) {
  const cvs = document.createElement('canvas')
  cvs.width = size
  cvs.height = size
  const ctx = cvs.getContext('2d')
  ctx.imageSmoothingEnabled = false
  draw(ctx, size)
  const tex = new THREE.CanvasTexture(cvs)
  tex.magFilter = THREE.NearestFilter
  tex.minFilter = THREE.NearestFilter
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.generateMipmaps = false
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

// Generic checker pattern used for floors and walls.
export function checkerTexture(a, b, cells = 8) {
  return makePixelTexture(cells * 4, (ctx, size) => {
    const cell = size / cells
    for (let y = 0; y < cells; y++) {
      for (let x = 0; x < cells; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? a : b
        ctx.fillRect(x * cell, y * cell, cell, cell)
      }
    }
  })
}

// Plank / crate texture.
export function woodTexture(base = '#b45309', dark = '#78350f') {
  return makePixelTexture(16, (ctx, size) => {
    ctx.fillStyle = base
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = dark
    for (let y = 0; y < size; y += 4) ctx.fillRect(0, y, size, 1)
    for (let x = 0; x < size; x += 4) ctx.fillRect(x, 0, 1, size)
  })
}

// Cel-style banded metal for server racks.
export function rackTexture() {
  return makePixelTexture(16, (ctx, size) => {
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, size, size)
    ctx.fillStyle = '#0f172a'
    for (let y = 2; y < size; y += 3) ctx.fillRect(0, y, size, 1)
    ctx.fillStyle = '#22c55e'
    for (let y = 1; y < size; y += 6) {
      for (let x = 1; x < size; x += 4) ctx.fillRect(x, y, 1, 1)
    }
  })
}

// Render a short pixel-style text label onto a texture, return a Sprite.
export function makeLabelSprite(text, color = '#f8fafc', bg = 'rgba(2,6,23,0.82)') {
  const padding = 8
  const font = 'bold 40px "Courier New", monospace'
  // Measure
  const measure = document.createElement('canvas').getContext('2d')
  measure.font = font
  const textW = Math.ceil(measure.measureText(text).width)
  const w = textW + padding * 2
  const h = 56

  const cvs = document.createElement('canvas')
  cvs.width = w
  cvs.height = h
  const ctx = cvs.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, w, h)
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, w - 2, h - 2)
  ctx.fillStyle = color
  ctx.font = font
  ctx.textBaseline = 'middle'
  ctx.fillText(text, padding, h / 2)

  const tex = new THREE.CanvasTexture(cvs)
  tex.magFilter = THREE.NearestFilter
  tex.minFilter = THREE.NearestFilter
  tex.generateMipmaps = false
  tex.colorSpace = THREE.SRGBColorSpace

  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true })
  const sprite = new THREE.Sprite(mat)
  // Keep world size readable regardless of canvas pixel count
  const scale = 0.035
  sprite.scale.set(w * scale, h * scale, 1)
  return sprite
}

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An ADHD-optimized, visual learning platform for the AWS SAA-C03 exam. The repo contains two parallel implementations:

1. **Static HTML/CSS/JS** (`index.html`, `maps/`, `exercises/`) — no build step, served directly via `python3 -m http.server 8000`
2. **React app** (`react-app/`) — the active, modern implementation built with Vite + React 19

The React app is the primary codebase. The static files are legacy/reference.

## React App Development

All commands run from `react-app/`:

```bash
cd react-app
npm run dev       # Start dev server (Vite)
npm run build     # Production build → dist/
npm run preview   # Preview production build
npm run lint      # ESLint
npm run deploy    # Build + deploy to GitHub Pages (gh-pages -d dist)
```

No test framework is configured.

## Architecture

**Routing** (`src/App.jsx`): React Router v7 with lazy-loaded pages under a shared `Layout`. Routes:
- `/` → Home
- `/mindmap` → MindMap
- `/exercises/fill-blanks`, `/connection-game`, `/deduction`
- `/games/cloud-walker`, `/jeopardy`, `/service-sorter`
- `/cheatsheet`, `/chapters`

**State**: Zustand (`src/hooks/useTheme.js`) manages dark/light theme; stored in `data-theme` attribute on `<html>`. Pages manage their own local state.

**Data**: All study content lives as static JSON in `src/data/`:
- `services.json` — AWS service definitions
- `fillBlanks.json`, `connections.json`, `deduction.json` — exercise question banks
- `cheatsheet.json` — reference data

**Styling**: CSS custom properties via `data-theme` attribute (no Tailwind, no CSS-in-JS). Global variables defined in `src/index.css`; component styles use inline style objects or `App.css`.

**Animations**: Framer Motion is available for page transitions (`src/components/common/PageTransition.jsx`).

**Deployment**: GitHub Pages via `gh-pages`. The `homepage` in `package.json` sets the base URL.

## Shared modules

- **`src/data/serviceLogos.js`** — single source of truth mapping AWS service id (or display name) to an official SVG logo URL (gilbarbara/logos CDN). Add a new service by appending one line. `getLogoUrl(idOrName)` handles normalization; `getAbbreviation(name)` produces the text fallback.
- **`src/components/common/AwsLogo.jsx`** — renders a logo with a styled-abbreviation chip fallback when the network image fails. Used by Home (Service Catcher + Logo Quiz), MindMap orbital nodes, and ServiceSorter belt cards.

## Page-load race-condition fix (do not regress)

`Layout.jsx` keeps `Suspense` *inside* a single keyed `PageTransition`. The previous structure put `Suspense` at the top of `App.jsx`, which caused new pages to fail to render on first navigation (refresh fixed it) because lazy-chunk resolution and AnimatePresence exit animations deadlocked. If you change Layout/Suspense ordering, re-test by clicking each nav item from a cold load.

**AnimatePresence was removed from Layout.** `PageTransition` no longer defines an `exit` variant, so AnimatePresence was keeping the outgoing page mounted alongside the new one on every navigation — producing a "pages repeat" flicker. A plain keyed remount gives a clean fade-in with no overlap. Do not re-add AnimatePresence here unless you also re-add an `exit` variant *and* verify no ghost pages are visible on a cold load.

Also: `src/components/common/ScrollToTop.jsx` resets scroll on every route change. Without it, navigating from a long page to a short one made the new page look blank.

## Phase 6 — Cloud Walker 3D Memory Palace (in-progress, multi-session)

The user wants `pages/CloudWalker.jsx` (a 2D pixel game) extended into a Three.js first-person walk-through where each AWS service is a literal physical environment element. The 2D version is preserved unchanged; the 3D version lives at a sibling route.

### Architecture decisions made (do not re-litigate)

- **Library:** `three` is installed via npm (v0.183). Imports from `three` and `three/examples/jsm/controls/PointerLockControls.js`. Vite handles the bundling — the `CloudWalker3D` chunk is lazy-loaded so the main bundle stays small (~525 KB → 132 KB gzipped, only fetched when the user visits the route).
- **Route:** `/games/cloud-walker-3d` (separate from the 2D `/games/cloud-walker`). The 2D page has a button linking to the 3D version.
- **Scene data:** `src/data/cloudWalker3DScene.js` — single source of truth. Each service has `{ id, name, kind, position: {x,z}, color, facts }`. Adding a new service is one entry. The `kind` field dispatches to a custom builder function in `src/three/builders.js`.
- **Builders:** `src/three/builders.js` exports `buildStructures(scene, SCENE_OBJECTS)` which walks the scene data, creates a per-service `Group`, dispatches to a builder keyed by `kind`, and decorates each one with a shared base glow ring + floating sprite label. Adding a new `kind` = add one entry to `BUILDERS` and write a `build<Kind>(svc, group)` that returns `{ main, tick? }`.
- **Pixel look:** The whole scene is rendered into a low-resolution `WebGLRenderTarget` (viewport ÷ `PIXEL_SCALE`, with `NearestFilter`) and then drawn to the canvas via a fullscreen orthographic quad. That's what gives the chunky N64/PS1 retro-pixel aesthetic — don't enable antialiasing on the main renderer, don't raise the pixel ratio, and don't bypass the post quad. Textures are generated in `src/three/pixelTexture.js` using tiny canvases (checker, wood plank, metal rack, label sprites) and all use `NearestFilter` + `generateMipmaps = false`. New textures should follow the same pattern.
- **Controls:** `PointerLockControls` for mouse-look, WASD/arrow keys for movement, Space to jump, Shift to sprint, click or `E` to interact with the closest structure in radius (falls back to raycast), Esc to release the pointer.
- **HUD:** Crosshair, compass to nearest unvisited service, visited count badge (localStorage-backed via `cloudWalker3DVisited`), FPS counter, first-time tutorial overlay gated on `cloudWalker3DSeenTutorial`. These read from refs so the render loop never re-subscribes to React state.
- **Sidebar:** Shows on click; same visual pattern as MindMap's `DetailPanel`.

### Sub-task checklist

Use this on next session resume — items in order, each is a self-contained mini-chunk.

**✅ Chunk 1 — Foundation (DONE)**
- [x] `npm install three` (v0.183)
- [x] `src/data/cloudWalker3DScene.js` — service catalogue with positions, colours, kinds, facts
- [x] `src/pages/CloudWalker3D.jsx` — pointer-lock + WASD + ground plane + lighting + fog + per-service placeholder boxes + click-to-open sidebar + cleanup
- [x] Routed at `/games/cloud-walker-3d`; linked from the 2D page
- [x] Lazy-loaded so the three vendor chunk is only fetched on visit

**✅ Chunk 2 — Bespoke environments (DONE)**
All builders live in a single `src/three/builders.js` file (no per-kind sub-files — keeps the shared helpers and dispatch table co-located).
- [x] S3 warehouse — wooden box shed with pyramid roof + 3 labelled storage-class crates
- [x] Glacier ice cave — squashed hemisphere with blue spikes + dark floor circle
- [x] EC2 server rack room — checker-tiled slab with two rows of three metal racks, LED strips, ceiling lamp
- [x] Lambda floating nodes — central octahedron crystal surrounded by 7 bobbing icosahedron orbs
- [x] RDS underground vault — circular stone wall with gate gap + 3 purple database tanks
- [x] Aurora sky — `buildAuroraDome` adds a gradient vertex-coloured dome + four drifting translucent ribbons
- [x] CloudFront edge beams — central icosahedron with 8 pulsing emissive beams
- [x] VPC walled city — four-sided wall with northern gate gap + buildings inside
- [x] IAM guarded gate — stone arch + two pillars + floating gold key that rotates/bobs
- [x] Route 53 signpost — tall post with 6 directional sign boards + sprite labels

**✅ Chunk 3 — Polish & performance (DONE)**
- [x] All materials flat-shaded `MeshLambertMaterial`; rings and beams use `MeshBasicMaterial`
- [x] Shared materials and textures where possible (texture factories in `pixelTexture.js`)
- [x] Procedural starfield via `THREE.Points` + dark sphere backdrop
- [x] FPS counter HUD (throttled to 2 Hz state flushes)
- [x] Vertical exploration: Space-to-jump + gravity; player can hop inside RDS and look up at Aurora
- [x] Low-resolution render target + nearest-filter blit is the canonical "polish" pass — gives retro chunkiness without post-processing library overhead

**✅ Chunk 4 — UX / discovery (DONE)**
- [x] Compass HUD showing direction to nearest unvisited service
- [x] VISITED N / M badge persisted to `localStorage` (`cloudWalker3DVisited`)
- [x] First-time tutorial overlay gated on `cloudWalker3DSeenTutorial`
- [x] Tutorial explicitly notes desktop-only (Pointer Lock)

**🟡 Chunk 5 — Future ideas**
- [ ] Replace Aurora dome with a real GLSL `ShaderMaterial` for curtains of green/violet noise
- [ ] Instanced meshes for repeated elements (rack LEDs, forest ground clutter)
- [ ] Audio cues when entering interaction radius
- [ ] Mobile touch controls fallback (virtual joystick)
- [ ] More services: DynamoDB server farm, SNS/SQS postal office, CloudWatch observatory

### Resumption pointers

When a future session picks this up, read in order:
1. `src/data/cloudWalker3DScene.js` — what services are configured; append one entry to add a service
2. `src/three/builders.js` — per-kind builders and the `BUILDERS` dispatch map; add a new `build<Kind>(svc, group)` and register it
3. `src/three/pixelTexture.js` — shared pixel-texture factories (checker, wood, rack, label sprites)
4. `src/pages/CloudWalker3D.jsx` — the scene loop, render-target pixel post, HUD, and controls. Don't rewrite the foundation — extend the builder dispatch
5. This checklist — tick boxes as work proceeds; add new sub-tasks if the spec evolves

The user values: literal/memorable visual mappings, smooth 60 fps, chunky retro-pixel aesthetic, no rewriting working code. When extending, prefer flat-shaded low-poly geometry with nearest-filter pixel textures — do NOT introduce smooth PBR materials or bloom/HDR post effects; they fight the retro look.

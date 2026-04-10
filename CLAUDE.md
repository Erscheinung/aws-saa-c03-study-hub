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

`Layout.jsx` keeps `Suspense` *inside* a single keyed `PageTransition` wrapped by `AnimatePresence mode="wait" initial={false}`. The previous structure put `Suspense` at the top of `App.jsx`, which caused new pages to fail to render on first navigation (refresh fixed it) because lazy-chunk resolution and `mode="wait"` exit animations deadlocked. If you change Layout/Suspense ordering, re-test by clicking each nav item from a cold load.

Also: `src/components/common/ScrollToTop.jsx` resets scroll on every route change. Without it, navigating from a long page to a short one made the new page look blank.

## Phase 6 — Cloud Walker 3D Memory Palace (in-progress, multi-session)

The user wants `pages/CloudWalker.jsx` (a 2D pixel game) extended into a Three.js first-person walk-through where each AWS service is a literal physical environment element. The 2D version is preserved unchanged; the 3D version lives at a sibling route.

### Architecture decisions made (do not re-litigate)

- **Library:** `three` is installed via npm (v0.183). Imports from `three` and `three/examples/jsm/controls/PointerLockControls.js`. Vite handles the bundling — the `CloudWalker3D` chunk is lazy-loaded so the main bundle stays small (~525 KB → 134 KB gzipped, only fetched when the user visits the route).
- **Route:** `/games/cloud-walker-3d` (separate from the 2D `/games/cloud-walker`). The 2D page has a button linking to the 3D version.
- **Scene data:** `src/data/cloudWalker3DScene.js` — single source of truth. Each service has `{ id, name, kind, position: {x,z}, color, facts }`. Adding a new service is one entry. The `kind` field dispatches to a custom builder function (placeholders for now; bespoke geometry queued).
- **Controls:** `PointerLockControls` for mouse-look, WASD/arrow keys for movement, Shift to sprint, click or `E` to interact with the structure under the crosshair, Esc to release the pointer.
- **Sidebar:** Shows on click; same visual pattern as MindMap's `DetailPanel`.

### Sub-task checklist

Use this on next session resume — items in order, each is a self-contained mini-chunk.

**✅ Chunk 1 — Foundation (DONE this session)**
- [x] `npm install three` (v0.183)
- [x] `src/data/cloudWalker3DScene.js` — service catalogue with positions, colours, kinds, facts
- [x] `src/pages/CloudWalker3D.jsx` — pointer-lock + WASD + ground plane + grid + ambient/directional/hemisphere lighting + fog + per-service placeholder boxes with glow rings + click-to-open sidebar + lock overlay with controls cheat sheet + cleanup on unmount
- [x] Routed at `/games/cloud-walker-3d` in `App.jsx`
- [x] Linked from 2D `CloudWalker.jsx` via "Try the 3D Memory Palace (beta)" button
- [x] Build verified clean (525 KB chunk, lazy-loaded)

**🟡 Chunk 2 — Bespoke environments (NEXT)**
Extract a `src/three/builders/` folder with one builder per `kind`. Each builder takes `(svc, scene, THREE)` and adds the bespoke geometry. The placeholder block in `CloudWalker3D.jsx` `SCENE_OBJECTS.forEach` block dispatches via `BUILDERS[svc.kind]?.(svc, scene) ?? defaultBlock(svc, scene)`.
- [ ] `warehouse.js` — S3: orange box building, smaller crate boxes inside labelled by storage class (Standard, IA, Glacier). Use `TextGeometry` or sprites for labels.
- [ ] `iceCave.js` — Glacier: hollow icy hemisphere or jagged ice walls. Use `MeshPhysicalMaterial` with `transmission` + bluish tint.
- [ ] `serverRack.js` — EC2: tall thin rack boxes with emissive green dots (instanced) for blinking LEDs. Animate emissive intensity in tick.
- [ ] `floatingNodes.js` — Lambda: 5–8 small glowing spheres bobbing at varying heights. No floor under them. Use sin(t) for bob.
- [ ] `undergroundVault.js` — RDS: dig a circular pit (ring of dark walls) with cylinder geometries inside as "database containers". Camera should be able to descend (consider a ramp).
- [ ] `auroraSky.js` — Aurora: replace the placeholder dome with a real GLSL ShaderMaterial. Curtains of green/violet noise on the dome interior. Animate uniform `uTime`.
- [ ] `edgeBeams.js` — CloudFront: instanced thin glowing beams radiating outward from a central point on the horizon.
- [ ] `walledCity.js` — VPC: a square wall (4 box meshes) with a gate gap on one side; a few smaller boxes inside as resources.
- [ ] `guardedGate.js` — IAM: an arch with two pillar guards and a glowing key icon above.
- [ ] `signpost.js` — Route 53: a central post with 4–6 directional arrow signs at varying angles.

**🟡 Chunk 3 — Polish & performance**
- [ ] Bake lighting → use `MeshBasicMaterial` where possible; reserve `MeshStandardMaterial` for the few hero objects.
- [ ] Instanced meshes for repeated elements (rack LEDs, beam segments).
- [ ] Skybox texture or procedural starfield (currently just a flat dark background colour + dome).
- [ ] Audio cue when entering interaction radius (optional).
- [ ] FPS counter overlay in dev mode.
- [ ] Vertical exploration: allow looking down into the RDS vault and up at Aurora — currently the camera y is locked to `SPAWN.y`. Consider a small jump or descent ramp instead of free-fly so the player still has gravity.

**🟡 Chunk 4 — UX / discovery**
- [ ] Compass HUD showing direction to nearest unvisited service.
- [ ] "Visited X / 10" badge (persisted to localStorage like the other games).
- [ ] First-time tutorial overlay (only on first visit per browser).
- [ ] Mobile fallback message — Pointer Lock is desktop-only.

### Resumption pointers

When a future session picks this up, read in order:
1. `src/data/cloudWalker3DScene.js` — what services are configured
2. `src/pages/CloudWalker3D.jsx` — the foundation scene; look for `// Placeholder structures for every service` and replace with builder dispatch
3. This checklist — tick boxes as work proceeds; add new sub-tasks if the spec evolves

The user values: literal/memorable visual mappings, smooth 60 fps, no rewriting working code. Do NOT rewrite the foundation — extend the `SCENE_OBJECTS.forEach` block.

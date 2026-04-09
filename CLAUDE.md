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

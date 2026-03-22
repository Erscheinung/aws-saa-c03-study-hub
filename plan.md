# Fix & Enhancement Plan for AWS SAA-C03 Study Hub

## Critical Bugs Found

### 1. CSS Variable Mismatch (Breaks ALL component styling)
Components use variables like `--text`, `--bg`, `--border`, `--code-bg`, `--accent`, `--accent-bg`, `--accent-border`, `--sans`, `--heading`, `--mono`, `--shadow` — but `index.css` defines DIFFERENT names: `--text-primary`, `--bg-primary`, `--border-color`, `--bg-card`, `--font-primary`, `--font-mono`, etc.

**Fix**: Add CSS variable aliases in `index.css` to map component-expected names to actual values.

### 2. MindMap Data Mismatch (Breaks category labels)
`MindMap.jsx` references `cat.label` but `services.json` uses `cat.name`. Category filter buttons show nothing.

**Fix**: Update `services.json` to add `"label"` fields, OR update MindMap to use `cat.name`.

### 3. MindMap Hardcoded Dark Theme
MindMap uses hardcoded `#0f172a` backgrounds and dark colors, ignoring theme toggle.

**Fix**: Update MindMap to use CSS variables for theme awareness.

## Enhancements

### 4. Chapters: Add Exam Tips & Quick Study Heuristics
Each topic currently only has bullet points. Add:
- `examTip`: A focused exam tip per topic
- `heuristic`: A quick study heuristic/mnemonic per topic

### 5. From IDEAS.md: Implement AWS Jeopardy Game
Selected as most impactful and feasible: a Jeopardy-style quiz with 6 categories × 5 point values.

### 6. From IDEAS.md: Implement Service Sorter (Conveyor Belt Game)
A fast-paced sorting game where services must be dragged into correct category bins.

---

## Execution Order

- [x] 1. Fix CSS variable mismatch in `index.css`
- [x] 2. Fix MindMap `label` vs `name` data mismatch
- [x] 3. Add exam tips & heuristics to Chapters page
- [x] 4. Implement AWS Jeopardy game
- [x] 5. Implement Service Sorter game
- [x] 6. Add new routes and navbar entries for new games
- [x] 7. Test build, commit, push — BUILD SUCCESSFUL

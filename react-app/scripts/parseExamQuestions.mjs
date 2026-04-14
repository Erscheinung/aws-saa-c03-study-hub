// One-off parser: exam-simulation.md → practiceQuestions.json
// Run: node scripts/parseExamQuestions.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const srcPath = resolve(__dirname, '../../exam-simulation.md')
const outPath = resolve(__dirname, '../src/data/practiceQuestions.json')

const md = readFileSync(srcPath, 'utf8')
const lines = md.split('\n')

const questions = []
let current = null
let startIdx = null
// Find the first "### " question (skip table of contents)
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('### ') && !lines[i].includes('Back to Top')) {
    // Found first question; but many "### " appear in TOC only after a certain heading.
    // Use a heuristic: a real question is followed (within 5 lines) by a "- [ ]" or "- [x]" option.
    let hasOpt = false
    for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
      if (/^- \[[ x]\]/.test(lines[j])) { hasOpt = true; break }
    }
    if (hasOpt) { startIdx = i; break }
  }
}

for (let i = startIdx; i < lines.length; i++) {
  const line = lines[i]
  if (line.startsWith('### ') && !line.includes('Back to Top')) {
    if (current) questions.push(current)
    current = {
      q: line.slice(4).trim(),
      options: [],
      answers: [],
    }
  } else if (current && /^- \[[ x]\]/.test(line)) {
    const correct = line[3] === 'x'
    const text = line.replace(/^- \[[ x]\]\s*/, '').trim()
    const idx = current.options.length
    current.options.push(text)
    if (correct) current.answers.push(idx)
  }
}
if (current) questions.push(current)

// Assign ids
questions.forEach((q, i) => { q.id = i + 1 })

writeFileSync(outPath, JSON.stringify(questions))
console.log(`Wrote ${questions.length} questions to ${outPath}`)
console.log(`File size: ${(readFileSync(outPath).length / 1024).toFixed(1)} KB`)

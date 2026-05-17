// FIDLEG copy lint: walks every .tsx file under the backtest landing page and
// fails if a forbidden prescriptive phrase appears in a string literal or JSX
// text node. Allow-list via `// eslint-allow-fidleg: <reason>` comment placed
// on the literal's line or the line directly above.
//
// Run as part of `npm test`. Spec for the rules lives in
// docs/BACKTESTING_LANDING_PAGE.md Section D.

import { describe, it, expect } from 'vitest'
import { promises as fs } from 'node:fs'
import path from 'node:path'

const SCAN_ROOTS = [
  'app/how-it-works',
  'components/backtest',
]

// Each pattern is a regex tested against the full source text (case-insensitive).
// Keep the list tight — false positives erode the value of the check.
const FORBIDDEN: { pattern: RegExp; reason: string }[] = [
  { pattern: /\byou\s+would\s+(have\s+)?(earn|earned|made|gain|gained|outperform|outperformed)\b/i,
    reason: 'Implies personal investment outcome' },
  { pattern: /\b(buy|sell|rebalance|move\s+into|switch\s+to)\s+(now|today)\b/i,
    reason: 'Imperative trading instruction' },
  { pattern: /\byou\s+should\s+(buy|sell|invest|rebalance|allocate|hold)\b/i,
    reason: 'Imperative investment instruction' },
  { pattern: /\bwe\s+recommend\b/i,
    reason: 'Recommendation framing — use "the model computed" instead' },
  { pattern: /\brecommended\s+(allocation|portfolio|weighting|weights)\b/i,
    reason: 'Recommendation framing on portfolio output' },
  { pattern: /\bguaranteed?\s+returns?\b/i,
    reason: 'Performance guarantee claim' },
]

const ALLOW_MARKER = '// eslint-allow-fidleg'

async function walk(dir: string, out: string[] = []): Promise<string[]> {
  let entries: import('node:fs').Dirent[]
  try { entries = await fs.readdir(dir, { withFileTypes: true }) }
  catch { return out }
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) await walk(full, out)
    else if (e.isFile() && /\.(tsx?|jsx?)$/.test(e.name)) out.push(full)
  }
  return out
}

interface Hit { file: string; line: number; lineText: string; pattern: string; reason: string }

function findHits(src: string, file: string): Hit[] {
  const lines = src.split('\n')
  const hits: Hit[] = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.includes(ALLOW_MARKER)) continue
    const prev = i > 0 ? lines[i - 1] : ''
    if (prev.includes(ALLOW_MARKER)) continue
    for (const { pattern, reason } of FORBIDDEN) {
      if (pattern.test(line)) {
        hits.push({ file, line: i + 1, lineText: line.trim(), pattern: pattern.source, reason })
      }
    }
  }
  return hits
}

describe('FIDLEG copy lint', () => {
  it('no forbidden prescriptive phrasing in /how-it-works copy', async () => {
    const repoRoot = process.cwd()
    const allFiles: string[] = []
    for (const root of SCAN_ROOTS) {
      const abs = path.join(repoRoot, root)
      allFiles.push(...await walk(abs))
    }

    expect(allFiles.length, 'scan found zero files — paths likely wrong').toBeGreaterThan(0)

    const allHits: Hit[] = []
    for (const f of allFiles) {
      // Skip the lint test itself (it contains the forbidden patterns as data)
      if (f.endsWith('fidleg-lint.test.ts')) continue
      const src = await fs.readFile(f, 'utf8')
      allHits.push(...findHits(src, f))
    }

    if (allHits.length > 0) {
      const msg = allHits.map(h =>
        `  ${path.relative(process.cwd(), h.file)}:${h.line} — ${h.reason}\n    > ${h.lineText}`
      ).join('\n')
      throw new Error(`FIDLEG lint failed: ${allHits.length} forbidden phrase(s) found:\n${msg}`)
    }

    expect(allHits).toEqual([])
  })

  it('disclaimer carries the current ADVISOR_TERMS_VERSION', async () => {
    const disclaimer = await fs.readFile(
      path.join(process.cwd(), 'components', 'backtest', 'Disclaimer.tsx'), 'utf8')
    const page = await fs.readFile(
      path.join(process.cwd(), 'app', 'how-it-works', 'page.tsx'), 'utf8')

    // Disclaimer must accept the version as a prop, not hard-code it
    expect(disclaimer).toMatch(/termsVersion/)
    // Page must import ADVISOR_TERMS_VERSION and pass it to <Disclaimer>
    expect(page).toMatch(/ADVISOR_TERMS_VERSION/)
    expect(page).toMatch(/<Disclaimer\s+termsVersion=\{ADVISOR_TERMS_VERSION\}/)
  })
})

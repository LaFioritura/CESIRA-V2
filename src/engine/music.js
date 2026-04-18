// ─── CESIRA V3 — Music Generation Engine ─────────────────────────────────────
import {
  clamp, rnd, pick,
  GENRES, MODES, CHORD_PROGS, SECTIONS, GROOVE_MAPS, GROOVE_ACCENT_TABLES,
  NOTE_FREQ, NOTE_MIDI, CHROMA,
  MAX_STEPS, mkSteps, mkNotes,
} from './constants.js'

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function parseNoteName(n) {
  const m = String(n || '').match(/^([A-G](?:b|#)?)(-?\d+)$/)
  return m ? { name: m[1], oct: Number(m[2]) } : null
}

export function transposeNote(note, semitones) {
  const parsed = parseNoteName(note)
  if (!parsed) return note
  const idx = CHROMA.indexOf(parsed.name)
  if (idx === -1) return note
  const abs = parsed.oct * 12 + idx + semitones
  return `${CHROMA[((abs % 12) + 12) % 12]}${Math.floor(abs / 12)}`
}

function chordNotes(chord, pool) {
  const n = pool.length
  return [pool[chord.r % n], pool[chord.t % n], pool[chord.f % n]].filter(Boolean)
}

function voiceLead(cur, pool) {
  if (!pool.length) return cur
  const i = pool.indexOf(cur)
  if (i === -1) return pool[Math.floor(rnd() * pool.length)]
  const r = rnd()
  if (r < 0.5) return pool[Math.min(i + 1, pool.length - 1)]
  if (r < 0.78) return pool[Math.max(i - 1, 0)]
  return pool[clamp(i + (rnd() < 0.5 ? 2 : -2), 0, pool.length - 1)]
}

function velCurve(type, i, total, pw) {
  const t = i / total
  switch (type) {
    case 'rise':   return clamp(0.3 + t * 0.7 * pw, 0.2, 1)
    case 'fall':   return clamp(0.95 - t * 0.6, 0.15, 1)
    case 'accent': return i % 4 === 0 ? clamp(0.88 + pw * 0.12, 0.65, 1) : clamp(0.48 + pw * 0.28, 0.25, 0.82)
    case 'groove': return i % 8 === 0 ? 0.95 : i % 4 === 0 ? 0.76 : i % 2 === 0 ? 0.60 : 0.42 + rnd() * 0.18
    case 'flat':   return clamp(0.55 + pw * 0.2, 0.38, 0.82)
    default:       return clamp(0.45 + pw * 0.55, 0.28, 1)
  }
}

// ─── Melodic phrase builder ───────────────────────────────────────────────────
function buildMelodicLine(pool, chordProgression, steps, chaos, lenBias) {
  const line = mkNotes(pool[0])
  const lengths = Array(steps).fill(1)
  const chordLen = Math.max(1, Math.floor(steps / 4))
  const motifLen = 4
  const firstPool = chordNotes(chordProgression[0], pool)
  let lastNote = firstPool[0]

  const motif = []
  for (let m = 0; m < motifLen; m++) {
    const r = rnd()
    if (r < 0.15) { motif.push(null); continue }
    if (r < 0.35) { motif.push(lastNote); continue }
    const near = firstPool.reduce((best, n) =>
      Math.abs(pool.indexOf(n) - pool.indexOf(lastNote)) <
      Math.abs(pool.indexOf(best) - pool.indexOf(lastNote)) ? n : best
    , firstPool[0])
    lastNote = near
    motif.push(near)
  }

  for (let i = 0; i < steps; i++) {
    const ci = Math.floor(i / chordLen) % chordProgression.length
    const cn = chordNotes(chordProgression[ci], pool)
    const motifNote = motif[i % motifLen]

    if (motifNote === null) {
      line[i] = pool[0]
    } else if (rnd() < 0.72) {
      line[i] = cn.reduce((best, n) =>
        Math.abs(pool.indexOf(n) - pool.indexOf(motifNote)) <
        Math.abs(pool.indexOf(best) - pool.indexOf(motifNote)) ? n : best
      , cn[0])
    } else {
      line[i] = rnd() < chaos ? pick(pool) : voiceLead(line[Math.max(0, i - 1)], cn)
    }

    const r = rnd()
    if (r < 0.45) lengths[i] = lenBias
    else if (r < 0.65) lengths[i] = lenBias * 2
    else if (r < 0.82) lengths[i] = Math.max(0.5, lenBias * 0.5)
    else lengths[i] = lenBias * 3
    lengths[i] = Math.min(lengths[i], 8)
  }

  for (let i = steps; i < MAX_STEPS; i++) line[i] = line[i % Math.max(1, steps)]
  return { line, lengths }
}

// ─── Section builder — heart of the composition engine ───────────────────────
export function buildSection(genre, sectionName, modeName, progression, arpeMode, prevBass) {
  const sec = SECTIONS[sectionName] || SECTIONS.groove
  const gd = GENRES[genre]
  const grooveName = gd.density > 0.65 && gd.chaos > 0.4 ? 'bunker'
    : gd.chaos > 0.6 ? 'broken'
    : gd.density < 0.4 ? 'float'
    : 'steady'
  const groove = GROOVE_MAPS[grooveName]
  const mode = MODES[modeName] || MODES.minor
  const { b: bp, s: sp } = mode

  const laneLen = { kick:16, snare:16, hat:32, bass:32, synth:32 }
  if (genre === 'dnb')      { laneLen.hat = 48; laneLen.synth = 64 }
  if (genre === 'ambient')  { laneLen.kick = 32; laneLen.bass = 64; laneLen.synth = 64 }
  if (genre === 'acid')     { laneLen.bass = 16; laneLen.synth = 32 }
  if (genre === 'cinematic'){ laneLen.bass = 64; laneLen.synth = 64 }

  const { density, chaos } = gd
  const bassLb  = sec.lb * (sectionName === 'break' ? 2.5 : sectionName === 'drop' ? 0.8 : 1)
  const synthLb = sec.lb * (sectionName === 'break' ? 3   : 1.2)

  const { line: bassLine, lengths: bassLengths }   = buildMelodicLine(bp, progression, laneLen.bass,  chaos,      bassLb)
  const { line: synthLine, lengths: synthLengths } = buildMelodicLine(sp, progression, laneLen.synth, chaos * 0.7, synthLb)

  const p = { kick:mkSteps(), snare:mkSteps(), hat:mkSteps(), bass:mkSteps(), synth:mkSteps() }
  const bar = 16
  const phraseW = [1, 0.75, 0.92, 0.68]

  for (const lane of ['kick','snare','hat','bass','synth']) {
    const ll = laneLen[lane]
    const lmKey = lane === 'kick' ? 'kM' : lane === 'snare' ? 'sM' : lane === 'hat' ? 'hM' : lane === 'bass' ? 'bM' : 'syM'
    const lm = sec[lmKey] || 1
    const dm = density * lm
    const maxDensity = lane === 'bass' ? 0.55 : lane === 'synth' ? 0.45 : 1.0

    for (let i = 0; i < ll; i++) {
      const pos = i % bar, pb = Math.floor(i / 8) % 4
      const strong = pos === 0 || pos === 8
      const bb = pos === 4 || pos === 12
      const ob = pos % 2 === 1
      const pw = phraseW[pb]
      let hit = false

      if (lane === 'kick') {
        if      (gd.kick === 'every4'     && pos % 4 === 0)                          hit = true
        else if (gd.kick === 'syncopated' && (pos === 0 || pos === 10 || pos === 14)) hit = true
        else if (gd.kick === 'sparse'     && (pos === 0 || pos === 12))               hit = true
        else if (gd.kick === 'irregular')  hit = pos === 0 || (rnd() < dm * 0.3 * pw)
        else if (strong || rnd() < (groove.kB + dm * 0.18) * pw)                     hit = true
      } else if (lane === 'snare') {
        if (gd.hatPattern === 'breakbeat') hit = rnd() < (groove.sB + dm * 0.15) * (1 + pb * 0.2)
        else if (bb || rnd() < (groove.sB + dm * 0.08 + (bb ? 0.28 : 0)) * (1.05 - pw * 0.16)) hit = true
      } else if (lane === 'hat') {
        const hp = gd.hatPattern
        if      (hp === '16th')      hit = true
        else if (hp === 'offbeat')   hit = ob
        else if (hp === 'breakbeat') hit = rnd() < (groove.hB + dm * 0.22) * (0.8 + pw * 0.25)
        else if (hp === 'noise')     hit = rnd() < 0.55 + dm * 0.18
        else if (hp === 'sparse')    hit = rnd() < 0.2 + dm * 0.1
        else                         hit = rnd() < (groove.hB + dm * 0.18) * (0.82 + pw * 0.22)
        if (hit && rnd() < chaos * 0.3) p.hat[i].p = 0.45 + rnd() * 0.4
      } else if (lane === 'bass') {
        const phraseAnchor = pos === 0 || pos === 4 || pos === 8 || pos === 12
        hit = rnd() < Math.min(phraseAnchor ? 0.82 * lm : (groove.bB + dm * 0.12) * pw * 0.7, maxDensity)
      } else if (lane === 'synth') {
        const phraseOn = pos === 2 || pos === 6 || pos === 10 || pos === 14
        hit = (rnd() < Math.min(phraseOn ? 0.65 * lm : (groove.syB + dm * 0.08) * pw * 0.5, maxDensity) && !strong) || (pb === 3 && rnd() < 0.18 + chaos * 0.15)
      }

      if (hit) {
        p[lane][i].on  = true
        p[lane][i].p   = clamp(sec.pb + rnd() * (1 - sec.pb), sec.pb, 1)
        p[lane][i].v   = clamp(velCurve(sec.vel, i, ll, pw), 0.22, 1)
        p[lane][i].l   = lane === 'bass' ? bassLengths[i] || sec.lb : lane === 'synth' ? synthLengths[i] || sec.lb : 1
      }
    }
  }

  // Rhythmic anchors
  for (let i = 0; i < laneLen.kick; i += 16) p.kick[i].on = true
  if (gd.kick !== 'sparse' && sectionName !== 'break') {
    for (let i = 0; i < laneLen.snare; i += 16) {
      if (i + 4  < laneLen.snare) p.snare[i + 4].on  = true
      if (i + 12 < laneLen.snare) p.snare[i + 12].on = true
    }
  }

  // Legature ties
  for (const lane of ['bass','synth']) {
    const ll = laneLen[lane]
    for (let i = 0; i < ll; i++) {
      if (p[lane][i].on && p[lane][i].l > 1) {
        const holdEnd = Math.min(ll - 1, i + Math.floor(p[lane][i].l))
        for (let j = i + 1; j <= holdEnd; j++) {
          p[lane][j].tied = true
          p[lane][j].on   = false
        }
      }
    }
  }

  // Chaos mutations on drums only
  const mp = Math.floor(chaos * 5)
  for (let m = 0; m < mp; m++) {
    const ln  = pick(['kick','snare','hat'])
    const ll  = laneLen[ln]
    const pos = Math.floor(rnd() * ll)
    if      (ln === 'hat')   p.hat[pos].on = !p.hat[pos].on
    else if (ln === 'kick')  { if (pos % 4 !== 0) p.kick[pos].on  = rnd() < 0.35 + chaos * 0.18 }
    else                     { p.snare[pos].on = !p.snare[pos].on && pos % 4 !== 0 }
  }

  return { patterns: p, bassLine, synthLine, laneLen, lastBass: bassLine[laneLen.bass - 1] || bp[0] }
}

// ─── Groove accent ────────────────────────────────────────────────────────────
export function grooveAccent(profile, lane, step, amount) {
  const t = (GROOVE_ACCENT_TABLES[profile] || GROOVE_ACCENT_TABLES.steady)[lane] || GROOVE_ACCENT_TABLES.steady.kick
  return 1 + (t[step % 16] - 1) * clamp(amount, 0, 1)
}

// ─── Voice building ───────────────────────────────────────────────────────────
export function getVoiceNotes(baseNote, lane, modeName, polySynth, bassStack) {
  const mode = MODES[modeName] || MODES.minor
  const pool = lane === 'bass' ? mode.b : mode.s
  const idx  = pool.indexOf(baseNote)

  if (lane === 'bass') {
    if (!bassStack) return [baseNote]
    const fifth = idx > -1 ? pool[Math.min(idx + 4, pool.length - 1)] : transposeNote(baseNote, 7)
    return [...new Set([baseNote, fifth])]
  }
  if (!polySynth) return [baseNote]
  if (idx === -1)  return [...new Set([baseNote, transposeNote(baseNote, 4), transposeNote(baseNote, 7)])]
  return [...new Set([pool[idx], pool[Math.min(idx+2, pool.length-1)], pool[Math.min(idx+4, pool.length-1)]])]
}

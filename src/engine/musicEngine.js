export const STEPS = 16
export const LANES = ['kick', 'snare', 'hat', 'perc', 'bass', 'synth']

export const GENRE_PRESETS = {
  techno: {
    name: 'Techno Drive',
    bpm: 132,
    swing: 0.03,
    energy: 0.78,
    density: 0.72,
    mix: { kick: 0.96, snare: 0.55, hat: 0.68, perc: 0.34, bass: 0.7, synth: 0.62 },
  },
  house: {
    name: 'Midnight House',
    bpm: 124,
    swing: 0.08,
    energy: 0.66,
    density: 0.58,
    mix: { kick: 0.9, snare: 0.45, hat: 0.72, perc: 0.4, bass: 0.66, synth: 0.6 },
  },
  trap: {
    name: 'Noir Trap',
    bpm: 144,
    swing: 0.11,
    energy: 0.8,
    density: 0.6,
    mix: { kick: 0.92, snare: 0.74, hat: 0.82, perc: 0.28, bass: 0.88, synth: 0.42 },
  },
  ambient: {
    name: 'Glass Ambient',
    bpm: 96,
    swing: 0,
    energy: 0.38,
    density: 0.32,
    mix: { kick: 0.56, snare: 0.26, hat: 0.28, perc: 0.18, bass: 0.52, synth: 0.9 },
  },
  drill: {
    name: 'Cold Drill',
    bpm: 142,
    swing: 0.1,
    energy: 0.84,
    density: 0.64,
    mix: { kick: 0.92, snare: 0.78, hat: 0.86, perc: 0.32, bass: 0.9, synth: 0.34 },
  },
}

export const INSTRUMENT_PRESETS = {
  kick: [
    { id: 'round', label: 'Round Punch', body: 1, click: 0.35, decay: 0.25 },
    { id: 'hard', label: 'Hard Driver', body: 1.15, click: 0.5, decay: 0.2 },
    { id: 'sub', label: 'Sub Weight', body: 1.25, click: 0.18, decay: 0.38 },
    { id: 'tight', label: 'Tight Club', body: 0.95, click: 0.46, decay: 0.16 },
  ],
  snare: [
    { id: 'snap', label: 'Snap', noise: 0.85, tone: 180, decay: 0.16 },
    { id: 'dust', label: 'Dust', noise: 0.75, tone: 150, decay: 0.2 },
    { id: 'wide', label: 'Wide Plate', noise: 0.95, tone: 220, decay: 0.22 },
  ],
  hat: [
    { id: 'silver', label: 'Silver Tick', brightness: 1, decay: 0.05 },
    { id: 'air', label: 'Air Spray', brightness: 1.15, decay: 0.08 },
    { id: 'tight', label: 'Tight Dust', brightness: 0.88, decay: 0.035 },
  ],
  bass: [
    { id: 'mono', label: 'Mono Tube', detune: 0, glide: 0.015, wave: 'sawtooth' },
    { id: 'rubber', label: 'Rubber', detune: -8, glide: 0.03, wave: 'square' },
    { id: 'sub', label: 'Pure Sub', detune: 0, glide: 0.05, wave: 'sine' },
  ],
  synth: [
    { id: 'glass', label: 'Glass Pad', detune: 4, wave: 'triangle', release: 0.55 },
    { id: 'neon', label: 'Neon Lead', detune: 11, wave: 'sawtooth', release: 0.28 },
    { id: 'choir', label: 'Choir Air', detune: 7, wave: 'square', release: 0.62 },
  ],
}

export const NOTE_POOL = {
  ambient: ['C2', 'G2', 'D3', 'A3', 'C4', 'E4'],
  techno: ['C2', 'D#2', 'G2', 'A#2', 'C3', 'D#3'],
  house: ['F2', 'A2', 'C3', 'D3', 'F3', 'A3'],
  trap: ['C2', 'F2', 'G#2', 'A#2', 'C3', 'D#3'],
  drill: ['C2', 'D2', 'F2', 'G2', 'A#2', 'C3'],
}

const NOTE_FREQ = {
  'C2': 65.41, 'D2': 73.42, 'D#2': 77.78, 'F2': 87.31, 'G2': 98.0, 'G#2': 103.83, 'A2': 110.0,
  'A#2': 116.54, 'C3': 130.81, 'D3': 146.83, 'D#3': 155.56, 'F3': 174.61, 'A3': 220.0, 'C4': 261.63, 'E4': 329.63,
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function createEmptyPattern() {
  return LANES.reduce((acc, lane) => {
    acc[lane] = Array.from({ length: STEPS }, () => 0)
    return acc
  }, {})
}

function pick(array) {
  return array[Math.floor(Math.random() * array.length)]
}

export function generatePattern(genreKey = 'techno', options = {}) {
  const base = GENRE_PRESETS[genreKey] || GENRE_PRESETS.techno
  const density = options.density ?? base.density
  const pattern = createEmptyPattern()

  for (let i = 0; i < STEPS; i++) {
    const offbeat = i % 2 === 1
    const quarter = i % 4 === 0
    const backbeat = i === 4 || i === 12

    pattern.kick[i] = quarter ? 1 : Math.random() < density * (genreKey === 'house' ? 0.18 : 0.24) ? 1 : 0
    pattern.snare[i] = backbeat ? 1 : Math.random() < density * 0.08 ? 1 : 0
    pattern.hat[i] = offbeat ? 1 : Math.random() < density * 0.55 ? 1 : 0
    pattern.perc[i] = Math.random() < density * 0.26 ? 1 : 0

    const bassChance = quarter ? density * 0.75 : density * 0.22
    pattern.bass[i] = Math.random() < bassChance ? 1 : 0

    const synthChance = genreKey === 'ambient' ? density * 0.38 : density * 0.18
    pattern.synth[i] = Math.random() < synthChance ? 1 : 0
  }

  if (genreKey === 'trap' || genreKey === 'drill') {
    pattern.hat = pattern.hat.map((_, i) => (i % 2 === 1 || i % 4 === 3 ? 1 : Math.random() < density * 0.35 ? 1 : 0))
  }

  if (genreKey === 'ambient') {
    pattern.kick = pattern.kick.map((step, i) => (i % 8 === 0 ? step : 0))
    pattern.snare = pattern.snare.map(() => 0)
  }

  return pattern
}

export function mutatePattern(pattern, amount = 0.2) {
  const next = structuredClone(pattern)
  for (const lane of LANES) {
    for (let i = 0; i < STEPS; i++) {
      if (Math.random() < amount) {
        next[lane][i] = next[lane][i] ? 0 : 1
      }
    }
  }
  return next
}

export function generateNoteLane(genreKey = 'techno') {
  const pool = NOTE_POOL[genreKey] || NOTE_POOL.techno
  return Array.from({ length: STEPS }, (_, i) => (i % 4 === 0 || Math.random() > 0.7 ? pick(pool) : null))
}

export function deriveArc(energy) {
  if (energy < 0.42) return 'drift'
  if (energy < 0.6) return 'groove'
  if (energy < 0.76) return 'build'
  return 'peak'
}

export function createStateFromGenre(genreKey = 'techno') {
  const preset = GENRE_PRESETS[genreKey] || GENRE_PRESETS.techno
  return {
    genre: genreKey,
    bpm: preset.bpm,
    swing: preset.swing,
    energy: preset.energy,
    density: preset.density,
    mix: preset.mix,
    pattern: generatePattern(genreKey, preset),
    notes: generateNoteLane(genreKey),
    instrumentPresetIds: {
      kick: INSTRUMENT_PRESETS.kick[0].id,
      snare: INSTRUMENT_PRESETS.snare[0].id,
      hat: INSTRUMENT_PRESETS.hat[0].id,
      bass: INSTRUMENT_PRESETS.bass[0].id,
      synth: INSTRUMENT_PRESETS.synth[0].id,
    },
  }
}

export function resolveInstrumentPreset(lane, id) {
  const list = INSTRUMENT_PRESETS[lane] || []
  return list.find((item) => item.id === id) || list[0] || null
}

export function noteToFreq(note) {
  return NOTE_FREQ[note] ?? 110
}

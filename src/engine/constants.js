// ─── CESIRA V3 — Musical Constants ───────────────────────────────────────────

export const MAX_STEPS = 64
export const PAGE = 16
export const SCHED = 0.14
export const LOOK = 20
export const UNDO_LIMIT = 32

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v))
export const rnd = () => Math.random()
export const pick = a => a[Math.floor(rnd() * a.length)]

// ─── GENRE DNA ───────────────────────────────────────────────────────────────
export const GENRES = {
  techno:       { bpm:[128,140], kick:'every4',    swing:0.02, atmosphere:'dark industrial',    kickFreq:80,  kickEnd:30, kickDecay:0.22, noiseColor:'brown', modes:['phrygian','minor'],  density:0.72, chaos:0.35, bassMode:'fm',     synthMode:'lead',    fxProfile:{drive:0.3,space:0.4,tone:0.6},  hatPattern:'16th',      description:'Dark mechanical pulse' },
  house:        { bpm:[120,130], kick:'every4',    swing:0.06, atmosphere:'warm Chicago',       kickFreq:90,  kickEnd:40, kickDecay:0.20, noiseColor:'pink',  modes:['dorian','mixo'],     density:0.65, chaos:0.28, bassMode:'sub',    synthMode:'organ',   fxProfile:{drive:0.1,space:0.55,tone:0.8}, hatPattern:'offbeat',   description:'Warm soulful groove' },
  ambient:      { bpm:[70,90],   kick:'sparse',    swing:0.0,  atmosphere:'oceanic',            kickFreq:60,  kickEnd:25, kickDecay:0.35, noiseColor:'pink',  modes:['lydian','dorian'],   density:0.25, chaos:0.55, bassMode:'drone',  synthMode:'pad',     fxProfile:{drive:0.0,space:0.9,tone:0.7},  hatPattern:'sparse',    description:'Textural spatial sound' },
  dnb:          { bpm:[160,180], kick:'syncopated',swing:0.04, atmosphere:'jungle pressure',    kickFreq:95,  kickEnd:35, kickDecay:0.14, noiseColor:'white', modes:['minor','dorian'],    density:0.78, chaos:0.55, bassMode:'grit',   synthMode:'glass',   fxProfile:{drive:0.35,space:0.3,tone:0.5}, hatPattern:'breakbeat', description:'Fast broken jungle' },
  acid:         { bpm:[125,138], kick:'every4',    swing:0.05, atmosphere:'303 acid',           kickFreq:85,  kickEnd:32, kickDecay:0.18, noiseColor:'white', modes:['phrygian','chroma'], density:0.68, chaos:0.65, bassMode:'bit',    synthMode:'mist',    fxProfile:{drive:0.45,space:0.35,tone:0.4},hatPattern:'16th',      description:'Squelching resonant acid' },
  industrial:   { bpm:[130,150], kick:'every4',    swing:0.0,  atmosphere:'concrete noise',     kickFreq:70,  kickEnd:28, kickDecay:0.28, noiseColor:'brown', modes:['chroma','phrygian'], density:0.8,  chaos:0.75, bassMode:'fold',   synthMode:'air',     fxProfile:{drive:0.55,space:0.25,tone:0.35},hatPattern:'noise',    description:'Harsh mechanical noise' },
  experimental: { bpm:[80,160],  kick:'irregular', swing:0.08, atmosphere:'avant-garde',        kickFreq:100, kickEnd:45, kickDecay:0.25, noiseColor:'pink',  modes:['chroma','lydian'],   density:0.45, chaos:0.88, bassMode:'wet',    synthMode:'strings', fxProfile:{drive:0.2,space:0.7,tone:0.6},  hatPattern:'random',    description:'Unpredictable textural' },
  cinematic:    { bpm:[85,110],  kick:'sparse',    swing:0.03, atmosphere:'epic orchestral',    kickFreq:75,  kickEnd:30, kickDecay:0.32, noiseColor:'pink',  modes:['minor','lydian'],    density:0.38, chaos:0.35, bassMode:'drone',  synthMode:'strings', fxProfile:{drive:0.05,space:0.85,tone:0.85},hatPattern:'sparse',   description:'Dramatic cinematic score' },
}
export const GENRE_NAMES = Object.keys(GENRES)

// ─── MUSICAL THEORY ──────────────────────────────────────────────────────────
export const MODES = {
  minor:    { b:['C2','D2','Eb2','F2','G2','Ab2','Bb2','C3','D3','Eb3'],   s:['C4','D4','Eb4','F4','G4','Ab4','Bb4','C5','D5','Eb5'] },
  phrygian: { b:['C2','Db2','Eb2','F2','G2','Ab2','Bb2','C3','Db3','Eb3'], s:['C4','Db4','Eb4','F4','G4','Ab4','Bb4','C5','Db5','Eb5'] },
  dorian:   { b:['C2','D2','Eb2','F2','G2','A2','Bb2','C3','D3','Eb3'],    s:['C4','D4','Eb4','F4','G4','A4','Bb4','C5','D5','Eb5'] },
  chroma:   { b:['C2','Db2','D2','Eb2','E2','F2','G2','Ab2','A2','Bb2'],   s:['C4','Db4','D4','Eb4','E4','F4','G4','Ab4','A4','Bb4'] },
  mixo:     { b:['C2','D2','E2','F2','G2','A2','Bb2','C3','D3','E3'],      s:['C4','D4','E4','F4','G4','A4','Bb4','C5','D5','E5'] },
  lydian:   { b:['C2','D2','E2','F#2','G2','A2','B2','C3','D3','E3'],      s:['C4','D4','E4','F#4','G4','A4','B4','C5','D5','E5'] },
}

export const CHORD_PROGS = {
  minor:    [ [{r:0,t:2,f:4},{r:5,t:0,f:2},{r:3,t:5,f:0},{r:4,t:0,f:2}], [{r:0,t:2,f:4},{r:3,t:5,f:0},{r:4,t:0,f:2},{r:0,t:2,f:4}], [{r:0,t:2,f:4},{r:0,t:2,f:4},{r:3,t:5,f:0},{r:3,t:5,f:0}], [{r:0,t:2,f:4},{r:4,t:0,f:2},{r:3,t:5,f:0},{r:6,t:1,f:3}] ],
  phrygian: [ [{r:0,t:1,f:3},{r:1,t:3,f:5},{r:3,t:5,f:0},{r:1,t:3,f:5}], [{r:0,t:1,f:3},{r:0,t:1,f:3},{r:1,t:3,f:5},{r:1,t:3,f:5}] ],
  dorian:   [ [{r:0,t:2,f:4},{r:5,t:0,f:2},{r:3,t:5,f:0},{r:4,t:0,f:2}], [{r:0,t:2,f:4},{r:4,t:6,f:1},{r:3,t:5,f:0},{r:0,t:2,f:4}] ],
  mixo:     [ [{r:0,t:2,f:4},{r:6,t:1,f:3},{r:4,t:6,f:1},{r:0,t:2,f:4}], [{r:0,t:2,f:4},{r:0,t:2,f:4},{r:6,t:1,f:3},{r:6,t:1,f:3}] ],
  lydian:   [ [{r:0,t:2,f:4},{r:3,t:5,f:0},{r:4,t:6,f:1},{r:2,t:4,f:6}] ],
  chroma:   [ [{r:0,t:1,f:4},{r:3,t:6,f:1},{r:7,t:2,f:5},{r:4,t:9,f:2}], [{r:0,t:3,f:6},{r:1,t:4,f:7},{r:2,t:5,f:8},{r:0,t:3,f:6}] ],
}

export const SECTIONS = {
  intro:   { kM:0.3,  sM:0.2,  hM:0.4,  bM:0.5,  syM:0.6,  vel:'rise',   pb:0.45, lb:3,   bars:4 },
  build:   { kM:0.7,  sM:0.6,  hM:1.0,  bM:0.9,  syM:0.8,  vel:'rise',   pb:0.6,  lb:1.5, bars:4 },
  drop:    { kM:1.3,  sM:1.1,  hM:0.9,  bM:1.2,  syM:0.8,  vel:'accent', pb:0.85, lb:1,   bars:8 },
  groove:  { kM:1.0,  sM:1.0,  hM:1.0,  bM:1.0,  syM:0.9,  vel:'groove', pb:0.72, lb:1.2, bars:8 },
  break:   { kM:0.1,  sM:0.3,  hM:0.2,  bM:0.4,  syM:1.5,  vel:'flat',   pb:0.4,  lb:4,   bars:4 },
  tension: { kM:0.5,  sM:0.7,  hM:1.4,  bM:1.0,  syM:1.1,  vel:'accent', pb:0.55, lb:1.5, bars:4 },
  outro:   { kM:0.4,  sM:0.3,  hM:0.3,  bM:0.3,  syM:0.4,  vel:'fall',   pb:0.35, lb:2.5, bars:4 },
  fill:    { kM:1.6,  sM:1.5,  hM:0.6,  bM:0.7,  syM:0.4,  vel:'accent', pb:0.75, lb:0.5, bars:2 },
}

export const SONG_ARCS = [
  ['intro','build','drop','groove','break','build','drop','outro'],
  ['intro','groove','tension','drop','break','drop','outro'],
  ['build','drop','groove','fill','drop','break','outro'],
  ['intro','tension','build','drop','groove','drop','outro'],
  ['groove','groove','break','tension','drop','groove','outro'],
]

export const GROOVE_MAPS = {
  steady: { kB:0.22, sB:0.16, hB:0.58, bB:0.22, syB:0.12 },
  broken: { kB:0.28, sB:0.14, hB:0.46, bB:0.28, syB:0.18 },
  bunker: { kB:0.34, sB:0.10, hB:0.34, bB:0.24, syB:0.14 },
  float:  { kB:0.16, sB:0.12, hB:0.50, bB:0.18, syB:0.28 },
}

export const NOTE_FREQ = {
  C2:65.41,Db2:69.3,D2:73.42,Eb2:77.78,E2:82.41,F2:87.31,'F#2':92.5,G2:98,Ab2:103.83,A2:110,Bb2:116.54,B2:123.47,
  C3:130.81,Db3:138.59,D3:146.83,Eb3:155.56,E3:164.81,F3:174.61,G3:196,A3:220,Bb3:233.08,B3:246.94,
  C4:261.63,Db4:277.18,D4:293.66,Eb4:311.13,E4:329.63,F4:349.23,'F#4':370,G4:392,Ab4:415.3,A4:440,Bb4:466.16,B4:493.88,
  C5:523.25,Db5:554.37,D5:587.33,Eb5:622.25,F5:698.46,G5:783.99,A5:880,
}
export const NOTE_MIDI = {
  C2:36,D2:38,Eb2:39,E2:40,F2:41,'F#2':42,G2:43,Ab2:44,A2:45,Bb2:46,
  C3:48,D3:50,Eb3:51,G3:55,A3:57,
  C4:60,D4:62,Eb4:63,E4:64,F4:65,G4:67,Ab4:68,A4:69,Bb4:70,
  C5:72,D5:74,Eb5:75,G5:79,A5:81,
}

export const LANE_CLR  = { kick:'#ff4444', snare:'#ffaa00', hat:'#ffdd00', bass:'#00ccff', synth:'#cc88ff' }
export const GENRE_CLR = { techno:'#ff2244', house:'#ff8800', ambient:'#44ffcc', dnb:'#ff4400', acid:'#aaff00', industrial:'#aaaaaa', experimental:'#ff44ff', cinematic:'#4488ff' }
export const SECTION_COLORS = { drop:'#ff2244', break:'#4488ff', build:'#ffaa00', groove:'#00cc66', tension:'#ff6622', fill:'#cc00ff', intro:'#44ffcc', outro:'#aaaaaa' }

export const SOUND_PRESETS = {
  bass: {
    sub_floor:     { label:'SUB FLOOR',     bassMode:'sub',   bassFilter:0.38, bassSubAmt:0.92, drive:0.06, compress:0.24, tone:0.48 },
    acid_pressure: { label:'ACID PRESSURE', bassMode:'bit',   bassFilter:0.72, bassSubAmt:0.36, drive:0.42, compress:0.32, tone:0.42, fmIdx:0.86 },
    fm_metal:      { label:'FM METAL',      bassMode:'fm',    bassFilter:0.62, bassSubAmt:0.28, drive:0.26, compress:0.38, tone:0.44, fmIdx:1.08 },
    drift_drone:   { label:'DRIFT DRONE',   bassMode:'drone', bassFilter:0.56, bassSubAmt:0.62, drive:0.1,  compress:0.18, tone:0.66 },
    fold_grit:     { label:'FOLD GRIT',     bassMode:'fold',  bassFilter:0.68, bassSubAmt:0.34, drive:0.48, compress:0.4,  tone:0.36 },
    wet_orbit:     { label:'WET ORBIT',     bassMode:'wet',   bassFilter:0.48, bassSubAmt:0.5,  drive:0.22, compress:0.24, tone:0.7 },
    pulse_body:    { label:'PULSE BODY',    bassMode:'pulse', bassFilter:0.58, bassSubAmt:0.44, drive:0.18, compress:0.28, tone:0.56 },
    saw_motion:    { label:'SAW MOTION',    bassMode:'saw',   bassFilter:0.64, bassSubAmt:0.3,  drive:0.3,  compress:0.34, tone:0.52 },
  },
  synth: {
    velvet_pad:    { label:'VELVET PAD',    synthMode:'pad',     synthFilter:0.64, space:0.72, tone:0.68, drive:0.08, polySynth:true },
    neon_lead:     { label:'NEON LEAD',     synthMode:'lead',    synthFilter:0.72, space:0.28, tone:0.74, drive:0.22, polySynth:false },
    glass_bell:    { label:'GLASS BELL',    synthMode:'glass',   synthFilter:0.78, space:0.54, tone:0.82, drive:0.06, polySynth:true },
    air_organ:     { label:'AIR ORGAN',     synthMode:'organ',   synthFilter:0.52, space:0.34, tone:0.62, drive:0.12, polySynth:true, fmIdx:0.72 },
    string_machine:{ label:'STRING MACHINE',synthMode:'strings', synthFilter:0.68, space:0.66, tone:0.7,  drive:0.08, polySynth:true },
    choir_mist:    { label:'CHOIR MIST',    synthMode:'choir',   synthFilter:0.58, space:0.76, tone:0.66, drive:0.04, polySynth:true },
    star_noise:    { label:'STAR NOISE',    synthMode:'star',    synthFilter:0.8,  space:0.62, tone:0.86, drive:0.14, polySynth:true },
    cinematic_air: { label:'CINEMATIC AIR', synthMode:'air',     synthFilter:0.6,  space:0.84, tone:0.74, drive:0.02, polySynth:true, fmIdx:0.54 },
    mist_pluck:    { label:'MIST PLUCK',    synthMode:'mist',    synthFilter:0.44, space:0.46, tone:0.58, drive:0.12, polySynth:false },
    bell_shard:    { label:'BELL SHARD',    synthMode:'bell',    synthFilter:0.82, space:0.48, tone:0.8,  drive:0.04, polySynth:true },
  },
  drum: {
    tight_punch:    { label:'TIGHT PUNCH',    drumDecay:0.32, noiseMix:0.12, compress:0.18, drive:0.1 },
    warehouse:      { label:'WAREHOUSE',      drumDecay:0.48, noiseMix:0.22, compress:0.28, drive:0.18 },
    broken_air:     { label:'BROKEN AIR',     drumDecay:0.58, noiseMix:0.34, compress:0.24, drive:0.12, swing:0.06 },
    industrial_haze:{ label:'INDUSTRIAL HAZE',drumDecay:0.64, noiseMix:0.42, compress:0.34, drive:0.28 },
    dusty_tape:     { label:'DUSTY TAPE',     drumDecay:0.44, noiseMix:0.28, compress:0.22, drive:0.16, tone:0.58 },
    crisp_club:     { label:'CRISP CLUB',     drumDecay:0.26, noiseMix:0.1,  compress:0.26, drive:0.08, tone:0.68 },
  },
  performance: {
    club_night:     { label:'CLUB NIGHT',     genre:'techno',     grooveAmt:0.7,  swing:0.03, space:0.26, tone:0.56, drive:0.18, compress:0.28 },
    acid_run:       { label:'ACID RUN',       genre:'acid',       grooveAmt:0.76, swing:0.06, space:0.24, tone:0.42, drive:0.38, compress:0.3 },
    jungle_grid:    { label:'JUNGLE GRID',    genre:'dnb',        grooveAmt:0.74, swing:0.05, space:0.22, tone:0.52, drive:0.2,  compress:0.24 },
    ambient_bloom:  { label:'AMBIENT BLOOM',  genre:'ambient',    grooveAmt:0.42, swing:0.0,  space:0.88, tone:0.72, drive:0.02, compress:0.16 },
    cinematic_rise: { label:'CINEMATIC RISE', genre:'cinematic',  grooveAmt:0.5,  swing:0.02, space:0.82, tone:0.76, drive:0.04, compress:0.18 },
    industrial_drive:{ label:'INDUSTRIAL DRIVE',genre:'industrial',grooveAmt:0.78,swing:0.0,  space:0.18, tone:0.34, drive:0.48, compress:0.36 },
  },
}

// Groove accent tables
export const GROOVE_ACCENT_TABLES = {
  steady: { kick:[1.2,1,0.92,0.96,1,0.94,0.98,0.96,1.18,0.98,0.92,0.96,1.02,0.96,0.98,0.96], snare:[0.92,0.9,0.92,0.9,1.16,0.92,0.92,0.9,0.92,0.9,0.92,0.9,1.12,0.92,0.92,0.9], hat:[0.92,1.02,0.9,1.04,0.94,1.02,0.9,1.06,0.92,1.02,0.9,1.04,0.94,1.02,0.9,1.08], bass:[1.1,0.96,0.98,1.02,0.96,0.94,1,1.04,1.08,0.96,0.98,1.02,0.96,0.94,1,1.04], synth:[0.96,1,1.04,1,0.96,1,1.08,1,0.96,1,1.04,1,0.96,1,1.12,1] },
  broken: { kick:[1.22,0.88,1.04,0.84,0.96,1.06,0.9,1.02,1.14,0.86,1.08,0.82,0.94,1.04,0.9,1.06], snare:[0.88,0.94,0.9,1,1.12,0.9,0.96,0.9,0.88,1,0.9,0.96,1.1,0.88,1,0.92], hat:[0.84,1.08,0.9,1.14,0.86,1.02,0.92,1.12,0.84,1.08,0.9,1.14,0.86,1.02,0.92,1.16], bass:[1.06,0.94,1.1,0.88,1,0.94,1.08,0.9,1.04,0.94,1.1,0.88,1,0.94,1.08,0.92], synth:[0.92,1.04,1.12,0.9,0.94,1.08,1.14,0.88,0.92,1.04,1.1,0.9,0.94,1.08,1.16,0.86] },
  bunker: { kick:[1.28,0.92,0.94,0.9,1.02,0.92,0.94,0.9,1.24,0.92,0.94,0.9,1.04,0.92,0.94,0.9], snare:[0.9,0.9,0.92,0.9,1.08,0.9,0.92,0.9,0.9,0.9,0.92,0.9,1.06,0.9,0.92,0.9], hat:[0.88,0.98,0.9,1.02,0.88,0.98,0.9,1.04,0.88,0.98,0.9,1.02,0.88,0.98,0.9,1.06], bass:[1.16,0.94,0.96,1,1.04,0.94,0.96,1.02,1.14,0.94,0.96,1,1.06,0.94,0.96,1.04], synth:[0.9,0.98,1.02,0.96,0.9,0.98,1.06,0.96,0.9,0.98,1.02,0.96,0.9,0.98,1.1,0.96] },
  float:  { kick:[1.12,0.98,0.96,1,1.04,0.98,0.96,1,1.1,0.98,0.96,1,1.02,0.98,0.96,1], snare:[0.94,0.98,0.96,1,1.06,0.98,0.96,1,0.94,0.98,0.96,1,1.08,0.98,0.96,1], hat:[0.96,1.02,0.98,1.04,0.96,1.02,0.98,1.06,0.96,1.02,0.98,1.04,0.96,1.02,0.98,1.08], bass:[1.04,0.98,1,1.02,1.04,0.98,1,1.04,1.02,0.98,1,1.02,1.06,0.98,1,1.04], synth:[1,1.04,1.08,1.02,1,1.04,1.1,1.02,1,1.04,1.08,1.02,1,1.04,1.12,1.02] },
}

export const CHROMA = ['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B']

export const mkSteps = () => Array.from({ length: MAX_STEPS }, () => ({ on:false, p:1, v:1, l:1 }))
export const mkNotes = (d = 'C2') => Array.from({ length: MAX_STEPS }, () => d)

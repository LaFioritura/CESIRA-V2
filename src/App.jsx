import React,{useCallback,useEffect,useRef,useState}from'react';

// ─────────────────────────────────────────────────────────────────────────────
// CESIRA V2 — Autonomous Electronic Music Workstation
// Full-screen, self-composing, live-performable, export-ready
// ─────────────────────────────────────────────────────────────────────────────

const MAX_STEPS=64,PAGE=16,SCHED=0.14,LOOK=20,UNDO=32;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const rnd=()=>Math.random();
const pick=a=>a[Math.floor(rnd()*a.length)];
const lerp=(a,b,t)=>a+(b-a)*t;

// ─── GENRE DNA ────────────────────────────────────────────────────────────────
const GENRES={
  techno:{bpm:[128,140],kick:'every4',swing:0.02,atmosphere:'dark industrial',
    kickFreq:80,kickEnd:30,kickDecay:0.22,noiseColor:'brown',
    modes:['phrygian','minor'],density:0.72,chaos:0.35,
    bassMode:'fm',synthMode:'lead',fxProfile:{drive:0.3,space:0.4,tone:0.6},
    hatPattern:'16th',description:'Dark mechanical pulse'},
  house:{bpm:[120,130],kick:'every4',swing:0.06,atmosphere:'warm Chicago',
    kickFreq:90,kickEnd:40,kickDecay:0.20,noiseColor:'pink',
    modes:['dorian','mixo'],density:0.65,chaos:0.28,
    bassMode:'sub',synthMode:'organ',fxProfile:{drive:0.1,space:0.55,tone:0.8},
    hatPattern:'offbeat',description:'Warm soulful groove'},
  ambient:{bpm:[70,90],kick:'sparse',swing:0.0,atmosphere:'oceanic',
    kickFreq:60,kickEnd:25,kickDecay:0.35,noiseColor:'pink',
    modes:['lydian','dorian'],density:0.25,chaos:0.55,
    bassMode:'drone',synthMode:'pad',fxProfile:{drive:0.0,space:0.9,tone:0.7},
    hatPattern:'sparse',description:'Textural spatial sound'},
  dnb:{bpm:[160,180],kick:'syncopated',swing:0.04,atmosphere:'jungle pressure',
    kickFreq:95,kickEnd:35,kickDecay:0.14,noiseColor:'white',
    modes:['minor','dorian'],density:0.78,chaos:0.55,
    bassMode:'grit',synthMode:'glass',fxProfile:{drive:0.35,space:0.3,tone:0.5},
    hatPattern:'breakbeat',description:'Fast broken jungle'},
  acid:{bpm:[125,138],kick:'every4',swing:0.05,atmosphere:'303 acid',
    kickFreq:85,kickEnd:32,kickDecay:0.18,noiseColor:'white',
    modes:['phrygian','chroma'],density:0.68,chaos:0.65,
    bassMode:'bit',synthMode:'mist',fxProfile:{drive:0.45,space:0.35,tone:0.4},
    hatPattern:'16th',description:'Squelching resonant acid'},
  industrial:{bpm:[130,150],kick:'every4',swing:0.0,atmosphere:'concrete noise',
    kickFreq:70,kickEnd:28,kickDecay:0.28,noiseColor:'brown',
    modes:['chroma','phrygian'],density:0.8,chaos:0.75,
    bassMode:'fold',synthMode:'air',fxProfile:{drive:0.55,space:0.25,tone:0.35},
    hatPattern:'noise',description:'Harsh mechanical noise'},
  experimental:{bpm:[80,160],kick:'irregular',swing:0.08,atmosphere:'avant-garde',
    kickFreq:100,kickEnd:45,kickDecay:0.25,noiseColor:'pink',
    modes:['chroma','lydian'],density:0.45,chaos:0.88,
    bassMode:'wet',synthMode:'strings',fxProfile:{drive:0.2,space:0.7,tone:0.6},
    hatPattern:'random',description:'Unpredictable textural'},
  cinematic:{bpm:[85,110],kick:'sparse',swing:0.03,atmosphere:'epic orchestral',
    kickFreq:75,kickEnd:30,kickDecay:0.32,noiseColor:'pink',
    modes:['minor','lydian'],density:0.38,chaos:0.35,
    bassMode:'drone',synthMode:'strings',fxProfile:{drive:0.05,space:0.85,tone:0.85},
    hatPattern:'sparse',description:'Dramatic cinematic score'},
};
const GENRE_NAMES=Object.keys(GENRES);

// ─── MUSICAL THEORY ───────────────────────────────────────────────────────────
const MODES={
  minor:   {b:['C2','D2','Eb2','F2','G2','Ab2','Bb2','C3','D3','Eb3'],s:['C4','D4','Eb4','F4','G4','Ab4','Bb4','C5','D5','Eb5']},
  phrygian:{b:['C2','Db2','Eb2','F2','G2','Ab2','Bb2','C3','Db3','Eb3'],s:['C4','Db4','Eb4','F4','G4','Ab4','Bb4','C5','Db5','Eb5']},
  dorian:  {b:['C2','D2','Eb2','F2','G2','A2','Bb2','C3','D3','Eb3'],s:['C4','D4','Eb4','F4','G4','A4','Bb4','C5','D5','Eb5']},
  chroma:  {b:['C2','Db2','D2','Eb2','E2','F2','G2','Ab2','A2','Bb2'],s:['C4','Db4','D4','Eb4','E4','F4','G4','Ab4','A4','Bb4']},
  mixo:    {b:['C2','D2','E2','F2','G2','A2','Bb2','C3','D3','E3'],s:['C4','D4','E4','F4','G4','A4','Bb4','C5','D5','E5']},
  lydian:  {b:['C2','D2','E2','F#2','G2','A2','B2','C3','D3','E3'],s:['C4','D4','E4','F#4','G4','A4','B4','C5','D5','E5']},
};

const CHORD_PROGS={
  minor:[
    [{r:0,t:2,f:4},{r:5,t:0,f:2},{r:3,t:5,f:0},{r:4,t:0,f:2}],
    [{r:0,t:2,f:4},{r:3,t:5,f:0},{r:4,t:0,f:2},{r:0,t:2,f:4}],
    [{r:0,t:2,f:4},{r:0,t:2,f:4},{r:3,t:5,f:0},{r:3,t:5,f:0}],
    [{r:0,t:2,f:4},{r:4,t:0,f:2},{r:3,t:5,f:0},{r:6,t:1,f:3}],
  ],
  phrygian:[
    [{r:0,t:1,f:3},{r:1,t:3,f:5},{r:3,t:5,f:0},{r:1,t:3,f:5}],
    [{r:0,t:1,f:3},{r:0,t:1,f:3},{r:1,t:3,f:5},{r:1,t:3,f:5}],
  ],
  dorian:[
    [{r:0,t:2,f:4},{r:5,t:0,f:2},{r:3,t:5,f:0},{r:4,t:0,f:2}],
    [{r:0,t:2,f:4},{r:4,t:6,f:1},{r:3,t:5,f:0},{r:0,t:2,f:4}],
  ],
  mixo:[
    [{r:0,t:2,f:4},{r:6,t:1,f:3},{r:4,t:6,f:1},{r:0,t:2,f:4}],
    [{r:0,t:2,f:4},{r:0,t:2,f:4},{r:6,t:1,f:3},{r:6,t:1,f:3}],
  ],
  lydian:[
    [{r:0,t:2,f:4},{r:3,t:5,f:0},{r:4,t:6,f:1},{r:2,t:4,f:6}],
  ],
  chroma:[
    [{r:0,t:1,f:4},{r:3,t:6,f:1},{r:7,t:2,f:5},{r:4,t:9,f:2}],
    [{r:0,t:3,f:6},{r:1,t:4,f:7},{r:2,t:5,f:8},{r:0,t:3,f:6}],
  ],
};

// Song sections with musical character
const SECTIONS={
  intro:   {kM:0.3,sM:0.2,hM:0.4,bM:0.5,syM:0.6,vel:'rise',pb:0.45,lb:3,bars:4},
  build:   {kM:0.7,sM:0.6,hM:1.0,bM:0.9,syM:0.8,vel:'rise',pb:0.6,lb:1.5,bars:4},
  drop:    {kM:1.3,sM:1.1,hM:0.9,bM:1.2,syM:0.8,vel:'accent',pb:0.85,lb:1,bars:8},
  groove:  {kM:1.0,sM:1.0,hM:1.0,bM:1.0,syM:0.9,vel:'groove',pb:0.72,lb:1.2,bars:8},
  break:   {kM:0.1,sM:0.3,hM:0.2,bM:0.4,syM:1.5,vel:'flat',pb:0.4,lb:4,bars:4},
  tension: {kM:0.5,sM:0.7,hM:1.4,bM:1.0,syM:1.1,vel:'accent',pb:0.55,lb:1.5,bars:4},
  outro:   {kM:0.4,sM:0.3,hM:0.3,bM:0.3,syM:0.4,vel:'fall',pb:0.35,lb:2.5,bars:4},
  fill:    {kM:1.6,sM:1.5,hM:0.6,bM:0.7,syM:0.4,vel:'accent',pb:0.75,lb:0.5,bars:2},
};

// Song arc templates — sequences of sections that tell a story
const SONG_ARCS=[
  ['intro','build','drop','groove','break','build','drop','outro'],
  ['intro','groove','tension','drop','break','drop','outro'],
  ['build','drop','groove','fill','drop','break','outro'],
  ['intro','tension','build','drop','groove','drop','outro'],
  ['groove','groove','break','tension','drop','groove','outro'],
];

const GROOVE_MAPS={
  steady:{kB:0.22,sB:0.16,hB:0.58,bB:0.22,syB:0.12},
  broken:{kB:0.28,sB:0.14,hB:0.46,bB:0.28,syB:0.18},
  bunker:{kB:0.34,sB:0.10,hB:0.34,bB:0.24,syB:0.14},
  float: {kB:0.16,sB:0.12,hB:0.50,bB:0.18,syB:0.28},
};

const NOTE_FREQ={
  C2:65.41,Db2:69.3,D2:73.42,Eb2:77.78,E2:82.41,F2:87.31,'F#2':92.5,G2:98,Ab2:103.83,A2:110,Bb2:116.54,B2:123.47,
  C3:130.81,Db3:138.59,D3:146.83,Eb3:155.56,E3:164.81,F3:174.61,G3:196,A3:220,Bb3:233.08,B3:246.94,
  C4:261.63,Db4:277.18,D4:293.66,Eb4:311.13,E4:329.63,F4:349.23,'F#4':370,'G4':392,Ab4:415.3,A4:440,Bb4:466.16,B4:493.88,
  C5:523.25,Db5:554.37,D5:587.33,Eb5:622.25,F5:698.46,G5:783.99,A5:880,
};
const NOTE_MIDI={
  C2:36,D2:38,Eb2:39,E2:40,F2:41,'F#2':42,G2:43,Ab2:44,A2:45,Bb2:46,
  C3:48,D3:50,Eb3:51,G3:55,A3:57,
  C4:60,D4:62,Eb4:63,E4:64,F4:65,G4:67,Ab4:68,A4:69,Bb4:70,
  C5:72,D5:74,Eb5:75,G5:79,A5:81,
};
const CHROMA=['C','Db','D','Eb','E','F','F#','G','Ab','A','Bb','B'];
const parseNoteName=n=>{const m=String(n||'').match(/^([A-G](?:b|#)?)(-?\d+)$/);return m?{name:m[1],oct:Number(m[2])}:null;};
const transposeNote=(note,semitones)=>{
  const parsed=parseNoteName(note);
  if(!parsed)return note;
  const idx=CHROMA.indexOf(parsed.name);
  if(idx===-1)return note;
  const abs=parsed.oct*12+idx+semitones;
  const nextIdx=((abs%12)+12)%12;
  const nextOct=Math.floor(abs/12);
  return `${CHROMA[nextIdx]}${nextOct}`;
};

const mkSteps=()=>Array.from({length:MAX_STEPS},()=>({on:false,p:1,v:1,l:1}));
const mkNotes=(d='C2')=>Array.from({length:MAX_STEPS},()=>d);

// ─── MUSIC GENERATION ENGINE ──────────────────────────────────────────────────
function chordNotes(chord,pool){
  const n=pool.length;
  return[pool[chord.r%n],pool[chord.t%n],pool[chord.f%n]].filter(Boolean);
}

function voiceLead(cur,pool){
  if(!pool.length)return cur;
  const i=pool.indexOf(cur);if(i===-1)return pool[Math.floor(rnd()*pool.length)];
  const r=rnd();
  if(r<0.5)return pool[Math.min(i+1,pool.length-1)];
  if(r<0.78)return pool[Math.max(i-1,0)];
  return pool[clamp(i+(rnd()<0.5?2:-2),0,pool.length-1)];
}

function arp(notes,mode,step){
  if(!notes||!notes.length)return'C4';
  const n=notes.length;
  switch(mode){
    case'up':return notes[step%n];
    case'down':return notes[(n-1-step%n)];
    case'updown':{const p=Math.max(1,n*2-2);const s=step%p;return s<n?notes[s]:notes[p-s];}
    case'outside':{const s=step%n;return s%2===0?notes[Math.floor(s/2)]:notes[n-1-Math.floor(s/2)];}
    default:return notes[step%n];
  }
}

function velCurve(type,i,total,pw){
  const t=i/total;
  switch(type){
    case'rise':return clamp(0.3+t*0.7*pw,0.2,1);
    case'fall':return clamp(0.95-t*0.6,0.15,1);
    case'accent':return i%4===0?clamp(0.88+pw*0.12,0.65,1):clamp(0.48+pw*0.28,0.25,0.82);
    case'groove':return i%8===0?0.95:i%4===0?0.76:i%2===0?0.60:0.42+rnd()*0.18;
    case'flat':return clamp(0.55+pw*0.2,0.38,0.82);
    default:return clamp(0.45+pw*0.55,0.28,1);
  }
}

// ─── MELODIC PHRASE BUILDER ───────────────────────────────────────────────────
// Creates real melodic phrases: 4-bar motifs, repetitions, silences, legato
function buildMelodicLine(pool, chordProgression, steps, chaos, arpeMode, lenBias){
  const line = mkNotes(pool[0]);
  const lengths = Array(steps).fill(1); // per-step note length in steps
  const chordLen = Math.max(1, Math.floor(steps / 4));

  // 1. Build a 4-step motif from chord tones
  const motif = [];
  const motifLen = 4;
  const firstChord = chordProgression[0];
  const firstPool = chordNotes(firstChord, pool);
  let lastNote = firstPool[0];
  for(let m = 0; m < motifLen; m++){
    const r = rnd();
    if(r < 0.15) motif.push(null); // rest in motif
    else if(r < 0.35) motif.push(lastNote); // repeat
    else{
      // Voice lead to next chord tone
      const near = firstPool.reduce((best, n) => {
        return Math.abs(pool.indexOf(n) - pool.indexOf(lastNote)) < Math.abs(pool.indexOf(best) - pool.indexOf(lastNote)) ? n : best;
      }, firstPool[0]);
      lastNote = near;
      motif.push(near);
    }
  }

  // 2. Place motif across pattern with variations per chord section
  for(let i = 0; i < steps; i++){
    const ci = Math.floor(i / chordLen) % chordProgression.length;
    const chord = chordProgression[ci];
    const cn = chordNotes(chord, pool);
    const motifPos = i % motifLen;
    const motifNote = motif[motifPos];

    if(motifNote === null){
      line[i] = pool[0]; // placeholder — step will be off anyway
    } else {
      // Transpose motif note to current chord context, respecting voice leading
      if(rnd() < 0.72){
        // Stay close to the motif note within new chord context
        const transposed = cn.reduce((best, n) =>
          Math.abs(pool.indexOf(n) - pool.indexOf(motifNote)) < Math.abs(pool.indexOf(best) - pool.indexOf(motifNote)) ? n : best
        , cn[0]);
        line[i] = transposed;
      } else {
        // Occasional free note within scale (chaos-driven)
        line[i] = rnd() < chaos ? pick(pool) : voiceLead(line[Math.max(0, i-1)], cn);
      }
    }

    // Note lengths — longer in breaks/ambient, shorter in drops/fills
    const r = rnd();
    if(r < 0.45) lengths[i] = lenBias;
    else if(r < 0.65) lengths[i] = lenBias * 2; // hold across 2 steps
    else if(r < 0.82) lengths[i] = Math.max(0.5, lenBias * 0.5);
    else lengths[i] = lenBias * 3; // long sustain
    lengths[i] = Math.min(lengths[i], 8); // never exceed 8 steps
  }

  // Fill remainder
  for(let i = steps; i < MAX_STEPS; i++){
    line[i] = line[i % Math.max(1, steps)];
  }

  return { line, lengths };
}

function buildSection(genre, sectionName, modeName, progression, arpeMode, prevBass){
  const sec = SECTIONS[sectionName] || SECTIONS.groove;
  const gd = GENRES[genre];
  const grooveName = gd.density > 0.65 && gd.chaos > 0.4 ? 'bunker' : gd.chaos > 0.6 ? 'broken' : gd.density < 0.4 ? 'float' : 'steady';
  const groove = GROOVE_MAPS[grooveName];
  const mode = MODES[modeName] || MODES.minor;
  const bp = mode.b, sp = mode.s;
  const laneLen = {kick:16, snare:16, hat:32, bass:32, synth:32};
  if(genre === 'dnb'){laneLen.hat = 48; laneLen.bass = 32; laneLen.synth = 64;}
  if(genre === 'ambient'){laneLen.kick = 32; laneLen.bass = 64; laneLen.synth = 64;}
  if(genre === 'acid'){laneLen.bass = 16; laneLen.synth = 32;}
  if(genre === 'cinematic'){laneLen.bass = 64; laneLen.synth = 64;}

  const masterLen = Math.max(...Object.values(laneLen));
  const density = gd.density, chaos = gd.chaos;

  // ── BUILD MELODIC LINES with real phrase logic ──
  const bassLb = sec.lb * (sectionName === 'break' ? 2.5 : sectionName === 'drop' ? 0.8 : 1);
  const synthLb = sec.lb * (sectionName === 'break' ? 3 : sectionName === 'ambient' ? 4 : 1.2);
  const {line: bassLine, lengths: bassLengths} = buildMelodicLine(bp, progression, laneLen.bass, chaos, arpeMode, bassLb);
  const {line: synthLine, lengths: synthLengths} = buildMelodicLine(sp, progression, laneLen.synth, chaos * 0.7, arpeMode, synthLb);

  const p = {kick:mkSteps(), snare:mkSteps(), hat:mkSteps(), bass:mkSteps(), synth:mkSteps()};
  const bar = 16;
  const phraseW = [1, 0.75, 0.92, 0.68];

  // ── RHYTHMIC PATTERN with musical density control ──
  for(const lane of ['kick','snare','hat','bass','synth']){
    const ll = laneLen[lane];
    // Use correct multiplier key per lane
    const lmKey = lane === 'kick' ? 'kM' : lane === 'snare' ? 'sM' : lane === 'hat' ? 'hM' : lane === 'bass' ? 'bM' : 'syM';
    const lm = sec[lmKey] || 1;
    const dm = density * lm;
    // Bass and synth: enforce maximum density to avoid mud
    const maxDensity = lane === 'bass' ? 0.55 : lane === 'synth' ? 0.45 : 1.0;

    for(let i = 0; i < ll; i++){
      const pos = i % bar, pb = Math.floor(i / 8) % 4;
      const strong = pos === 0 || pos === 8, bb = pos === 4 || pos === 12, ob = pos % 2 === 1;
      const pw = phraseW[pb];
      let hit = false;

      if(lane === 'kick'){
        if(gd.kick === 'every4' && pos % 4 === 0) hit = true;
        else if(gd.kick === 'syncopated' && (pos === 0 || pos === 10 || pos === 14)) hit = true;
        else if(gd.kick === 'sparse' && (pos === 0 || pos === 12)) hit = true;
        else if(gd.kick === 'irregular') hit = pos === 0 || (rnd() < dm * 0.3 * pw);
        else if(strong || rnd() < (groove.kB + dm * 0.18) * pw) hit = true;
      }
      else if(lane === 'snare'){
        if(gd.hatPattern === 'breakbeat') hit = rnd() < (groove.sB + dm * 0.15) * (1 + pb * 0.2);
        else if(bb || rnd() < (groove.sB + dm * 0.08 + (bb ? 0.28 : 0)) * (1.05 - pw * 0.16)) hit = true;
      }
      else if(lane === 'hat'){
        const hatP = gd.hatPattern;
        if(hatP === '16th') hit = true;
        else if(hatP === 'offbeat') hit = ob;
        else if(hatP === 'breakbeat') hit = rnd() < (groove.hB + dm * 0.22) * (0.8 + pw * 0.25);
        else if(hatP === 'noise') hit = rnd() < 0.55 + dm * 0.18;
        else if(hatP === 'sparse') hit = rnd() < 0.2 + dm * 0.1;
        else hit = rnd() < (groove.hB + dm * 0.18) * (0.82 + pw * 0.22);
        if(hit && rnd() < chaos * 0.3) p.hat[i].p = 0.45 + rnd() * 0.4; // ghost hits
      }
      // Bass: play at phrase anchor points primarily
      else if(lane === 'bass'){
        const phraseAnchor = pos === 0 || pos === 4 || pos === 8 || pos === 12;
        const prob = phraseAnchor ? 0.82 * lm : (groove.bB + dm * 0.12) * pw * 0.7;
        hit = rnd() < Math.min(prob, maxDensity);
      }
      // Synth: more sparse, on off-beats of phrased positions
      else if(lane === 'synth'){
        const phraseOn = pos === 2 || pos === 6 || pos === 10 || pos === 14;
        const prob = phraseOn ? 0.65 * lm : (groove.syB + dm * 0.08) * pw * 0.5;
        hit = (rnd() < Math.min(prob, maxDensity) && !strong) || (pb === 3 && rnd() < 0.18 + chaos * 0.15);
      }

      if(hit){
        p[lane][i].on = true;
        p[lane][i].p = clamp(sec.pb + rnd() * (1 - sec.pb), sec.pb, 1);
        p[lane][i].v = clamp(velCurve(sec.vel, i, ll, pw), 0.22, 1);
        if(lane === 'bass') p[lane][i].l = bassLengths[i] || sec.lb;
        else if(lane === 'synth') p[lane][i].l = synthLengths[i] || sec.lb;
        else p[lane][i].l = 1;
      }
    }
  }

  // Rhythmic anchors — always present
  for(let i = 0; i < laneLen.kick; i += 16) p.kick[i].on = true;
  if(gd.kick !== 'sparse' && sectionName !== 'break'){
    for(let i = 0; i < laneLen.snare; i += 16){
      if(i + 4 < laneLen.snare) p.snare[i + 4].on = true;
      if(i + 12 < laneLen.snare) p.snare[i + 12].on = true;
    }
  }

  // Implement legature: when a step has l>1, mark subsequent steps as "tied" (on=false, held by prev)
  // This prevents double-triggering and creates real sustained notes
  for(const lane of ['bass', 'synth']){
    const ll = laneLen[lane];
    for(let i = 0; i < ll; i++){
      if(p[lane][i].on && p[lane][i].l > 1){
        const holdEnd = Math.min(ll - 1, i + Math.floor(p[lane][i].l));
        for(let j = i + 1; j <= holdEnd; j++){
          p[lane][j].tied = true; // mark as held — scheduler skips these
          p[lane][j].on = false;  // visually show as held
        }
      }
    }
  }

  // Mild chaos mutations on drums only — never on melodic lanes
  const mp = Math.floor(chaos * 5);
  for(let m = 0; m < mp; m++){
    const ln = pick(['kick','snare','hat']);
    const ll = laneLen[ln];
    const pos = Math.floor(rnd() * ll);
    if(ln === 'hat') p.hat[pos].on = !p.hat[pos].on;
    else if(ln === 'kick'){if(pos % 4 !== 0) p.kick[pos].on = rnd() < 0.35 + chaos * 0.18;}
    else{p.snare[pos].on = !p.snare[pos].on && pos % 4 !== 0;}
  }

  // Track lastBass from generated line
  const lb = bassLine[laneLen.bass - 1] || bp[0];

  return {patterns:p, bassLine, synthLine, laneLen, lastBass:lb};
}

function buildSong(genre){
  const gd=GENRES[genre];
  const modeName=pick(gd.modes);
  const progPool=CHORD_PROGS[modeName]||CHORD_PROGS.minor;
  const progression=pick(progPool);
  const arpeMode=pick(['up','down','updown','outside']);
  const bpm=Math.round(gd.bpm[0]+rnd()*(gd.bpm[1]-gd.bpm[0]));
  const arc=pick(SONG_ARCS);
  const sections=arc.map((name,idx)=>{
    const prev=idx>0?sections_:null; // will be filled
    return{name,modeName,progression,arpeMode,genre};
  });
  return{genre,modeName,progression,arpeMode,bpm,arc,sections,currentSection:0};
}

// ─── GROOVE ACCENT TABLE ──────────────────────────────────────────────────────
function grooveAccent(profile,lane,step,amount){
  const pos=step%16;
  const T={
    steady:{kick:[1.2,1,0.92,0.96,1,0.94,0.98,0.96,1.18,0.98,0.92,0.96,1.02,0.96,0.98,0.96],snare:[0.92,0.9,0.92,0.9,1.16,0.92,0.92,0.9,0.92,0.9,0.92,0.9,1.12,0.92,0.92,0.9],hat:[0.92,1.02,0.9,1.04,0.94,1.02,0.9,1.06,0.92,1.02,0.9,1.04,0.94,1.02,0.9,1.08],bass:[1.1,0.96,0.98,1.02,0.96,0.94,1,1.04,1.08,0.96,0.98,1.02,0.96,0.94,1,1.04],synth:[0.96,1,1.04,1,0.96,1,1.08,1,0.96,1,1.04,1,0.96,1,1.12,1]},
    broken:{kick:[1.22,0.88,1.04,0.84,0.96,1.06,0.9,1.02,1.14,0.86,1.08,0.82,0.94,1.04,0.9,1.06],snare:[0.88,0.94,0.9,1,1.12,0.9,0.96,0.9,0.88,1,0.9,0.96,1.1,0.88,1,0.92],hat:[0.84,1.08,0.9,1.14,0.86,1.02,0.92,1.12,0.84,1.08,0.9,1.14,0.86,1.02,0.92,1.16],bass:[1.06,0.94,1.1,0.88,1,0.94,1.08,0.9,1.04,0.94,1.1,0.88,1,0.94,1.08,0.92],synth:[0.92,1.04,1.12,0.9,0.94,1.08,1.14,0.88,0.92,1.04,1.1,0.9,0.94,1.08,1.16,0.86]},
    bunker:{kick:[1.28,0.92,0.94,0.9,1.02,0.92,0.94,0.9,1.24,0.92,0.94,0.9,1.04,0.92,0.94,0.9],snare:[0.9,0.9,0.92,0.9,1.08,0.9,0.92,0.9,0.9,0.9,0.92,0.9,1.06,0.9,0.92,0.9],hat:[0.88,0.98,0.9,1.02,0.88,0.98,0.9,1.04,0.88,0.98,0.9,1.02,0.88,0.98,0.9,1.06],bass:[1.16,0.94,0.96,1,1.04,0.94,0.96,1.02,1.14,0.94,0.96,1,1.06,0.94,0.96,1.04],synth:[0.9,0.98,1.02,0.96,0.9,0.98,1.06,0.96,0.9,0.98,1.02,0.96,0.9,0.98,1.1,0.96]},
    float: {kick:[1.12,0.98,0.96,1,1.04,0.98,0.96,1,1.1,0.98,0.96,1,1.02,0.98,0.96,1],snare:[0.94,0.98,0.96,1,1.06,0.98,0.96,1,0.94,0.98,0.96,1,1.08,0.98,0.96,1],hat:[0.96,1.02,0.98,1.04,0.96,1.02,0.98,1.06,0.96,1.02,0.98,1.04,0.96,1.02,0.98,1.08],bass:[1.04,0.98,1,1.02,1.04,0.98,1,1.04,1.02,0.98,1,1.02,1.06,0.98,1,1.04],synth:[1,1.04,1.08,1.02,1,1.04,1.1,1.02,1,1.04,1.08,1.02,1,1.04,1.12,1.02]},
  };
  const t=(T[profile]||T.steady)[lane]||T.steady.kick;
  return 1+(t[pos]-1)*clamp(amount,0,1);
}

// ─── COLORS & THEME ───────────────────────────────────────────────────────────
const LANE_CLR={kick:'#ff4444',snare:'#ffaa00',hat:'#ffdd00',bass:'#00ccff',synth:'#cc88ff'};
const GENRE_CLR={
  techno:'#ff2244',house:'#ff8800',ambient:'#44ffcc',dnb:'#ff4400',
  acid:'#aaff00',industrial:'#aaaaaa',experimental:'#ff44ff',cinematic:'#4488ff'
};


const SOUND_PRESETS={
  bass:{
    sub_floor:{label:'SUB FLOOR',bassMode:'sub',bassFilter:0.38,bassSubAmt:0.92,drive:0.06,compress:0.24,tone:0.48},
    acid_pressure:{label:'ACID PRESSURE',bassMode:'bit',bassFilter:0.72,bassSubAmt:0.36,drive:0.42,compress:0.32,tone:0.42,fmIdx:0.86},
    fm_metal:{label:'FM METAL',bassMode:'fm',bassFilter:0.62,bassSubAmt:0.28,drive:0.26,compress:0.38,tone:0.44,fmIdx:1.08},
    drift_drone:{label:'DRIFT DRONE',bassMode:'drone',bassFilter:0.56,bassSubAmt:0.62,drive:0.1,compress:0.18,tone:0.66},
    fold_grit:{label:'FOLD GRIT',bassMode:'fold',bassFilter:0.68,bassSubAmt:0.34,drive:0.48,compress:0.4,tone:0.36},
    wet_orbit:{label:'WET ORBIT',bassMode:'wet',bassFilter:0.48,bassSubAmt:0.5,drive:0.22,compress:0.24,tone:0.7},
    pulse_body:{label:'PULSE BODY',bassMode:'pulse',bassFilter:0.58,bassSubAmt:0.44,drive:0.18,compress:0.28,tone:0.56},
    saw_motion:{label:'SAW MOTION',bassMode:'saw',bassFilter:0.64,bassSubAmt:0.3,drive:0.3,compress:0.34,tone:0.52},
  },
  synth:{
    velvet_pad:{label:'VELVET PAD',synthMode:'pad',synthFilter:0.64,space:0.72,tone:0.68,drive:0.08,polySynth:true},
    neon_lead:{label:'NEON LEAD',synthMode:'lead',synthFilter:0.72,space:0.28,tone:0.74,drive:0.22,polySynth:false},
    glass_bell:{label:'GLASS BELL',synthMode:'glass',synthFilter:0.78,space:0.54,tone:0.82,drive:0.06,polySynth:true},
    air_organ:{label:'AIR ORGAN',synthMode:'organ',synthFilter:0.52,space:0.34,tone:0.62,drive:0.12,polySynth:true,fmIdx:0.72},
    string_machine:{label:'STRING MACHINE',synthMode:'strings',synthFilter:0.68,space:0.66,tone:0.7,drive:0.08,polySynth:true},
    choir_mist:{label:'CHOIR MIST',synthMode:'choir',synthFilter:0.58,space:0.76,tone:0.66,drive:0.04,polySynth:true},
    star_noise:{label:'STAR NOISE',synthMode:'star',synthFilter:0.8,space:0.62,tone:0.86,drive:0.14,polySynth:true},
    cinematic_air:{label:'CINEMATIC AIR',synthMode:'air',synthFilter:0.6,space:0.84,tone:0.74,drive:0.02,polySynth:true,fmIdx:0.54},
    mist_pluck:{label:'MIST PLUCK',synthMode:'mist',synthFilter:0.44,space:0.46,tone:0.58,drive:0.12,polySynth:false},
    bell_shard:{label:'BELL SHARD',synthMode:'bell',synthFilter:0.82,space:0.48,tone:0.8,drive:0.04,polySynth:true},
  },
  drum:{
    tight_punch:{label:'TIGHT PUNCH',drumDecay:0.32,noiseMix:0.12,compress:0.18,drive:0.1},
    warehouse:{label:'WAREHOUSE',drumDecay:0.48,noiseMix:0.22,compress:0.28,drive:0.18},
    broken_air:{label:'BROKEN AIR',drumDecay:0.58,noiseMix:0.34,compress:0.24,drive:0.12,swing:0.06},
    industrial_haze:{label:'INDUSTRIAL HAZE',drumDecay:0.64,noiseMix:0.42,compress:0.34,drive:0.28},
    dusty_tape:{label:'DUSTY TAPE',drumDecay:0.44,noiseMix:0.28,compress:0.22,drive:0.16,tone:0.58},
    crisp_club:{label:'CRISP CLUB',drumDecay:0.26,noiseMix:0.1,compress:0.26,drive:0.08,tone:0.68},
  },
  performance:{
    club_night:{label:'CLUB NIGHT',genre:'techno',grooveAmt:0.7,swing:0.03,space:0.26,tone:0.56,drive:0.18,compress:0.28},
    acid_run:{label:'ACID RUN',genre:'acid',grooveAmt:0.76,swing:0.06,space:0.24,tone:0.42,drive:0.38,compress:0.3},
    jungle_grid:{label:'JUNGLE GRID',genre:'dnb',grooveAmt:0.74,swing:0.05,space:0.22,tone:0.52,drive:0.2,compress:0.24},
    ambient_bloom:{label:'AMBIENT BLOOM',genre:'ambient',grooveAmt:0.42,swing:0.0,space:0.88,tone:0.72,drive:0.02,compress:0.16},
    cinematic_rise:{label:'CINEMATIC RISE',genre:'cinematic',grooveAmt:0.5,swing:0.02,space:0.82,tone:0.76,drive:0.04,compress:0.18},
    industrial_drive:{label:'INDUSTRIAL DRIVE',genre:'industrial',grooveAmt:0.78,swing:0.0,space:0.18,tone:0.34,drive:0.48,compress:0.36},
  }
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App(){
  // ── Audio
  const audioRef=useRef(null);
  const analyserRef=useRef(null);
  const [isReady,setIsReady]=useState(false);

  // ── Transport
  const [isPlaying,setIsPlaying]=useState(false);
  const isPlayingRef=useRef(false);
  const schedulerRef=useRef(null);
  const nextNoteRef=useRef(0);
  const stepRef=useRef(0);
  const [step,setStep]=useState(0);
  const [bpm,setBpm]=useState(128);
  const bpmRef=useRef(128);
  useEffect(()=>{bpmRef.current=bpm;},[bpm]);

  // ── Song state
  const [genre,setGenre]=useState('techno');
  const [currentSectionName,setCurrentSectionName]=useState('groove');
  const [modeName,setModeName]=useState('minor');
  const [songArc,setSongArc]=useState([]);
  const [arcIdx,setArcIdx]=useState(0);
  const [songActive,setSongActive]=useState(false);
  const songActiveRef=useRef(false);
  const arcRef=useRef([]);
  const arcIdxRef=useRef(0);
  const barCountRef=useRef(0);// bars elapsed in current section

  // ── Patterns
  const [patterns,setPatterns]=useState({kick:mkSteps(),snare:mkSteps(),hat:mkSteps(),bass:mkSteps(),synth:mkSteps()});
  const patternsRef=useRef(patterns);
  useEffect(()=>{patternsRef.current=patterns;},[patterns]);
  const [bassLine,setBassLine]=useState(mkNotes('C2'));
  const bassRef=useRef(bassLine);
  useEffect(()=>{bassRef.current=bassLine;},[bassLine]);
  const [synthLine,setSynthLine]=useState(mkNotes('C4'));
  const synthRef=useRef(synthLine);
  useEffect(()=>{synthRef.current=synthLine;},[synthLine]);
  const [laneLen,setLaneLen]=useState({kick:16,snare:16,hat:32,bass:32,synth:32});
  const laneLenRef=useRef(laneLen);
  useEffect(()=>{laneLenRef.current=laneLen;},[laneLen]);

  // ── Parameters
  const [master,setMaster]=useState(0.85);
  const [swing,setSwing]=useState(0.03);
  const swingRef=useRef(0.03);
  useEffect(()=>{swingRef.current=swing;},[swing]);
  const [humanize,setHumanize]=useState(0.012);
  const humanizeRef=useRef(0.012);
  useEffect(()=>{humanizeRef.current=humanize;},[humanize]);
  const [grooveAmt,setGrooveAmt]=useState(0.65);
  const grooveRef=useRef(0.65);
  useEffect(()=>{grooveRef.current=grooveAmt;},[grooveAmt]);
  const [grooveProfile,setGrooveProfile]=useState('steady');
  const grooveProfileRef=useRef('steady');
  useEffect(()=>{grooveProfileRef.current=grooveProfile;},[grooveProfile]);
  const [space,setSpace]=useState(0.3);
  const [tone,setTone]=useState(0.7);
  const [noiseMix,setNoiseMix]=useState(0.2);
  const [drive,setDrive]=useState(0.1);
  const [compress,setCompress]=useState(0.3);
  const [bassFilter,setBassFilter]=useState(0.55);
  const [synthFilter,setSynthFilter]=useState(0.65);
  const [drumDecay,setDrumDecay]=useState(0.5);
  const [bassSubAmt,setBassSubAmt]=useState(0.5);
  const [fmIdx,setFmIdx]=useState(0.6);
  const fmIdxRef=useRef(0.6);
  useEffect(()=>{fmIdxRef.current=fmIdx;},[fmIdx]);
  const [polySynth,setPolySynth]=useState(true);
  const [bassStack,setBassStack]=useState(true);
  const [bassPreset,setBassPreset]=useState('sub_floor');
  const [synthPreset,setSynthPreset]=useState('velvet_pad');
  const [drumPreset,setDrumPreset]=useState('tight_punch');
  const [performancePreset,setPerformancePreset]=useState('club_night');

  // ── Autopilot
  const [autopilot,setAutopilot]=useState(false);
  const autopilotRef=useRef(false);
  useEffect(()=>{autopilotRef.current=autopilot;},[autopilot]);
  const autopilotTimerRef=useRef(null);
  const [autopilotIntensity,setAutopilotIntensity]=useState(0.5);

  // ── Composition seed for transformations
  const seedRef=useRef(null);
  const lastBassRef=useRef('C2');
  const progressionRef=useRef(CHORD_PROGS.minor[0]);
  const arpModeRef=useRef('up');
  const [arpMode,setArpMode]=useState('up');

  // ── UI state
  const [view,setView]=useState('perform');// 'perform' | 'studio' | 'song'
  const [activeTab,setActiveTab]=useState('mix');
  const [activeLane,setActiveLane]=useState('kick');
  const [laneVU,setLaneVU]=useState({kick:0,snare:0,hat:0,bass:0,synth:0});
  const vuTimers=useRef({});
  const [page,setPage]=useState(0);
  const [status,setStatus]=useState('Ready — press PLAY');
  const [recordings,setRecordings]=useState([]);
  const [recState,setRecState]=useState('idle');
  const recorderRef=useRef(null);
  const chunksRef=useRef([]);
  const [projectName,setProjectName]=useState('CESIRA SESSION');
  const [savedScenes,setSavedScenes]=useState([null,null,null,null,null,null]);
  const [midiOk,setMidiOk]=useState(false);
  const midiRef=useRef(null);
  const [tapTimes,setTapTimes]=useState([]);
  const undoStack=useRef([]);
  const [undoLen,setUndoLen]=useState(0);
  const [vizData,setVizData]=useState(new Uint8Array(64));

  // ── Active notes display
  const [activeNotes,setActiveNotes]=useState({bass:'—',synth:'—'});

  // ─── AUDIO ENGINE ─────────────────────────────────────────────────────────
  const driveCurve=(node,amt)=>{
    const k=2+clamp(amt,0,1)*60;const s=512;const c=new Float32Array(s);
    for(let i=0;i<s;i++){const x=(i*2)/s-1;c[i]=((1+k)*x)/(1+k*Math.abs(x));}
    node.curve=c;node.oversample='2x';
  };
  const identityCurve=node=>{const c=new Float32Array(512);for(let i=0;i<512;i++){c[i]=(i*2)/512-1;}node.curve=c;};
  const reverbIR=(ctx,dur=1.2,dec=2.6)=>{const sr=ctx.sampleRate,l=Math.floor(sr*dur);const b=ctx.createBuffer(2,l,sr);for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);for(let i=0;i<l;i++)d[i]=(rnd()*2-1)*Math.pow(1-i/l,dec);}return b;};

  const initAudio=async()=>{
    if(audioRef.current){await audioRef.current.ctx.resume();setIsReady(true);return;}
    const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
    const ctx=new Ctx({sampleRate:44100,latencyHint:'interactive'});
    const bus=ctx.createGain();bus.gain.value=0.68;
    const preD=ctx.createWaveShaper();identityCurve(preD);
    const toneF=ctx.createBiquadFilter();toneF.type='lowpass';toneF.frequency.value=16000;toneF.Q.value=0.35;
    const comp=ctx.createDynamicsCompressor();comp.threshold.value=-24;comp.knee.value=18;comp.ratio.value=3;comp.attack.value=0.008;comp.release.value=0.22;
    const lim=ctx.createDynamicsCompressor();lim.threshold.value=-3;lim.knee.value=0;lim.ratio.value=20;lim.attack.value=0.001;lim.release.value=0.04;
    const dry=ctx.createGain(),wet=ctx.createGain();dry.gain.value=1;wet.gain.value=0;
    const spl=ctx.createChannelSplitter(2),mrg=ctx.createChannelMerger(2);
    const lDly=ctx.createDelay(0.5),rDly=ctx.createDelay(0.5),fb=ctx.createGain(),dlyT=ctx.createBiquadFilter();
    dlyT.type='lowpass';dlyT.frequency.value=4500;fb.gain.value=0.15;
    const chorus=ctx.createGain();chorus.gain.value=0;
    const cD1=ctx.createDelay(0.025),cD2=ctx.createDelay(0.031);
    const rev=ctx.createConvolver();rev.buffer=reverbIR(ctx);
    const revW=ctx.createGain();revW.gain.value=0;
    const out=ctx.createGain();out.gain.value=0.88;
    const an=ctx.createAnalyser();an.fftSize=256;an.smoothingTimeConstant=0.8;
    const dest=ctx.createMediaStreamDestination();
    bus.connect(preD);preD.connect(toneF);toneF.connect(comp);
    comp.connect(dry);comp.connect(spl);comp.connect(cD1);comp.connect(cD2);comp.connect(rev);
    cD1.connect(chorus);cD2.connect(chorus);rev.connect(revW);
    spl.connect(lDly,0);spl.connect(rDly,1);rDly.connect(dlyT);dlyT.connect(fb);fb.connect(lDly);
    lDly.connect(mrg,0,0);rDly.connect(mrg,0,1);mrg.connect(wet);
    dry.connect(out);wet.connect(out);chorus.connect(out);revW.connect(out);
    out.connect(lim);lim.connect(an);lim.connect(ctx.destination);lim.connect(dest);
    audioRef.current={ctx,bus,preD,toneF,comp,lim,dry,wet,lDly,rDly,fb,chorus,revW,out,an,dest};
    analyserRef.current=an;
    setIsReady(true);setStatus('Audio online');
    applyFxNow();
  };

  const applyFxNow=()=>{
    const a=audioRef.current;if(!a)return;
    const now=a.ctx.currentTime;
    const gd=GENRES[genre];const fx=gd.fxProfile;
    driveCurve(a.preD,clamp(fx.drive*0.4+drive*0.1,0,0.38));
    a.toneF.frequency.linearRampToValueAtTime(clamp(1800+12000*fx.tone*tone,600,19000),now+0.08);
    a.lDly.delayTime.linearRampToValueAtTime(clamp(0.02+space*0.08,0.01,0.45),now+0.08);
    a.rDly.delayTime.linearRampToValueAtTime(clamp(0.03+space*0.1,0.01,0.45),now+0.08);
    a.fb.gain.linearRampToValueAtTime(clamp(0.06+space*0.2,0.03,0.4),now+0.08);
    a.wet.gain.linearRampToValueAtTime(clamp(space*0.18,0,0.25),now+0.08);
    a.dry.gain.linearRampToValueAtTime(clamp(0.95-space*0.08,0.72,0.97),now+0.08);
    a.chorus.gain.linearRampToValueAtTime(clamp(space*0.08,0,0.14),now+0.12);
    a.revW.gain.linearRampToValueAtTime(clamp(fx.space*space*0.22,0,0.28),now+0.14);
    a.out.gain.linearRampToValueAtTime(master,now+0.06);
    a.comp.threshold.value=clamp(-20-compress*12,-32,-6);
    a.comp.ratio.value=clamp(2+compress*5,1.5,8);
  };
  useEffect(()=>{if(audioRef.current)applyFxNow();},[space,tone,drive,compress,master,genre]);

  // Per-lane gain nodes
  const laneGains=useRef({});
  const getLaneGain=(lane)=>{
    const a=audioRef.current;if(!a)return null;
    if(!laneGains.current[lane]){const g=a.ctx.createGain();g.gain.value=1;g.connect(a.bus);laneGains.current[lane]=g;}
    return laneGains.current[lane];
  };

  const ss=(n,t)=>{try{n.start(t);}catch{}};
  const st=(n,t)=>{try{n.stop(t);}catch{}};
  const gc=(src,nodes,ms)=>{const fn=()=>[src,...nodes].forEach(n=>{try{n.disconnect();}catch{}});src.onended=fn;setTimeout(fn,ms);};
  const activeNodes=useRef(0);
  const nodeGuard=()=>activeNodes.current<90;
  const trackNode=ms=>{activeNodes.current++;setTimeout(()=>{activeNodes.current=Math.max(0,activeNodes.current-1);},ms+80);};

  const flashLane=useCallback((lane,level=1)=>{
    setLaneVU(p=>({...p,[lane]:Math.min(1,level)}));
    if(vuTimers.current[lane])clearInterval(vuTimers.current[lane]);
    vuTimers.current[lane]=setInterval(()=>setLaneVU(p=>{const nv=Math.max(0,p[lane]-0.2);if(nv<=0)clearInterval(vuTimers.current[lane]);return{...p,[lane]:nv};}),55);
  },[]);

  const noiseBuffer=(len=0.22,amt=1,color='white')=>{
    const a=audioRef.current;const sr=a.ctx.sampleRate;
    const b=a.ctx.createBuffer(1,Math.floor(sr*len),sr);const d=b.getChannelData(0);
    if(color==='white'){for(let i=0;i<d.length;i++)d[i]=(rnd()*2-1)*amt;return b;}
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0;
    for(let i=0;i<d.length;i++){
      const w=rnd()*2-1;
      if(color==='pink'){b0=0.99886*b0+w*0.0555179;b1=0.99332*b1+w*0.0750759;b2=0.969*b2+w*0.153852;b3=0.8665*b3+w*0.310486;b4=0.55*b4+w*0.532952;b5=-0.7616*b5-w*0.016898;d[i]=(b0+b1+b2+b3+b4+b5+w*0.5362)*amt*0.11;}
      else{b0=0.99*b0+w*0.01;d[i]=b0*amt*3;}
    }
    return b;
  };

  const stepSec=()=>(60/bpmRef.current)/4;

  // ─── DRUM SYNTHESIS ────────────────────────────────────────────────────────
  const playKick=(accent,t)=>{
    if(!nodeGuard())return;
    const a=audioRef.current;const gd=GENRES[genre];
    const kf=gd.kickFreq||90,ke=gd.kickEnd||35,et=0.08+drumDecay*0.12,dt=0.16+drumDecay*0.22;
    const body=a.ctx.createOscillator(),bG=a.ctx.createGain();
    const sub=a.ctx.createOscillator(),sG=a.ctx.createGain();
    const click=a.ctx.createBufferSource(),cG=a.ctx.createGain();
    const mG=a.ctx.createGain(),sh=a.ctx.createWaveShaper();
    body.type='sine';body.frequency.setValueAtTime(kf,t);body.frequency.exponentialRampToValueAtTime(Math.max(20,ke),t+et);
    sub.type='sine';sub.frequency.setValueAtTime(kf*0.5,t);sub.frequency.exponentialRampToValueAtTime(Math.max(18,ke*0.5),t+et);
    const cb=a.ctx.createBuffer(1,Math.floor(a.ctx.sampleRate*0.004),a.ctx.sampleRate);
    const cd=cb.getChannelData(0);for(let i=0;i<cd.length;i++)cd[i]=rnd()*2-1;
    click.buffer=cb;driveCurve(sh,0.05+noiseMix*0.08);
    bG.gain.setValueAtTime(0,t);bG.gain.linearRampToValueAtTime(0.82*accent,t+0.001);bG.gain.exponentialRampToValueAtTime(0.001,t+dt);
    sG.gain.setValueAtTime(0,t);sG.gain.linearRampToValueAtTime(0.5*accent*bassSubAmt,t+0.001);sG.gain.exponentialRampToValueAtTime(0.001,t+dt*1.2);
    cG.gain.setValueAtTime(0,t);cG.gain.linearRampToValueAtTime(0.3*accent,t+0.0005);cG.gain.exponentialRampToValueAtTime(0.001,t+0.006);
    body.connect(sh);sh.connect(bG);sub.connect(sG);click.connect(cG);
    bG.connect(mG);sG.connect(mG);cG.connect(mG);
    const dest=getLaneGain('kick')||a.bus;mG.connect(dest);
    const dur=(dt+0.1)*1000+200;trackNode(dur);
    gc(body,[sub,click,bG,sG,cG,mG,sh],dur);
    ss(body,t);ss(sub,t);ss(click,t);st(body,t+dt+0.05);st(sub,t+dt+0.08);st(click,t+0.008);
  };

  const playSnare=(accent,t)=>{
    if(!nodeGuard())return;
    const a=audioRef.current;const gd=GENRES[genre];
    const nb=noiseBuffer(0.18,0.24+noiseMix*0.5,gd.noiseColor||'white');
    const src=a.ctx.createBufferSource(),fil=a.ctx.createBiquadFilter(),g=a.ctx.createGain();
    src.buffer=nb;fil.type='bandpass';fil.frequency.value=1600+noiseMix*400;fil.Q.value=1.0+compress*0.4;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.55*accent,t+0.002);g.gain.exponentialRampToValueAtTime(0.001,t+0.055+drumDecay*0.12);
    src.connect(fil);fil.connect(g);const dest=getLaneGain('snare')||a.bus;g.connect(dest);
    gc(src,[fil,g],400);ss(src,t);st(src,t+0.2);
  };

  const playHat=(accent,t,open=false)=>{
    if(!nodeGuard())return;
    const a=audioRef.current;const gd=GENRES[genre];
    const nb=noiseBuffer(open?0.3:0.12,0.18+noiseMix*0.35,gd.noiseColor||'white');
    const src=a.ctx.createBufferSource(),fil=a.ctx.createBiquadFilter(),g=a.ctx.createGain();
    src.buffer=nb;fil.type='highpass';fil.frequency.value=open?7000:8500;
    const decay=open?0.08+drumDecay*0.25:0.008+drumDecay*0.04;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.3*accent,t+0.001);g.gain.exponentialRampToValueAtTime(0.001,t+decay);
    src.connect(fil);fil.connect(g);const dest=getLaneGain('hat')||a.bus;g.connect(dest);
    gc(src,[fil,g],600);ss(src,t);st(src,t+open?0.35:0.15);
  };


  const getVoiceNotes=(baseNote,lane='synth')=>{
    const mode=MODES[modeName]||MODES.minor;
    const pool=lane==='bass'?mode.b:mode.s;
    const idx=pool.indexOf(baseNote);
    if(lane==='bass'){
      if(!bassStack)return [baseNote];
      const fifth=idx>-1?pool[Math.min(idx+4,pool.length-1)]:transposeNote(baseNote,7);
      return [...new Set([baseNote,fifth])];
    }
    if(!polySynth)return [baseNote];
    if(idx===-1)return [...new Set([baseNote,transposeNote(baseNote,4),transposeNote(baseNote,7)])];
    return [...new Set([pool[idx],pool[Math.min(idx+2,pool.length-1)],pool[Math.min(idx+4,pool.length-1)]])];
  };

  // ─── BASS SYNTHESIS ────────────────────────────────────────────────────────
  const playBassVoice=(note,accent,t,lenSteps=1)=>{
    if(!nodeGuard())return;
    const a=audioRef.current;
    const f=NOTE_FREQ[note]||110;
    const dur=clamp(stepSec()*lenSteps*0.92,0.04,6);
    const atk=Math.min(0.008,dur*0.05);
    const rel=Math.max(0.04,dur*0.88);
    const mode=GENRES[genre].bassMode||'sub';
    const g=a.ctx.createGain(),fil=a.ctx.createBiquadFilter();
    fil.type='lowpass';fil.frequency.setValueAtTime(60+bassFilter*3500+tone*600,t);fil.Q.value=0.5+compress*3;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.58*accent,t+atk);g.gain.setValueAtTime(0.58*accent,t+rel*0.3);g.gain.exponentialRampToValueAtTime(0.0001,t+rel);
    const cleanMs=(rel+0.3)*1000;

    if(mode==='fm'||mode==='bit'){
      const idx=fmIdxRef.current*(mode==='bit'?3:1.5);
      const car=a.ctx.createOscillator(),mod=a.ctx.createOscillator(),mg=a.ctx.createGain();
      car.type='sine';car.frequency.value=f;mod.type='sine';mod.frequency.value=f*(mode==='fm'?2:3);mg.gain.value=f*idx;
      const sub=a.ctx.createOscillator(),sg=a.ctx.createGain();
      sub.type='sine';sub.frequency.value=f*0.5;sg.gain.value=bassSubAmt*0.4;
      mod.connect(mg);mg.connect(car.frequency);car.connect(fil);sub.connect(sg);sg.connect(fil);fil.connect(g);
      const dest=getLaneGain('bass')||a.bus;g.connect(dest);trackNode(cleanMs);
      gc(car,[mod,mg,sub,sg,fil,g],cleanMs);
      ss(car,t);ss(mod,t);ss(sub,t);st(car,t+rel+0.05);st(mod,t+rel+0.05);st(sub,t+rel+0.05);
    } else if(mode==='fold'||mode==='wet'){
      const car=a.ctx.createOscillator(),ring=a.ctx.createOscillator(),rm=a.ctx.createGain();
      car.type='sawtooth';car.frequency.value=f;ring.type='sine';ring.frequency.value=f*(mode==='fold'?1.5:0.75);
      rm.gain.value=0.5;const rg=a.ctx.createGain();rg.gain.value=0;ring.connect(rg);rg.connect(rm.gain);
      car.connect(rm);rm.connect(fil);
      const sub=a.ctx.createOscillator(),sg=a.ctx.createGain();
      sub.type='sine';sub.frequency.value=f*0.5;sg.gain.value=bassSubAmt*0.5;
      sub.connect(sg);sg.connect(fil);fil.connect(g);
      const dest=getLaneGain('bass')||a.bus;g.connect(dest);trackNode(cleanMs);
      gc(car,[ring,rm,rg,sub,sg,fil,g],cleanMs);
      ss(car,t);ss(ring,t);ss(sub,t);st(car,t+rel+0.05);st(ring,t+rel+0.05);st(sub,t+rel+0.05);
    } else {
      const o1=a.ctx.createOscillator(),o2=a.ctx.createOscillator();
      const types={sub:'sine',grit:'sawtooth',drone:'sawtooth',saw:'sawtooth',pulse:'square'};
      o1.type=types[mode]||'sawtooth';o2.type='sine';
      o1.frequency.value=f;o2.frequency.value=f*1.005;
      const sg=a.ctx.createGain();sg.gain.value=bassSubAmt*(mode==='sub'?0.85:0.3);
      const lfo=a.ctx.createOscillator(),lg=a.ctx.createGain();
      lfo.frequency.value=0.5;lg.gain.value=mode==='drone'?30:5;
      lfo.connect(lg);lg.connect(fil.frequency);
      o1.connect(fil);o2.connect(sg);sg.connect(fil);fil.connect(g);
      const dest=getLaneGain('bass')||a.bus;g.connect(dest);trackNode(cleanMs);
      gc(o1,[o2,lfo,sg,fil,g,lg],cleanMs);
      ss(o1,t);ss(o2,t);ss(lfo,t);st(o1,t+rel+0.05);st(o2,t+rel+0.05);st(lfo,t+rel+0.05);
    }
    if(midiRef.current){const out=[...midiRef.current.outputs.values()][0];if(out){const v=Math.round(clamp(accent,0,1)*127);out.send([0x93,NOTE_MIDI[note]||48,v]);setTimeout(()=>out.send([0x83,NOTE_MIDI[note]||48,0]),rel*1000);}}
  };
  const playBass=(note,accent,t,lenSteps=1)=>{
    const notes=Array.isArray(note)?note:getVoiceNotes(note,'bass');
    const voiceAccent=accent/Math.sqrt(Math.max(1,notes.length));
    notes.forEach((voice,idx)=>playBassVoice(voice,voiceAccent,t+idx*0.002,lenSteps));
    setActiveNotes(p=>({...p,bass:notes.join(' · ')}));
  };

  // ─── SYNTH SYNTHESIS — extended with richer voices ───────────────────────
  const playSynthVoice=(note,accent,t,lenSteps=1)=>{
    if(!nodeGuard())return;
    const a=audioRef.current;
    const f=NOTE_FREQ[note]||440;
    const dur=clamp(stepSec()*lenSteps*0.92,0.04,6);
    const mode=GENRES[genre].synthMode||'lead';
    const cleanMs=(dur+1.5)*1000;

    if(mode==='glass'||mode==='bell'){
      const atk=0.001,rel=Math.max(0.3,dur*1.2+synthFilter*2);
      const nb=noiseBuffer(0.04,1,'white');
      const src=a.ctx.createBufferSource();src.buffer=nb;
      const dly=a.ctx.createDelay(0.05);dly.delayTime.value=1/f;
      const fbk=a.ctx.createGain();fbk.gain.value=0.97-synthFilter*0.15;
      const lpf=a.ctx.createBiquadFilter();lpf.type='lowpass';lpf.frequency.value=2000+synthFilter*6000;
      const amp=a.ctx.createGain();
      amp.gain.setValueAtTime(0,t);amp.gain.linearRampToValueAtTime(0.55*accent,t+atk);amp.gain.exponentialRampToValueAtTime(0.001,t+rel);
      src.connect(dly);dly.connect(lpf);lpf.connect(fbk);fbk.connect(dly);lpf.connect(amp);
      const dest=getLaneGain('synth')||a.bus;amp.connect(dest);trackNode(cleanMs);
      gc(src,[dly,lpf,fbk,amp],cleanMs);
      ss(src,t);st(src,t+0.04);
      return;
    }

    if(mode==='pad'||mode==='choir'||mode==='mist'){
      const atk=0.06+dur*0.08,rel=Math.max(atk+0.1,dur*0.9+space*0.5);
      const o1=a.ctx.createOscillator(),o2=a.ctx.createOscillator(),o3=a.ctx.createOscillator();
      o1.type='sawtooth';o2.type='sawtooth';o3.type='sine';
      o1.frequency.value=f;o2.frequency.value=f*1.012;o3.frequency.value=f*0.995;
      const mix=a.ctx.createGain();mix.gain.value=0.33;
      const fil=a.ctx.createBiquadFilter();fil.type='lowpass';
      fil.frequency.setValueAtTime(300+synthFilter*2000,t);
      fil.frequency.linearRampToValueAtTime(800+synthFilter*5000,t+atk*2);
      fil.Q.value=0.4+compress*1.5;
      const amp=a.ctx.createGain();
      amp.gain.setValueAtTime(0,t);amp.gain.linearRampToValueAtTime(0.38*accent,t+atk);
      amp.gain.setValueAtTime(0.38*accent,t+Math.max(atk+0.01,dur*0.6));
      amp.gain.exponentialRampToValueAtTime(0.001,t+rel);
      o1.connect(mix);o2.connect(mix);o3.connect(mix);mix.connect(fil);fil.connect(amp);
      const dest=getLaneGain('synth')||a.bus;amp.connect(dest);trackNode(cleanMs);
      gc(o1,[o2,o3,mix,fil,amp],cleanMs);
      ss(o1,t);ss(o2,t);ss(o3,t);st(o1,t+rel+0.1);st(o2,t+rel+0.1);st(o3,t+rel+0.1);
      return;
    }

    if(mode==='organ'||mode==='air'){
      const atk=0.005,rel=Math.max(0.05,dur*0.95);
      const c1=a.ctx.createOscillator(),c2=a.ctx.createOscillator();
      const m1=a.ctx.createOscillator(),m2=a.ctx.createOscillator();
      const mg1=a.ctx.createGain(),mg2=a.ctx.createGain();
      c1.type='sine';c2.type='sine';m1.type='sine';m2.type='sine';
      c1.frequency.value=f;c2.frequency.value=f*2;m1.frequency.value=f*1;m2.frequency.value=f*3;
      mg1.gain.value=f*fmIdxRef.current*0.8;mg2.gain.value=f*fmIdxRef.current*0.4;
      m1.connect(mg1);mg1.connect(c1.frequency);
      m2.connect(mg2);mg2.connect(c2.frequency);
      const mix=a.ctx.createGain();mix.gain.value=0.5;
      const amp=a.ctx.createGain();
      amp.gain.setValueAtTime(0,t);amp.gain.linearRampToValueAtTime(0.4*accent,t+atk);
      amp.gain.setValueAtTime(0.4*accent,t+Math.max(atk+0.01,dur*0.85));
      amp.gain.exponentialRampToValueAtTime(0.001,t+rel);
      c1.connect(mix);c2.connect(mix);mix.connect(amp);
      const dest=getLaneGain('synth')||a.bus;amp.connect(dest);trackNode(cleanMs);
      gc(c1,[c2,m1,m2,mg1,mg2,mix,amp],cleanMs);
      ss(c1,t);ss(c2,t);ss(m1,t);ss(m2,t);st(c1,t+rel+0.1);st(c2,t+rel+0.1);st(m1,t+rel+0.1);st(m2,t+rel+0.1);
      return;
    }

    if(mode==='strings'||mode==='star'){
      const atk=0.08+dur*0.06,rel=Math.max(atk+0.1,dur*0.92+space*0.4);
      const o1=a.ctx.createOscillator(),o2=a.ctx.createOscillator();
      const vib=a.ctx.createOscillator(),vg=a.ctx.createGain();
      o1.type='sawtooth';o2.type='sawtooth';
      o1.frequency.value=f;o2.frequency.value=f*1.006;
      vib.frequency.value=5.2+rnd()*0.6;vg.gain.value=2+synthFilter*6;
      vib.connect(vg);vg.connect(o1.frequency);vg.connect(o2.frequency);
      const fil=a.ctx.createBiquadFilter();fil.type='lowpass';fil.frequency.value=400+synthFilter*5000;fil.Q.value=0.3;
      const amp=a.ctx.createGain();
      amp.gain.setValueAtTime(0,t);amp.gain.linearRampToValueAtTime(0.36*accent,t+atk);
      amp.gain.setValueAtTime(0.36*accent,t+Math.max(atk+0.01,dur*0.7));
      amp.gain.exponentialRampToValueAtTime(0.001,t+rel);
      o1.connect(fil);o2.connect(fil);fil.connect(amp);
      const dest=getLaneGain('synth')||a.bus;amp.connect(dest);trackNode(cleanMs);
      gc(o1,[o2,vib,vg,fil,amp],cleanMs);
      ss(o1,t);ss(o2,t);ss(vib,t);st(o1,t+rel+0.1);st(o2,t+rel+0.1);st(vib,t+rel+0.1);
      return;
    }

    const atk=0.005,rel=Math.max(0.05,dur*0.9);
    const o1=a.ctx.createOscillator(),o2=a.ctx.createOscillator();
    const tmap={lead:'square',mist:'sawtooth',choir:'sine',star:'sine',glass:'sine',organ:'sine'};
    o1.type=tmap[mode]||'sawtooth';o2.type='triangle';
    o1.frequency.value=f;o2.frequency.value=f*1.008;
    const vib=a.ctx.createOscillator(),vg=a.ctx.createGain();
    vib.frequency.value=5.5;vg.gain.value=clamp(mode==='lead'?8:3,0,15);
    vib.connect(vg);vg.connect(o1.frequency);
    const fil=a.ctx.createBiquadFilter();fil.type='lowpass';fil.frequency.value=200+synthFilter*7000+tone*1200;fil.Q.value=0.5+compress*3;
    const amp=a.ctx.createGain();
    amp.gain.setValueAtTime(0,t);amp.gain.linearRampToValueAtTime(0.38*accent,t+atk);
    amp.gain.setValueAtTime(0.38*accent,t+Math.max(atk+0.01,dur*0.65));
    amp.gain.exponentialRampToValueAtTime(0.001,t+rel);
    const mix=a.ctx.createGain();mix.gain.value=0.5;
    o1.connect(mix);o2.connect(mix);mix.connect(fil);fil.connect(amp);
    const dest=getLaneGain('synth')||a.bus;amp.connect(dest);trackNode(cleanMs);
    gc(o1,[o2,vib,vg,mix,fil,amp],cleanMs);
    ss(o1,t);ss(o2,t);ss(vib,t);st(o1,t+rel+0.1);st(o2,t+rel+0.1);st(vib,t+rel+0.1);
    if(midiRef.current){const out=[...midiRef.current.outputs.values()][0];if(out){const v=Math.round(clamp(accent,0,1)*127);out.send([0x94,NOTE_MIDI[note]||60,v]);setTimeout(()=>out.send([0x84,NOTE_MIDI[note]||60,0]),rel*1000);}}
  };
  const playSynth=(note,accent,t,lenSteps=1)=>{
    const notes=Array.isArray(note)?note:getVoiceNotes(note,'synth');
    const voiceAccent=accent/Math.sqrt(Math.max(1,notes.length));
    notes.forEach((voice,idx)=>playSynthVoice(voice,voiceAccent,t+idx*0.003,lenSteps));
    setActiveNotes(p=>({...p,synth:notes.join(' · ')}));
  };

  // ─── SCHEDULER ────────────────────────────────────────────────────────────
  const scheduleNote=(si,t)=>{
    const lp=patternsRef.current,ll=laneLenRef.current;
    const accent=si%4===0?1:0.85;
    for(const lane of['kick','snare','hat','bass','synth']){
      const len=ll[lane]||16;
      const li=si%len;
      const sd=lp[lane][li];
      if(!sd||!sd.on)continue;
      if(sd.tied)continue; // skip tied (held) steps — note is already sounding
      if(sd.p<1&&rnd()>sd.p)continue;
      const jit=(rnd()-0.5)*humanizeRef.current*0.02;
      const noteT=t+Math.max(0,jit);
      const ga=grooveAccent(grooveProfileRef.current,lane,li,grooveRef.current);
      const fa=clamp(accent*ga*(sd.v||1),0.1,1.15);
      if(lane==='kick')playKick(fa,noteT);
      else if(lane==='snare')playSnare(fa,noteT);
      else if(lane==='hat')playHat(fa,noteT,si%32===0&&rnd()<0.12);
      else if(lane==='bass')playBass(bassRef.current[li]||'C2',fa,noteT,sd.l||1);
      else if(lane==='synth')playSynth(synthRef.current[li]||'C4',fa,noteT,sd.l||1);
      const delay=Math.max(0,(noteT-audioRef.current.ctx.currentTime)*1000);
      setTimeout(()=>flashLane(lane,fa),delay);
    }
    // Song arc — advance section every N bars
    if(si===0&&songActiveRef.current){
      barCountRef.current++;
      const arc=arcRef.current;
      if(arc.length>0){
        const sec=SECTIONS[arc[arcIdxRef.current]]||SECTIONS.groove;
        if(barCountRef.current>=sec.bars){
          barCountRef.current=0;
          const nextIdx=(arcIdxRef.current+1)%arc.length;
          arcIdxRef.current=nextIdx;
          setArcIdx(nextIdx);
          const nextSec=arc[nextIdx];
          setCurrentSectionName(nextSec);
          regenerateSection(nextSec,false);
        }
      }
    }
  };

  const stepInterval=si=>{
    const ms=(60/bpmRef.current)*1000/4;
    const sw=si%2===1?ms*swingRef.current:-ms*swingRef.current*0.5;
    return Math.max(0.028,(ms+sw)/1000);
  };

  const runScheduler=()=>{
    const a=audioRef.current;if(!a||!isPlayingRef.current)return;
    const now=a.ctx.currentTime;
    while(nextNoteRef.current<now+SCHED){
      const si=stepRef.current;
      scheduleNote(si,nextNoteRef.current);
      const delay=Math.max(0,(nextNoteRef.current-now)*1000);
      setTimeout(()=>{setStep(si);setPage(Math.floor(si/PAGE));},delay);
      nextNoteRef.current+=stepInterval(si);
      stepRef.current=(si+1)%MAX_STEPS;
    }
  };

  // ─── TRANSPORT ────────────────────────────────────────────────────────────
  const startClock=()=>{
    const a=audioRef.current;if(!a)return;
    nextNoteRef.current=a.ctx.currentTime+0.06;
    stepRef.current=0;isPlayingRef.current=true;
    schedulerRef.current=setInterval(runScheduler,LOOK);
  };
  const stopClock=()=>{
    if(schedulerRef.current){clearInterval(schedulerRef.current);schedulerRef.current=null;}
    isPlayingRef.current=false;setIsPlaying(false);setStep(0);
  };
  const togglePlay=async()=>{
    await initAudio();if(!audioRef.current)return;
    if(isPlayingRef.current){stopClock();setStatus('Stopped');return;}
    if(audioRef.current.ctx.state==='suspended')await audioRef.current.ctx.resume();
    startClock();setIsPlaying(true);setStatus(`Playing — ${genre} · ${currentSectionName}`);
  };

  // ─── GENERATION ───────────────────────────────────────────────────────────
  const regenerateSection=(sectionName,pushUndo_=true)=>{
    const gd=GENRES[genre];
    const mName=modeName;
    const prog=progressionRef.current;
    const aMode=arpModeRef.current;
    const lb=lastBassRef.current;
    const result=buildSection(genre,sectionName||currentSectionName,mName,prog,aMode,lb);
    if(pushUndo_)pushUndo();
    setPatterns(result.patterns);
    setBassLine(result.bassLine);
    setSynthLine(result.synthLine);
    setLaneLen(result.laneLen);
    lastBassRef.current=result.lastBass;
    patternsRef.current=result.patterns;
    bassRef.current=result.bassLine;
    synthRef.current=result.synthLine;
    laneLenRef.current=result.laneLen;
    const gp=gd.density>0.65&&gd.chaos>0.4?'bunker':gd.chaos>0.6?'broken':gd.density<0.4?'float':'steady';
    setGrooveProfile(gp);grooveProfileRef.current=gp;
    setStatus(`${genre} · ${sectionName||currentSectionName} · ${mName}`);
  };

  const newGenreSession=(g)=>{
    const gd=GENRES[g];
    const mName=pick(gd.modes);
    const pp=CHORD_PROGS[mName]||CHORD_PROGS.minor;
    const prog=pick(pp);
    const aMode=pick(['up','down','updown','outside']);
    setGenre(g);setModeName(mName);setArpMode(aMode);
    progressionRef.current=prog;arpModeRef.current=aMode;
    setBpm(Math.round(gd.bpm[0]+rnd()*(gd.bpm[1]-gd.bpm[0])));
    bpmRef.current=Math.round(gd.bpm[0]+rnd()*(gd.bpm[1]-gd.bpm[0]));
    setSpace(gd.fxProfile.space);setTone(gd.fxProfile.tone);setDrive(gd.fxProfile.drive*2);
    setNoiseMix(gd.chaos*0.4);setCompress(gd.density*0.4);
    const sec=pick(Object.keys(SECTIONS));
    setCurrentSectionName(sec);
    lastBassRef.current='C2';
    const result=buildSection(g,sec,mName,prog,aMode,'C2');
    setPatterns(result.patterns);setBassLine(result.bassLine);setSynthLine(result.synthLine);setLaneLen(result.laneLen);
    patternsRef.current=result.patterns;bassRef.current=result.bassLine;synthRef.current=result.synthLine;laneLenRef.current=result.laneLen;
    lastBassRef.current=result.lastBass;
    const gp=gd.density>0.65&&gd.chaos>0.4?'bunker':gd.chaos>0.6?'broken':gd.density<0.4?'float':'steady';
    setGrooveProfile(gp);grooveProfileRef.current=gp;
    applyFxNow();
    setStatus(`${g} loaded — ${sec} · ${mName}`);
  };

  // Section jump trigger
  const triggerSection=(sec)=>{
    setCurrentSectionName(sec);regenerateSection(sec);
  };

  // Live performance actions
  const perfActions={
    drop:()=>triggerSection('drop'),
    break:()=>triggerSection('break'),
    build:()=>triggerSection('build'),
    groove:()=>triggerSection('groove'),
    tension:()=>triggerSection('tension'),
    fill:()=>triggerSection('fill'),
    intro:()=>triggerSection('intro'),
    outro:()=>triggerSection('outro'),
    reharmonize:()=>{
      const pp=CHORD_PROGS[modeName]||CHORD_PROGS.minor;
      progressionRef.current=pick(pp);
      regenerateSection(currentSectionName);
      setStatus('Reharmonized');
    },
    mutate:()=>{
      pushUndo();
      const np={...patternsRef.current};
      ['kick','snare','hat','bass','synth'].forEach(ln=>{
        const ll=laneLenRef.current[ln]||16;
        const flips=Math.max(2,Math.floor(ll*0.08));
        np[ln]=np[ln].map(s=>({...s}));
        for(let i=0;i<flips;i++){const pos=Math.floor(rnd()*ll);if(pos%4!==0||ln!=='kick')np[ln][pos].on=!np[ln][pos].on;}
      });
      setPatterns(np);patternsRef.current=np;
      setStatus('Pattern mutated');
    },
    thinOut:()=>{
      pushUndo();
      const np={...patternsRef.current};
      ['hat','synth','bass'].forEach(ln=>{
        const ll=laneLenRef.current[ln]||16;
        np[ln]=np[ln].map((s,i)=>({...s,on:s.on&&(i%4===0||rnd()>0.45)}));
      });
      setPatterns(np);patternsRef.current=np;
      setStatus('Thinned out');
    },
    thicken:()=>{
      pushUndo();
      const np={...patternsRef.current};
      ['hat','kick'].forEach(ln=>{
        const ll=laneLenRef.current[ln]||16;
        np[ln]=np[ln].map((s,i)=>({...s,on:s.on||(rnd()<0.22),v:s.v||0.65,p:s.p||0.7}));
      });
      setPatterns(np);patternsRef.current=np;
      setStatus('Thickened');
    },
    randomizeNotes:()=>{
      // Randomize synth line within current mode's scale
      const mode=MODES[modeName]||MODES.minor;
      const sp=mode.s;
      pushUndo();
      setSynthLine(prev=>{const n=prev.map((v,i)=>patterns.synth[i]?.on?pick(sp):v);synthRef.current=n;return n;});
      setStatus('Synth notes randomized');
    },
    randomizeBass:()=>{
      const mode=MODES[modeName]||MODES.minor;
      const bp=mode.b;
      pushUndo();
      setBassLine(prev=>{const n=prev.map((v,i)=>patterns.bass[i]?.on?pick(bp):v);bassRef.current=n;return n;});
      setStatus('Bass notes randomized');
    },
    shiftNotesUp:()=>{
      const mode=MODES[modeName]||MODES.minor;
      ['bass','synth'].forEach(lane=>{
        const pool=lane==='bass'?mode.b:mode.s;
        if(lane==='bass')setBassLine(prev=>{const n=prev.map((v,i)=>{if(!patterns[lane][i]?.on)return v;const idx=pool.indexOf(v);return pool[Math.min(idx+1,pool.length-1)];});bassRef.current=n;return n;});
        else setSynthLine(prev=>{const n=prev.map((v,i)=>{if(!patterns[lane][i]?.on)return v;const idx=pool.indexOf(v);return pool[Math.min(idx+1,pool.length-1)];});synthRef.current=n;return n;});
      });
      setStatus('Notes shifted up');
    },
    shiftNotesDown:()=>{
      const mode=MODES[modeName]||MODES.minor;
      ['bass','synth'].forEach(lane=>{
        const pool=lane==='bass'?mode.b:mode.s;
        if(lane==='bass')setBassLine(prev=>{const n=prev.map((v,i)=>{if(!patterns[lane][i]?.on)return v;const idx=pool.indexOf(v);return pool[Math.max(idx-1,0)];});bassRef.current=n;return n;});
        else setSynthLine(prev=>{const n=prev.map((v,i)=>{if(!patterns[lane][i]?.on)return v;const idx=pool.indexOf(v);return pool[Math.max(idx-1,0)];});synthRef.current=n;return n;});
      });
      setStatus('Notes shifted down');
    },
    shiftArp:()=>{
      const modes=['up','down','updown','outside'];
      const next=modes[(modes.indexOf(arpModeRef.current)+1)%modes.length];
      setArpMode(next);arpModeRef.current=next;
      regenerateSection(currentSectionName);
      setStatus(`Arp → ${next}`);
    },
    clear:()=>clearPattern(),
  };

  // ─── AUTOPILOT ────────────────────────────────────────────────────────────
  const runAutopilot=useCallback(()=>{
    if(!autopilotRef.current)return;
    const intensity=autopilotIntensity;
    const actions=Object.keys(perfActions);
    const r=rnd();
    if(r<0.25*intensity)perfActions.mutate();
    else if(r<0.4*intensity)perfActions.shiftArp();
    else if(r<0.55)regenerateSection(currentSectionName);
    else if(r<0.65*intensity)perfActions.thinOut();
    else if(r<0.75*intensity)perfActions.thicken();
    else if(r<0.82)perfActions.reharmonize();
    // Section changes with lower probability
    if(rnd()<0.15*intensity){
      const sections=Object.keys(SECTIONS);
      triggerSection(pick(sections));
    }
    const nextDelay=(8+rnd()*16)*(1-intensity*0.4)*1000*(240/bpm);
    autopilotTimerRef.current=setTimeout(runAutopilot,nextDelay);
  },[autopilotIntensity,currentSectionName,genre,bpm]);

  useEffect(()=>{
    if(autopilot){
      setStatus('Autopilot engaged');
      const delay=(4+rnd()*8)*1000*(240/bpm);
      autopilotTimerRef.current=setTimeout(runAutopilot,delay);
    } else {
      if(autopilotTimerRef.current)clearTimeout(autopilotTimerRef.current);
      setStatus('Autopilot off');
    }
    return()=>{if(autopilotTimerRef.current)clearTimeout(autopilotTimerRef.current);};
  },[autopilot,runAutopilot]);

  // ─── SONG ARC ─────────────────────────────────────────────────────────────
  const startSongArc=()=>{
    const arc=pick(SONG_ARCS);
    setSongArc(arc);arcRef.current=arc;
    setArcIdx(0);arcIdxRef.current=0;
    barCountRef.current=0;
    setSongActive(true);songActiveRef.current=true;
    setCurrentSectionName(arc[0]);
    regenerateSection(arc[0]);
    setStatus(`Song arc started: ${arc.join(' → ')}`);
  };
  const stopSongArc=()=>{
    setSongActive(false);songActiveRef.current=false;
    setStatus('Song arc stopped');
  };

  // ─── UNDO/REDO ────────────────────────────────────────────────────────────
  const pushUndo=()=>{
    const snap={patterns:{...patternsRef.current},bassLine:[...bassRef.current],synthLine:[...synthRef.current]};
    undoStack.current=[snap,...undoStack.current.slice(0,UNDO-1)];
    setUndoLen(undoStack.current.length);
  };
  const undo=()=>{
    if(!undoStack.current.length)return;
    const snap=undoStack.current.shift();setUndoLen(undoStack.current.length);
    setPatterns(snap.patterns);setBassLine(snap.bassLine);setSynthLine(snap.synthLine);
    patternsRef.current=snap.patterns;bassRef.current=snap.bassLine;synthRef.current=snap.synthLine;
    setStatus('Undo');
  };

  // ─── SAVE/LOAD ────────────────────────────────────────────────────────────
  const serialize=()=>({
    v:2,genre,modeName,bpm,currentSectionName,grooveProfile,arpMode:arpModeRef.current,
    space,tone,noiseMix,drive,compress,bassFilter,synthFilter,drumDecay,bassSubAmt,fmIdx,
    master,swing,humanize,grooveAmt,projectName,polySynth,bassStack,bassPreset,synthPreset,drumPreset,performancePreset,
    patterns,bassLine,synthLine,laneLen,
  });
  const applySnap=(snap)=>{
    if(!snap||snap.v!==2)return;
    stopClock();
    setGenre(snap.genre||'techno');setModeName(snap.modeName||'minor');setBpm(snap.bpm||128);bpmRef.current=snap.bpm||128;
    setCurrentSectionName(snap.currentSectionName||'groove');setGrooveProfile(snap.grooveProfile||'steady');
    setArpMode(snap.arpMode||'up');arpModeRef.current=snap.arpMode||'up';
    setSpace(snap.space??0.3);setTone(snap.tone??0.7);setNoiseMix(snap.noiseMix??0.2);setDrive(snap.drive??0.1);
    setCompress(snap.compress??0.3);setBassFilter(snap.bassFilter??0.55);setSynthFilter(snap.synthFilter??0.65);
    setDrumDecay(snap.drumDecay??0.5);setBassSubAmt(snap.bassSubAmt??0.5);setFmIdx(snap.fmIdx??0.6);
    setMaster(snap.master??0.85);setSwing(snap.swing??0.03);setHumanize(snap.humanize??0.012);setGrooveAmt(snap.grooveAmt??0.65);setPolySynth(snap.polySynth??true);setBassStack(snap.bassStack??true);setBassPreset(snap.bassPreset??'sub_floor');setSynthPreset(snap.synthPreset??'velvet_pad');setDrumPreset(snap.drumPreset??'tight_punch');setPerformancePreset(snap.performancePreset??'club_night');
    if(snap.projectName)setProjectName(snap.projectName);
    if(snap.patterns){setPatterns(snap.patterns);patternsRef.current=snap.patterns;}
    if(snap.bassLine){setBassLine(snap.bassLine);bassRef.current=snap.bassLine;}
    if(snap.synthLine){setSynthLine(snap.synthLine);synthRef.current=snap.synthLine;}
    if(snap.laneLen){setLaneLen(snap.laneLen);laneLenRef.current=snap.laneLen;}
    setStatus('Scene loaded');
  };
  const saveScene=slot=>{setSavedScenes(p=>p.map((v,i)=>i===slot?{...serialize(),label:`S${slot+1} ${new Date().toLocaleTimeString()}`}:v));setStatus(`Scene ${slot+1} saved`);};
  const loadScene=slot=>{if(savedScenes[slot])applySnap(savedScenes[slot]);};
  const exportJSON=()=>{const b=new Blob([JSON.stringify(serialize(),null,2)],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`${projectName.replace(/\s+/g,'-').toLowerCase()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(u),500);setStatus('Exported');};
  const importRef=useRef(null);
  const importJSON=async e=>{const f=e.target.files?.[0];if(!f)return;try{const t=await f.text();applySnap(JSON.parse(t));}catch{setStatus('Import failed');}finally{e.target.value='';}};

  // ─── RECORDING ────────────────────────────────────────────────────────────
  const startRec=async()=>{
    await initAudio();const a=audioRef.current;if(!a||recState==='recording')return;
    const mimes=['audio/webm;codecs=opus','audio/webm','audio/mp4'];
    const mime=mimes.find(m=>MediaRecorder.isTypeSupported?.(m))||'';
    chunksRef.current=[];
    const rec=mime?new MediaRecorder(a.dest.stream,{mimeType:mime}):new MediaRecorder(a.dest.stream);
    recorderRef.current=rec;
    rec.ondataavailable=e=>{if(e.data?.size>0)chunksRef.current.push(e.data);};
    rec.onstop=()=>{
      const ft=mime||rec.mimeType||'audio/webm';const ext=ft.includes('mp4')?'m4a':'webm';
      const blob=new Blob(chunksRef.current,{type:ft});
      const url=URL.createObjectURL(blob);
      setRecordings(p=>[{url,name:`${projectName.replace(/\s+/g,'-')}-take-${p.length+1}.${ext}`,time:new Date().toLocaleTimeString()},...p.slice(0,7)]);
      setRecState('idle');setStatus('Take saved');
    };
    rec.start();setRecState('recording');setStatus('● REC');
  };
  const stopRec=()=>{if(recorderRef.current&&recState==='recording'){recorderRef.current.stop();setRecState('stopping');}};

  // ─── TAP TEMPO ────────────────────────────────────────────────────────────
  const tapTempo=()=>{
    const now=Date.now();
    setTapTimes(prev=>{
      const next=[...prev.filter(t=>now-t<3000),now];
      if(next.length>=2){const intervals=next.slice(1).map((t,i)=>t-next[i]);const avg=intervals.reduce((a,b)=>a+b,0)/intervals.length;const nb=clamp(Math.round(60000/avg),40,250);setBpm(nb);bpmRef.current=nb;setStatus(`TAP → ${nb} BPM`);}
      return next.slice(-6);
    });
  };

  const applyPartialPreset=(preset)=>{
    if(!preset)return;
    if(preset.genre&&preset.genre!==genre)newGenreSession(preset.genre);
    if(preset.bassMode){
      const next={...GENRES[genre],bassMode:preset.bassMode};
      GENRES[genre]=next;
    }
    if(preset.synthMode){
      const next={...GENRES[genre],synthMode:preset.synthMode};
      GENRES[genre]=next;
    }
    if(preset.space!==undefined)setSpace(preset.space);
    if(preset.tone!==undefined)setTone(preset.tone);
    if(preset.drive!==undefined)setDrive(preset.drive);
    if(preset.compress!==undefined)setCompress(preset.compress);
    if(preset.noiseMix!==undefined)setNoiseMix(preset.noiseMix);
    if(preset.drumDecay!==undefined)setDrumDecay(preset.drumDecay);
    if(preset.bassFilter!==undefined)setBassFilter(preset.bassFilter);
    if(preset.synthFilter!==undefined)setSynthFilter(preset.synthFilter);
    if(preset.bassSubAmt!==undefined)setBassSubAmt(preset.bassSubAmt);
    if(preset.fmIdx!==undefined){setFmIdx(preset.fmIdx);fmIdxRef.current=preset.fmIdx;}
    if(preset.polySynth!==undefined)setPolySynth(preset.polySynth);
    if(preset.bassStack!==undefined)setBassStack(preset.bassStack);
    if(preset.grooveAmt!==undefined){setGrooveAmt(preset.grooveAmt);grooveRef.current=preset.grooveAmt;}
    if(preset.swing!==undefined){setSwing(preset.swing);swingRef.current=preset.swing;}
  };

  const applyBassPreset=(key)=>{
    const preset=SOUND_PRESETS.bass[key];
    if(!preset)return;
    setBassPreset(key);
    applyPartialPreset({...preset});
    setStatus(`Bass preset — ${preset.label}`);
  };
  const applySynthPreset=(key)=>{
    const preset=SOUND_PRESETS.synth[key];
    if(!preset)return;
    setSynthPreset(key);
    applyPartialPreset({...preset});
    setStatus(`Synth preset — ${preset.label}`);
  };
  const applyDrumPreset=(key)=>{
    const preset=SOUND_PRESETS.drum[key];
    if(!preset)return;
    setDrumPreset(key);
    applyPartialPreset({...preset});
    setStatus(`Drum preset — ${preset.label}`);
  };
  const applyPerformancePreset=(key)=>{
    const preset=SOUND_PRESETS.performance[key];
    if(!preset)return;
    setPerformancePreset(key);
    applyPartialPreset({...preset});
    setStatus(`Performance preset — ${preset.label}`);
  };

  const clearPattern=()=>{
    pushUndo();
    const mode=MODES[modeName]||MODES.minor;
    const empty={kick:mkSteps(),snare:mkSteps(),hat:mkSteps(),bass:mkSteps(),synth:mkSteps()};
    setPatterns(empty);patternsRef.current=empty;
    const newBass=mkNotes(mode.b[0]||'C2');
    const newSynth=mkNotes(mode.s[0]||'C4');
    setBassLine(newBass);bassRef.current=newBass;
    setSynthLine(newSynth);synthRef.current=newSynth;
    setStatus('Pattern cleared');
  };

  // ─── STEP EDIT ────────────────────────────────────────────────────────────
  const toggleCell=(lane,idx)=>{
    pushUndo();
    setPatterns(p=>{const n={...p,[lane]:p[lane].map((s,i)=>i===idx?{...s,on:!s.on}:s)};patternsRef.current=n;return n;});
  };
  const setNote=(lane,idx,note)=>{
    if(lane==='bass')setBassLine(p=>{const n=[...p];n[idx]=note;bassRef.current=n;return n;});
    else setSynthLine(p=>{const n=[...p];n[idx]=note;synthRef.current=n;return n;});
  };

  // ─── MIDI ─────────────────────────────────────────────────────────────────
  useEffect(()=>{
    if(!navigator.requestMIDIAccess)return;
    navigator.requestMIDIAccess().then(m=>{midiRef.current=m;setMidiOk(true);}).catch(()=>{});
  },[]);

  // ─── KEYBOARD SHORTCUTS ───────────────────────────────────────────────────
  useEffect(()=>{
    const onKey=e=>{
      if(e.target.tagName==='INPUT')return;
      if(e.code==='Space'){e.preventDefault();togglePlay();}
      else if(e.code==='KeyA')perfActions.drop();
      else if(e.code==='KeyS')perfActions.break();
      else if(e.code==='KeyD')perfActions.build();
      else if(e.code==='KeyF')perfActions.groove();
      else if(e.code==='KeyG')perfActions.tension();
      else if(e.code==='KeyH')perfActions.fill();
      else if(e.code==='KeyM')perfActions.mutate();
      else if(e.code==='KeyR')regenerateSection(currentSectionName);
      else if(e.code==='KeyP')setAutopilot(v=>!v);
      else if(e.code==='KeyZ'&&(e.metaKey||e.ctrlKey))undo();
      else if(e.code==='KeyT')tapTempo();
    };
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[currentSectionName,genre]);

  // ─── VISUALIZER ───────────────────────────────────────────────────────────
  const vizRef=useRef(null);
  useEffect(()=>{
    let rafId;
    const draw=()=>{
      rafId=requestAnimationFrame(draw);
      const an=analyserRef.current;if(!an||!vizRef.current)return;
      const data=new Uint8Array(an.frequencyBinCount);
      an.getByteFrequencyData(data);setVizData(data);
      const canvas=vizRef.current;const ctx=canvas.getContext('2d');
      const W=canvas.width,H=canvas.height;
      ctx.clearRect(0,0,W,H);
      const gc=GENRE_CLR[genre]||'#ff4444';
      const barW=W/data.length;
      for(let i=0;i<data.length;i++){
        const v=(data[i]/255)*H;
        const alpha=0.3+v/H*0.7;
        ctx.fillStyle=`${gc}${Math.round(alpha*255).toString(16).padStart(2,'0')}`;
        ctx.fillRect(i*barW,H-v,barW-0.5,v);
      }
    };
    draw();
    return()=>cancelAnimationFrame(rafId);
  },[genre]);

  // ─── INIT ─────────────────────────────────────────────────────────────────
  useEffect(()=>{
    newGenreSession('techno');
    setTimeout(()=>{applyBassPreset('sub_floor');applySynthPreset('velvet_pad');applyDrumPreset('tight_punch');applyPerformancePreset('club_night');},0);
  },[]);

  // ─── RENDER HELPERS ───────────────────────────────────────────────────────
  const gc_=GENRE_CLR[genre]||'#ff4444';
  const visibleSteps=Array.from({length:PAGE},(_,i)=>page*PAGE+i);
  const [viewportWidth,setViewportWidth]=useState(typeof window!=='undefined'?window.innerWidth:1280);
  useEffect(()=>{
    const onResize=()=>setViewportWidth(window.innerWidth);
    window.addEventListener('resize',onResize);
    return()=>window.removeEventListener('resize',onResize);
  },[]);
  const isCompact=viewportWidth<1180;
  const isPhone=viewportWidth<820;

  // ─── UI ───────────────────────────────────────────────────────────────────
  return(
    <div style={{
      width:'100vw',height:'100dvh',background:'#060608',color:'#e8e8e8',
      fontFamily:"'Space Mono',monospace",display:'flex',flexDirection:'column',
      overflow:'hidden',userSelect:'none',position:'relative',
      boxSizing:'border-box',minWidth:0,
    }}>

      {/* ── SCANLINE OVERLAY ── */}
      <div style={{position:'fixed',inset:0,backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.08) 2px,rgba(0,0,0,0.08) 4px)',pointerEvents:'none',zIndex:999}}/>

      {/* ── TOP BAR ── */}
      <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:6,padding:isPhone?'8px':'6px 10px',borderBottom:'1px solid rgba(255,255,255,0.06)',flexShrink:0,minHeight:36,background:'rgba(0,0,0,0.4)',overflow:'hidden'}}>
        {/* Logo */}
        <div style={{fontSize:10,fontWeight:700,letterSpacing:'0.22em',color:gc_,borderRadius:3,padding:'2px 6px',border:`1px solid ${gc_}44`,whiteSpace:'nowrap'}}>
          CESIRA V2
        </div>

        {/* Project name */}
        <input value={projectName} onChange={e=>setProjectName(e.target.value)}
          style={{background:'transparent',border:'none',outline:'none',color:'rgba(255,255,255,0.96)',fontSize:10,fontFamily:'Space Mono,monospace',letterSpacing:'0.08em',width:isPhone?'100%':110,flex:isPhone?1:'0 0 auto',minWidth:isPhone?160:110}}/>

        {/* Genre selector */}
        <div style={{display:'flex',gap:2,flexShrink:0,flexWrap:'wrap',maxWidth:isPhone?'100%':'none'}}>
          {GENRE_NAMES.map(g=>(
            <button key={g} onClick={()=>newGenreSession(g)} style={{
              padding:'2px 5px',borderRadius:2,border:`1px solid ${genre===g?GENRE_CLR[g]:'rgba(255,255,255,0.07)'}`,
              background:genre===g?`${GENRE_CLR[g]}18`:'transparent',
              color:genre===g?GENRE_CLR[g]:'rgba(255,255,255,0.95)',
              fontSize:10,fontWeight:700,cursor:'pointer',letterSpacing:'0.1em',
              fontFamily:'Space Mono,monospace',textTransform:'uppercase',
              transition:'all 0.1s',
            }}>{g}</button>
          ))}
        </div>

        <div style={{flex:1}}/>

        {/* Visualizer */}
        {!isPhone&&<canvas ref={vizRef} width={96} height={18} style={{opacity:0.65,borderRadius:2}}/>}

        {/* BPM — proper control with +/- and slider */}
        <div style={{display:'flex',alignItems:'center',gap:2,background:'rgba(255,255,255,0.05)',borderRadius:4,padding:'2px 4px',border:'1px solid rgba(255,255,255,0.1)'}}>
          <button onClick={()=>{const v=clamp(bpm-5,40,250);setBpm(v);bpmRef.current=v;}} style={{width:16,height:16,borderRadius:2,border:'none',background:'rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.96)',fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Space Mono,monospace',lineHeight:1,flexShrink:0}}>−</button>
          <button onClick={()=>{const v=clamp(bpm-1,40,250);setBpm(v);bpmRef.current=v;}} style={{width:14,height:16,borderRadius:2,border:'none',background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.96)',fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Space Mono,monospace',lineHeight:1,flexShrink:0}}>‹</button>
          <div style={{textAlign:'center',minWidth:32}}>
            <div style={{fontSize:13,fontWeight:700,color:gc_,fontFamily:'Space Mono,monospace',lineHeight:1}}>{bpm}</div>
            <div style={{fontSize:9.5,color:'rgba(255,255,255,0.96)',letterSpacing:'0.1em'}}>BPM</div>
          </div>
          <button onClick={()=>{const v=clamp(bpm+1,40,250);setBpm(v);bpmRef.current=v;}} style={{width:14,height:16,borderRadius:2,border:'none',background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.96)',fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Space Mono,monospace',lineHeight:1,flexShrink:0}}>›</button>
          <button onClick={()=>{const v=clamp(bpm+5,40,250);setBpm(v);bpmRef.current=v;}} style={{width:16,height:16,borderRadius:2,border:'none',background:'rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.96)',fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Space Mono,monospace',lineHeight:1,flexShrink:0}}>+</button>
          <button onClick={tapTempo} style={{padding:'1px 5px',borderRadius:2,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'rgba(255,255,255,0.96)',fontSize:9.5,cursor:'pointer',fontFamily:'Space Mono,monospace',marginLeft:2}}>TAP</button>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:4,flexWrap:'wrap'}}>
          <button onClick={()=>setPolySynth(v=>!v)} style={{padding:'4px 7px',borderRadius:3,border:`1px solid ${polySynth?gc_:'rgba(255,255,255,0.1)'}`,background:polySynth?`${gc_}18`:'rgba(255,255,255,0.03)',color:polySynth?gc_:'rgba(255,255,255,0.97)',fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'Space Mono,monospace'}}>SYNTH POLY</button>
          <button onClick={()=>setBassStack(v=>!v)} style={{padding:'4px 7px',borderRadius:3,border:`1px solid ${bassStack?'#22d3ee':'rgba(255,255,255,0.1)'}`,background:bassStack?'rgba(34,211,238,0.12)':'rgba(255,255,255,0.03)',color:bassStack?'#22d3ee':'rgba(255,255,255,0.97)',fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'Space Mono,monospace'}}>BASS STACK</button>
          <button onClick={clearPattern} style={{padding:'4px 8px',borderRadius:3,border:'1px solid rgba(255,80,80,0.35)',background:'rgba(255,80,80,0.08)',color:'#ff8a8a',fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'Space Mono,monospace'}}>CLEAR</button>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:4,flexWrap:'wrap',minWidth:isPhone?'100%':'auto'}}>
          <PresetSelect label='BASS' value={bassPreset} options={SOUND_PRESETS.bass} onChange={applyBassPreset} accent='#22d3ee' />
          <PresetSelect label='SYNTH' value={synthPreset} options={SOUND_PRESETS.synth} onChange={applySynthPreset} accent={gc_} />
          <PresetSelect label='DRUM' value={drumPreset} options={SOUND_PRESETS.drum} onChange={applyDrumPreset} accent='#ffb347' />
          <PresetSelect label='PERF' value={performancePreset} options={SOUND_PRESETS.performance} onChange={applyPerformancePreset} accent='#7ee787' />
        </div>

        {/* Transport */}
        <button onClick={togglePlay} style={{
          padding:'4px 14px',borderRadius:3,border:'none',
          background:isPlaying?'#ff2244':'#00cc66',
          color:'#000',fontSize:10,fontWeight:700,cursor:'pointer',
          letterSpacing:'0.1em',fontFamily:'Space Mono,monospace',
          boxShadow:isPlaying?'0 0 12px #ff224466':'0 0 12px #00cc6666',
          transition:'all 0.1s',flexShrink:0,
        }}>{isPlaying?'■ STOP':'▶ PLAY'}</button>

        {/* Autopilot */}
        <button onClick={()=>setAutopilot(v=>!v)} style={{
          padding:'4px 8px',borderRadius:3,border:`1px solid ${autopilot?gc_:'rgba(255,255,255,0.1)'}`,
          background:autopilot?`${gc_}22`:'rgba(255,255,255,0.04)',
          color:autopilot?gc_:'rgba(255,255,255,0.38)',
          fontSize:10,fontWeight:700,cursor:'pointer',letterSpacing:'0.1em',fontFamily:'Space Mono,monospace',
          boxShadow:autopilot?`0 0 10px ${gc_}55`:'none',
          transition:'all 0.12s',flexShrink:0,
        }}>{autopilot?'◈ AUTO':'○ AUTO'}</button>

        {/* View toggle */}
        <div style={{display:'flex',gap:2,flexShrink:0}}>
          {['perform','studio','song'].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{
              padding:'2px 6px',borderRadius:2,border:`1px solid ${view===v?gc_:'rgba(255,255,255,0.08)'}`,
              background:view===v?`${gc_}18`:'transparent',
              color:view===v?gc_:'rgba(255,255,255,0.96)',
              fontSize:10,fontWeight:700,cursor:'pointer',letterSpacing:'0.08em',fontFamily:'Space Mono,monospace',
              textTransform:'uppercase',
            }}>{v}</button>
          ))}
        </div>

        {/* Status */}
        <div style={{fontSize:10,color:'rgba(255,255,255,0.96)',maxWidth:isPhone?'100%':100,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',letterSpacing:'0.05em',flex:isPhone?'1 1 100%':'0 1 auto'}}>
          {recState==='recording'&&<span style={{color:'#ff2244',marginRight:3}}>●</span>}{status}
        </div>
        <div style={{width:5,height:5,borderRadius:'50%',background:midiOk?'#00ff88':'rgba(255,255,255,0.12)',flexShrink:0}}/>
      </div>

      {/* ── CONTEXT BAR — always-visible musical state ── */}
      <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:8,padding:isPhone?'6px 10px':'3px 10px',background:'rgba(0,0,0,0.25)',borderBottom:'1px solid rgba(255,255,255,0.04)',flexShrink:0,minHeight:isPhone?40:20,overflow:'hidden'}}>
        <span style={{fontSize:9.5,color:'rgba(255,255,255,0.96)',letterSpacing:'0.12em',textTransform:'uppercase'}}>NOW PLAYING:</span>
        <span style={{fontSize:10,fontWeight:700,color:gc_,letterSpacing:'0.1em',textTransform:'uppercase'}}>{genre}</span>
        <span style={{color:'rgba(255,255,255,0.96)',fontSize:10}}>·</span>
        <span style={{fontSize:10,color:'rgba(255,255,255,0.96)',letterSpacing:'0.06em'}}>{currentSectionName}</span>
        <span style={{color:'rgba(255,255,255,0.96)',fontSize:10}}>·</span>
        <span style={{fontSize:10,color:'rgba(255,255,255,0.96)',letterSpacing:'0.06em'}}>{modeName}</span>
        <span style={{color:'rgba(255,255,255,0.96)',fontSize:10}}>·</span>
        <span style={{fontSize:10,color:'rgba(255,255,255,0.96)',letterSpacing:'0.06em'}}>arp:{arpMode}</span>
        <span style={{color:'rgba(255,255,255,0.96)',fontSize:10}}>·</span>
        <span style={{fontSize:10,color:'rgba(255,255,255,0.96)',letterSpacing:'0.06em'}}>poly:{polySynth?'3v':'mono'} / bass:{bassStack?'stack':'mono'}</span>
        <span style={{color:'rgba(255,255,255,0.96)',fontSize:10}}>·</span>
        <span style={{fontSize:10,color:isPlaying?'#00ff88':'rgba(255,255,255,0.95)',letterSpacing:'0.06em'}}>{isPlaying?'▶ RUNNING':'■ STOPPED'}</span>
        {autopilot&&<><span style={{color:'rgba(255,255,255,0.96)',fontSize:10}}>·</span><span style={{fontSize:10,color:gc_,letterSpacing:'0.06em'}}>◈ AUTOPILOT ON</span></>}
        {songActive&&<><span style={{color:'rgba(255,255,255,0.96)',fontSize:10}}>·</span><span style={{fontSize:10,color:'#ffaa00',letterSpacing:'0.06em'}}>ARC {arcIdx+1}/{songArc.length}</span></>}
        <div style={{flex:1}}/>
        {!isPhone&&<span style={{fontSize:10,color:'rgba(255,255,255,0.96)',letterSpacing:'0.08em'}}>SPACE=play · A=drop · S=break · D=build · F=groove · G=tension · M=mutate · R=regen · P=auto · T=tap</span>}
      </div>

      {/* ── VIEWS ── */}
      {view==='perform'&&<PerformView
        genre={genre} gc={gc_} isPlaying={isPlaying}
        currentSectionName={currentSectionName} laneVU={laneVU}
        patterns={patterns} bassLine={bassLine} synthLine={synthLine}
        laneLen={laneLen} step={step} page={page} setPage={setPage}
        activeNotes={activeNotes} arpeMode={arpMode} modeName={modeName}
        autopilot={autopilot} autopilotIntensity={autopilotIntensity}
        setAutopilotIntensity={setAutopilotIntensity}
        perfActions={perfActions} regenerateSection={regenerateSection}
        setNote={setNote}
        savedScenes={savedScenes} saveScene={saveScene} loadScene={loadScene}
        master={master} setMaster={setMaster}
        space={space} setSpace={setSpace}
        tone={tone} setTone={setTone}
        drive={drive} setDrive={setDrive}
        grooveAmt={grooveAmt} setGrooveAmt={setGrooveAmt}
        swing={swing} setSwing={setSwing}
        toggleCell={toggleCell}
        songArc={songArc} arcIdx={arcIdx} songActive={songActive}
        bassPreset={bassPreset} synthPreset={synthPreset} drumPreset={drumPreset} performancePreset={performancePreset}
        applyBassPreset={applyBassPreset} applySynthPreset={applySynthPreset} applyDrumPreset={applyDrumPreset} applyPerformancePreset={applyPerformancePreset}
        compact={isCompact} phone={isPhone}
      />}

      {view==='studio'&&<StudioView
        genre={genre} gc={gc_} patterns={patterns} bassLine={bassLine} synthLine={synthLine}
        laneLen={laneLen} step={step} page={page} setPage={setPage}
        toggleCell={toggleCell} setNote={setNote}
        modeName={modeName} laneVU={laneVU}
        space={space} setSpace={setSpace}
        tone={tone} setTone={setTone}
        noiseMix={noiseMix} setNoiseMix={setNoiseMix}
        drive={drive} setDrive={setDrive}
        compress={compress} setCompress={setCompress}
        bassFilter={bassFilter} setBassFilter={setBassFilter}
        synthFilter={synthFilter} setSynthFilter={setSynthFilter}
        drumDecay={drumDecay} setDrumDecay={setDrumDecay}
        bassSubAmt={bassSubAmt} setBassSubAmt={setBassSubAmt}
        fmIdx={fmIdx} setFmIdx={setFmIdx}
        master={master} setMaster={setMaster}
        swing={swing} setSwing={setSwing}
        humanize={humanize} setHumanize={setHumanize}
        grooveAmt={grooveAmt} setGrooveAmt={setGrooveAmt}
        grooveProfile={grooveProfile} setGrooveProfile={v=>{setGrooveProfile(v);grooveProfileRef.current=v;}}
        regenerateSection={regenerateSection}
        currentSectionName={currentSectionName}
        undoLen={undoLen} undo={undo}
        recState={recState} startRec={startRec} stopRec={stopRec}
        recordings={recordings}
        exportJSON={exportJSON} importRef={importRef} importJSON={importJSON}
        savedScenes={savedScenes} saveScene={saveScene} loadScene={loadScene}
        projectName={projectName} setProjectName={setProjectName}
        clearPattern={clearPattern} polySynth={polySynth} setPolySynth={setPolySynth} bassStack={bassStack} setBassStack={setBassStack}
        bassPreset={bassPreset} synthPreset={synthPreset} drumPreset={drumPreset} performancePreset={performancePreset}
        applyBassPreset={applyBassPreset} applySynthPreset={applySynthPreset} applyDrumPreset={applyDrumPreset} applyPerformancePreset={applyPerformancePreset}
        compact={isCompact} phone={isPhone}
      />}

      {view==='song'&&<SongView
        genre={genre} gc={gc_}
        songArc={songArc} arcIdx={arcIdx} songActive={songActive}
        startSongArc={startSongArc} stopSongArc={stopSongArc}
        currentSectionName={currentSectionName}
        SONG_ARCS={SONG_ARCS} SECTIONS={SECTIONS}
        triggerSection={triggerSection}
        modeName={modeName} arpeMode={arpMode}
        bpm={bpm}
        compact={isCompact} phone={isPhone}
      />}

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PERFORM VIEW — full-screen live performance interface
// ─────────────────────────────────────────────────────────────────────────────
function PerformView({genre,gc,isPlaying,currentSectionName,laneVU,patterns,bassLine,synthLine,laneLen,step,page,setPage,activeNotes,arpeMode,modeName,autopilot,autopilotIntensity,setAutopilotIntensity,perfActions,regenerateSection,savedScenes,saveScene,loadScene,master,setMaster,space,setSpace,tone,setTone,drive,setDrive,grooveAmt,setGrooveAmt,swing,setSwing,toggleCell,songArc,arcIdx,songActive,setNote,bassPreset,synthPreset,drumPreset,performancePreset,applyBassPreset,applySynthPreset,applyDrumPreset,applyPerformancePreset,compact,phone}){
  const SECTION_COLORS={drop:'#ff2244',break:'#4488ff',build:'#ffaa00',groove:'#00cc66',tension:'#ff6622',fill:'#cc00ff',intro:'#44ffcc',outro:'#aaaaaa'};
  const sc=SECTION_COLORS[currentSectionName]||gc;
  const visibleStart=page*16,visibleEnd=Math.min(visibleStart+16,MAX_STEPS);
  const visIdx=Array.from({length:visibleEnd-visibleStart},(_,i)=>visibleStart+i);
  const SECTS=['drop','break','build','groove','tension','fill','intro','outro'];
  const shortcut={drop:'A',break:'S',build:'D',groove:'F',tension:'G',fill:'H'};

  return(
    <div style={{flex:1,display:'flex',flexDirection:compact?'column':'row',gap:6,padding:phone?'8px':'5px 7px 8px 7px',minHeight:0,overflowY:'auto',overflowX:'hidden'}}>

      {/* LEFT — Section triggers + autopilot */}
      <div style={{width:compact?'100%':118,display:'flex',flexDirection:'column',gap:3,flexShrink:0}}>
        {/* Section pads */}
        <div style={{fontSize:10,color:'rgba(255,255,255,0.96)',letterSpacing:'0.18em',marginBottom:1,textTransform:'uppercase'}}>SECTIONS</div>
        {SECTS.map(sec=>{
          const scl=SECTION_COLORS[sec]||'#ffffff';
          const isActive=currentSectionName===sec;
          return(
            <button key={sec} onClick={()=>perfActions[sec]?perfActions[sec]():null} style={{
              padding:'6px 6px',borderRadius:4,border:`1px solid ${isActive?scl:scl+'33'}`,
              background:isActive?`${scl}22`:`${scl}08`,
              color:isActive?scl:`${scl}88`,
              fontSize:10,fontWeight:700,cursor:'pointer',
              fontFamily:'Space Mono,monospace',letterSpacing:'0.1em',
              textTransform:'uppercase',transition:'all 0.08s',
              boxShadow:isActive?`0 0 8px ${scl}44`:'none',
              display:'flex',justifyContent:'space-between',alignItems:'center',
            }}>
              <span>{sec}</span>
              {shortcut[sec]&&<span style={{fontSize:10,opacity:0.4}}>[{shortcut[sec]}]</span>}
            </button>
          );
        })}

        {/* Actions */}
        <div style={{fontSize:10,color:'rgba(255,255,255,0.96)',letterSpacing:'0.18em',marginTop:3,textTransform:'uppercase'}}>ACTIONS</div>
        {[
          {label:'MUTATE',fn:perfActions.mutate,key:'M',tip:'flip drum hits'},
          {label:'THIN',fn:perfActions.thinOut,tip:'sparse out'},
          {label:'THICKEN',fn:perfActions.thicken,tip:'add hits'},
          {label:'REHARM',fn:perfActions.reharmonize,tip:'new chords'},
          {label:'ARP→',fn:perfActions.shiftArp,tip:'change pattern'},
          {label:'REGEN',fn:()=>regenerateSection(currentSectionName),key:'R',tip:'full rebuild'},
          {label:'RND SYNTH',fn:perfActions.randomizeNotes,tip:'random notes'},
          {label:'RND BASS',fn:perfActions.randomizeBass,tip:'random bass'},
          {label:'NOTES ↑',fn:perfActions.shiftNotesUp,tip:'shift up'},
          {label:'NOTES ↓',fn:perfActions.shiftNotesDown,tip:'shift down'},
          {label:'CLEAR',fn:perfActions.clear,tip:'clear all lanes'},
        ].map(({label,fn,key,tip})=>(
          <button key={label} onClick={fn} title={tip} style={{
            padding:'4px 6px',borderRadius:3,border:'1px solid rgba(255,255,255,0.08)',
            background:'rgba(255,255,255,0.02)',color:'rgba(255,255,255,0.96)',
            fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'Space Mono,monospace',
            letterSpacing:'0.06em',display:'flex',justifyContent:'space-between',alignItems:'center',
          }}>
            <span>{label}</span>
            {key&&<span style={{fontSize:10,opacity:0.35}}>[{key}]</span>}
          </button>
        ))}
      </div>

      {/* CENTER — Grid + VU */}
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:4,minWidth:0,order:compact?1:2}}>

        {/* Section indicator + info bar */}
        <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:8,minHeight:22,flexShrink:0}}>
          <div style={{fontSize:13,fontWeight:700,color:sc,letterSpacing:'0.16em',textTransform:'uppercase',textShadow:`0 0 16px ${sc}55`}}>
            {currentSectionName.toUpperCase()}
          </div>
          <div style={{width:1,height:12,background:'rgba(255,255,255,0.08)'}}/>
          <span style={{fontSize:10,color:'rgba(255,255,255,0.96)',letterSpacing:'0.08em'}}>{genre} · {modeName} · arp:{arpeMode}</span>
          <div style={{flex:1}}/>
          {songArc.length>0&&(
            <div style={{display:'flex',gap:2,alignItems:'center'}}>
              {songArc.map((s,i)=>(
                <div key={i} style={{width:i===arcIdx?22:14,height:4,borderRadius:2,background:i===arcIdx?SECTION_COLORS[s]||gc:i<arcIdx?'rgba(255,255,255,0.92)':'rgba(255,255,255,0.05)',transition:'all 0.2s'}}/>
              ))}
            </div>
          )}
          <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{...navBtn,opacity:page===0?0.3:1,padding:'1px 5px',fontSize:10}}>‹</button>
          <span style={{fontSize:10,color:'rgba(255,255,255,0.96)',fontFamily:'Space Mono,monospace'}}>{page+1}/4</span>
          <button onClick={()=>setPage(p=>Math.min(3,p+1))} disabled={page===3} style={{...navBtn,opacity:page===3?0.3:1,padding:'1px 5px',fontSize:10}}>›</button>
        </div>

        {/* Lane rows with VU + grid */}
        {['kick','snare','hat','bass','synth'].map(lane=>{
          const lc=LANE_CLR[lane];
          const ll=laneLen[lane]||16;
          const vu=laneVU[lane]||0;
          return(
            <div key={lane} style={{flex:1,display:'flex',alignItems:'stretch',gap:5,minHeight:0}}>
              {/* Lane label + VU */}
              <div style={{width:38,flexShrink:0,display:'flex',flexDirection:'column',justifyContent:'center',gap:1}}>
                <span style={{fontSize:10,fontWeight:700,color:lc,letterSpacing:'0.14em',textTransform:'uppercase'}}>{lane}</span>
                <div style={{height:3,borderRadius:2,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${vu*100}%`,background:lc,borderRadius:2,transition:'width 0.04s',boxShadow:`0 0 4px ${lc}`}}/>
                </div>
                {(lane==='bass'||lane==='synth')&&(
                  <span style={{fontSize:9.5,color:'rgba(255,255,255,0.96)',letterSpacing:'0.04em'}}>{activeNotes[lane]}</span>
                )}
              </div>
              {/* Step grid */}
              <div style={{flex:1,display:'grid',gridTemplateColumns:`repeat(${visIdx.length},1fr)`,gap:1.5,alignItems:'stretch'}}>
                {visIdx.map(idx=>{
                  if(idx>=ll)return<div key={idx} style={{borderRadius:2,background:'rgba(255,255,255,0.015)',opacity:0.25}}/>;
                  const sd=patterns[lane][idx];
                  const on=sd.on,isActive=step===idx&&isPlaying;
                  const isTied=sd.tied;
                  const isBeat=idx%4===0,isBar=idx%16===0;
                  return(
                    <button key={idx} onClick={()=>toggleCell(lane,idx)} style={{
                      borderRadius:isTied?'1px 2px 2px 1px':'2px',
                      borderTop:`1px solid ${isActive?lc:isBar?`${lc}44`:isBeat?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.03)'}`,
                      borderRight:`1px solid ${isActive?lc:isBar?`${lc}44`:isBeat?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.03)'}`,
                      borderBottom:`1px solid ${isActive?lc:isBar?`${lc}44`:isBeat?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.03)'}`,
                      borderLeft:isTied?`2px solid ${lc}44`:`1px solid ${isActive?lc:isBar?`${lc}44`:isBeat?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.03)'}`,
                      background:isActive?`${lc}88`:isTied?`${lc}1a`:on?`${lc}${Math.round(clamp((sd.p||1),0.3,1)*255).toString(16).padStart(2,'0')}`:'rgba(255,255,255,0.02)',
                      boxShadow:isActive?`0 0 7px ${lc}77`:on&&!isTied?`0 0 2px ${lc}22`:'none',
                      cursor:'pointer',transition:'background 0.03s',
                    }}/>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Note info row */}
        <div style={{display:'flex',gap:1.5,flexShrink:0,height:12}}>
          {visIdx.map(idx=>{
            const bn=bassLine[idx],sn=synthLine[idx];
            const hasBass=patterns.bass[idx]?.on;
            const hasSynth=patterns.synth[idx]?.on;
            return(
              <div key={idx} style={{flex:1,textAlign:'center'}}>
                {(hasBass||hasSynth)&&<span style={{fontSize:6,color:'rgba(255,255,255,0.96)',fontFamily:'Space Mono,monospace'}}>{hasBass?bn.replace(/[0-9]/g,''):sn.replace(/[0-9]/g,'')}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT — Macro knobs + scenes */}
      <div style={{width:compact?'100%':118,display:'flex',flexDirection:'column',gap:4,flexShrink:0,order:compact?3:3}}>
        {/* Main macro faders */}
        <div style={{fontSize:10,color:'rgba(255,255,255,0.96)',letterSpacing:'0.18em',textTransform:'uppercase',marginBottom:1}}>MACROS</div>
        {[
          {label:'MASTER',v:master,s:setMaster,c:'#ffffff'},
          {label:'SPACE',v:space,s:setSpace,c:'#44ffcc'},
          {label:'TONE',v:tone,s:setTone,c:'#22d3ee'},
          {label:'DRIVE',v:drive,s:setDrive,c:'#ff8844'},
          {label:'GROOVE',v:grooveAmt,s:setGrooveAmt,c:'#ffdd00'},
          {label:'SWING',v:swing,s:setSwing,min:0,max:0.25,c:'#aa88ff'},
          {label:'AUTO INT',v:autopilotIntensity,s:setAutopilotIntensity,c:gc},
        ].map(({label,v,s,c,min=0,max=1})=>(
          <div key={label} style={{display:'flex',flexDirection:'column',gap:1}}>
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <span style={{fontSize:10,letterSpacing:'0.08em',color:'rgba(255,255,255,0.96)',textTransform:'uppercase'}}>{label}</span>
              <span style={{fontSize:10,color:c,fontFamily:'Space Mono,monospace'}}>{((v-min)/(max-min)*100).toFixed(0)}</span>
            </div>
            <input type="range" min={min} max={max} step={0.01} value={v} onChange={e=>s(Number(e.target.value))} style={{width:'100%',color:c,accentColor:c,height:12}}/>
          </div>
        ))}

        <div style={{flex:1}}/>

        {/* Scenes */}
        <div style={{fontSize:10,color:'rgba(255,255,255,0.96)',letterSpacing:'0.18em',textTransform:'uppercase',marginBottom:1}}>SCENES</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:2}}>
          {savedScenes.map((sc,i)=>(
            <div key={i} style={{display:'flex',flexDirection:'column',gap:1}}>
              <button onClick={()=>loadScene(i)} style={{
                padding:'4px 2px',borderRadius:2,border:`1px solid ${sc?gc+'44':'rgba(255,255,255,0.07)'}`,
                background:sc?`${gc}0e`:'rgba(255,255,255,0.015)',
                color:sc?gc:'rgba(255,255,255,0.94)',
                fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'Space Mono,monospace',
                textAlign:'center',
              }}>
                S{i+1}{sc?'◆':''}
              </button>
              <button onClick={()=>saveScene(i)} style={{padding:'1px',borderRadius:2,border:'1px solid rgba(255,255,255,0.05)',background:'rgba(255,255,255,0.015)',color:'rgba(255,255,255,0.96)',fontSize:9.5,cursor:'pointer',fontFamily:'Space Mono,monospace',textAlign:'center'}}>SAVE</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const navBtn={padding:'1px 5px',borderRadius:2,border:'1px solid rgba(255,255,255,0.09)',background:'rgba(255,255,255,0.03)',color:'rgba(255,255,255,0.96)',fontSize:10,cursor:'pointer',fontFamily:'Space Mono,monospace'};

function PresetSelect({label,value,options,onChange,accent='#ffffff',compact=false}){
  return(
    <label style={{display:'flex',flexDirection:'column',gap:2,minWidth:compact?112:124}}>
      <span style={{fontSize:10,color:'rgba(255,255,255,0.96)',letterSpacing:'0.12em',textTransform:'uppercase'}}>{label}</span>
      <select value={value} onChange={e=>onChange(e.target.value)} style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${accent}33`,color:accent,borderRadius:4,padding:compact?'4px 6px':'5px 7px',fontSize:10,fontFamily:'Space Mono,monospace',outline:'none'}}>
        {Object.entries(options).map(([key,preset])=><option key={key} value={key} style={{color:'#111',background:'#f2f2f2'}}>{preset.label}</option>)}
      </select>
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDIO VIEW — detailed editor
// ─────────────────────────────────────────────────────────────────────────────
function StudioView({genre,gc,patterns,bassLine,synthLine,laneLen,step,page,setPage,toggleCell,setNote,modeName,laneVU,space,setSpace,tone,setTone,noiseMix,setNoiseMix,drive,setDrive,compress,setCompress,bassFilter,setBassFilter,synthFilter,setSynthFilter,drumDecay,setDrumDecay,bassSubAmt,setBassSubAmt,fmIdx,setFmIdx,master,setMaster,swing,setSwing,humanize,setHumanize,grooveAmt,setGrooveAmt,grooveProfile,setGrooveProfile,regenerateSection,currentSectionName,undoLen,undo,recState,startRec,stopRec,recordings,exportJSON,importRef,importJSON,savedScenes,saveScene,loadScene,projectName,setProjectName,clearPattern,polySynth,setPolySynth,bassStack,setBassStack,bassPreset,synthPreset,drumPreset,performancePreset,applyBassPreset,applySynthPreset,applyDrumPreset,applyPerformancePreset,compact,phone}){
  const [tab,setTab]=useState('mixer');
  const [noteEditLane,setNoteEditLane]=useState('bass');
  const visibleStart=page*16,visibleEnd=Math.min(visibleStart+16,MAX_STEPS);
  const visIdx=Array.from({length:visibleEnd-visibleStart},(_,i)=>visibleStart+i);
  const mode=MODES[modeName]||MODES.minor;
  const notePool=noteEditLane==='bass'?mode.b:mode.s;

  return(
    <div style={{flex:1,display:'flex',flexDirection:compact?'column':'row',gap:5,padding:phone?'8px':'5px 7px 8px 7px',minHeight:0,overflowY:'auto',overflowX:'hidden'}}>

      {/* LEFT — Grid editor */}
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:3,minWidth:0}}>
        {/* Grid header */}
        <div style={{display:'flex',alignItems:'center',gap:5,height:20,flexShrink:0}}>
          <span style={{fontSize:10,color:'rgba(255,255,255,0.96)',letterSpacing:'0.1em'}}>{genre.toUpperCase()} · {modeName.toUpperCase()} · {currentSectionName.toUpperCase()}</span>
          <div style={{flex:1}}/>
          <button onClick={undo} disabled={undoLen===0} style={{...navBtn,opacity:undoLen>0?1:0.3,fontSize:10}}>↩ ({undoLen})</button>
          <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{...navBtn,opacity:page===0?0.3:1}}>‹</button>
          <span style={{fontSize:10,color:'rgba(255,255,255,0.96)',fontFamily:'Space Mono,monospace'}}>pg {page+1}/4</span>
          <button onClick={()=>setPage(p=>Math.min(3,p+1))} disabled={page===3} style={{...navBtn,opacity:page===3?0.3:1}}>›</button>
        </div>

        {/* Lane grids */}
        {['kick','snare','hat','bass','synth'].map(lane=>{
          const lc=LANE_CLR[lane];const ll=laneLen[lane]||16;const vu=laneVU[lane]||0;
          return(
            <div key={lane} style={{flex:1,display:'flex',alignItems:'stretch',gap:4,minHeight:0}}>
              <div style={{width:36,flexShrink:0,display:'flex',flexDirection:'column',justifyContent:'center',gap:1}}>
                <span style={{fontSize:10,fontWeight:700,color:lc,letterSpacing:'0.12em',textTransform:'uppercase'}}>{lane}</span>
                <div style={{height:2,borderRadius:1,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${vu*100}%`,background:lc,borderRadius:1,transition:'width 0.04s'}}/>
                </div>
              </div>
              <div style={{flex:1,display:'grid',gridTemplateColumns:`repeat(${visIdx.length},1fr)`,gap:1.5,alignItems:'stretch'}}>
                {visIdx.map(idx=>{
                  if(idx>=ll)return<div key={idx} style={{borderRadius:2,background:'rgba(255,255,255,0.015)',opacity:0.4}}/>;
                  const sd=patterns[lane][idx];const on=sd.on,isActive=step===idx;
                  const isBeat=idx%4===0,isBar=idx%16===0;
                  return(
                    <button key={idx} onClick={()=>toggleCell(lane,idx)} style={{
                      borderRadius:2,border:`1px solid ${isActive?lc:isBar?`${lc}38`:isBeat?'rgba(255,255,255,0.07)':'rgba(255,255,255,0.03)'}`,
                      background:isActive?`${lc}77`:on?`${lc}66`:'rgba(255,255,255,0.02)',
                      cursor:'pointer',transition:'background 0.03s',
                    }}/>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Note editor row */}
        <div style={{flexShrink:0,borderTop:'1px solid rgba(255,255,255,0.05)',paddingTop:4}}>
          <div style={{display:'flex',gap:4,marginBottom:3,alignItems:'center'}}>
            <span style={{fontSize:10,color:'rgba(255,255,255,0.96)',letterSpacing:'0.12em'}}>NOTES</span>
            {['bass','synth'].map(l=>(
              <button key={l} onClick={()=>setNoteEditLane(l)} style={{...navBtn,border:`1px solid ${noteEditLane===l?LANE_CLR[l]:'rgba(255,255,255,0.1)'}`,color:noteEditLane===l?LANE_CLR[l]:'rgba(255,255,255,0.97)',fontSize:10}}>{l}</button>
            ))}
          </div>
          <div style={{display:'grid',gridTemplateColumns:`repeat(${visIdx.length},1fr)`,gap:1.5}}>
            {visIdx.map(idx=>{
              const lc=LANE_CLR[noteEditLane];
              const isOn=noteEditLane==='bass'?patterns.bass[idx]?.on:patterns.synth[idx]?.on;
              const curNote=noteEditLane==='bass'?bassLine[idx]:synthLine[idx];
              const cur=notePool.indexOf(curNote);
              return(
                <div key={idx} style={{opacity:isOn?1:0.2}}>
                  <button disabled={!isOn} onClick={()=>{if(!isOn)return;const next=notePool[(cur+1)%notePool.length];setNote(noteEditLane,idx,next);}}
                    style={{width:'100%',padding:'2px 0',borderRadius:2,border:`1px solid ${isOn?lc+'44':'rgba(255,255,255,0.04)'}`,background:isOn?`${lc}1a`:'rgba(255,255,255,0.01)',color:isOn?lc:'rgba(255,255,255,0.94)',fontSize:10,cursor:isOn?'pointer':'default',fontFamily:'Space Mono,monospace',textAlign:'center'}}>
                    {curNote||'—'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RIGHT — Controls */}
      <div style={{width:compact?'100%':178,display:'flex',flexDirection:'column',gap:0,flexShrink:0,borderLeft:compact?'none':'1px solid rgba(255,255,255,0.05)',borderTop:compact?'1px solid rgba(255,255,255,0.05)':'none'}}>
        {/* Tabs */}
        <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:4,alignItems:'flex-end'}}>
          <PresetSelect label='BASS' value={bassPreset} options={SOUND_PRESETS.bass} onChange={applyBassPreset} accent='#22d3ee' compact />
          <PresetSelect label='SYNTH' value={synthPreset} options={SOUND_PRESETS.synth} onChange={applySynthPreset} accent={gc} compact />
          <PresetSelect label='DRUM' value={drumPreset} options={SOUND_PRESETS.drum} onChange={applyDrumPreset} accent='#ffb347' compact />
          <PresetSelect label='PERF' value={performancePreset} options={SOUND_PRESETS.performance} onChange={applyPerformancePreset} accent='#7ee787' compact />
          <button onClick={clearPattern} style={{padding:'4px 8px',borderRadius:3,border:'1px solid rgba(255,80,80,0.3)',background:'rgba(255,80,80,0.08)',color:'#ff8a8a',fontSize:10,cursor:'pointer',fontFamily:'Space Mono,monospace'}}>CLEAR</button><button onClick={()=>setPolySynth(v=>!v)} style={{padding:'4px 8px',borderRadius:3,border:`1px solid ${polySynth?gc:'rgba(255,255,255,0.08)'}`,background:polySynth?`${gc}18`:'rgba(255,255,255,0.03)',color:polySynth?gc:'rgba(255,255,255,0.97)',fontSize:10,cursor:'pointer',fontFamily:'Space Mono,monospace'}}>SYNTH POLY</button><button onClick={()=>setBassStack(v=>!v)} style={{padding:'4px 8px',borderRadius:3,border:'1px solid rgba(34,211,238,0.25)',background:bassStack?'rgba(34,211,238,0.12)':'rgba(255,255,255,0.03)',color:bassStack?'#22d3ee':'rgba(255,255,255,0.97)',fontSize:10,cursor:'pointer',fontFamily:'Space Mono,monospace'}}>BASS STACK</button></div><div style={{display:'flex',borderBottom:'1px solid rgba(255,255,255,0.05)',flexShrink:0}}>
          {['mixer','synth','session'].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:'5px 0',fontSize:9.5,fontWeight:700,letterSpacing:'0.1em',border:'none',background:'transparent',color:tab===t?gc:'rgba(255,255,255,0.94)',cursor:'pointer',borderBottom:tab===t?`2px solid ${gc}`:'2px solid transparent',textTransform:'uppercase',fontFamily:'Space Mono,monospace',transition:'color 0.1s'}}>{t}</button>
          ))}
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'6px 7px',display:'flex',flexDirection:'column',gap:4}}>

          {tab==='mixer'&&<>
            {[
              {l:'MASTER',v:master,s:setMaster,c:'#ffffff'},
              {l:'SPACE',v:space,s:setSpace,c:'#44ffcc'},
              {l:'TONE',v:tone,s:setTone,c:'#22d3ee'},
              {l:'NOISE',v:noiseMix,s:setNoiseMix,c:'#aaaaaa'},
              {l:'DRIVE',v:drive,s:setDrive,c:'#ff8844'},
              {l:'COMPRESS',v:compress,s:setCompress,c:'#ffaa44'},
              {l:'BASS FILTER',v:bassFilter,s:setBassFilter,c:LANE_CLR.bass},
              {l:'SYNTH FILTER',v:synthFilter,s:setSynthFilter,c:LANE_CLR.synth},
              {l:'DRUM DECAY',v:drumDecay,s:setDrumDecay,c:LANE_CLR.kick},
              {l:'BASS SUB',v:bassSubAmt,s:setBassSubAmt,c:LANE_CLR.bass},
              {l:'SWING',v:swing,s:setSwing,min:0,max:0.25,c:'#aa88ff'},
              {l:'HUMANIZE',v:humanize,s:setHumanize,min:0,max:0.05,c:'#88aaff'},
              {l:'GROOVE AMT',v:grooveAmt,s:setGrooveAmt,c:'#ffdd00'},
              {l:'FM INDEX',v:fmIdx,s:setFmIdx,min:0,max:3,c:'#cc88ff'},
            ].map(({l,v,s,c,min=0,max=1})=>(
              <div key={l}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:0}}>
                  <span style={{fontSize:10,letterSpacing:'0.08em',color:'rgba(255,255,255,0.96)',textTransform:'uppercase'}}>{l}</span>
                  <span style={{fontSize:10,color:c,fontFamily:'Space Mono,monospace'}}>{((v-min)/(max-min)*100).toFixed(0)}</span>
                </div>
                <input type="range" min={min} max={max} step={(max-min)/200} value={v} onChange={e=>s(Number(e.target.value))} style={{width:'100%',accentColor:c,color:c,height:12}}/>
              </div>
            ))}
            <div>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.96)',letterSpacing:'0.1em',marginBottom:2,textTransform:'uppercase'}}>GROOVE PROFILE</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:2}}>
                {['steady','broken','bunker','float'].map(gp=>(
                  <button key={gp} onClick={()=>setGrooveProfile(gp)} style={{
                    padding:'3px',borderRadius:2,border:`1px solid ${grooveProfile===gp?gc:'rgba(255,255,255,0.08)'}`,
                    background:grooveProfile===gp?`${gc}18`:'rgba(255,255,255,0.02)',
                    color:grooveProfile===gp?gc:'rgba(255,255,255,0.96)',
                    fontSize:9.5,cursor:'pointer',fontFamily:'Space Mono,monospace',letterSpacing:'0.06em',textTransform:'uppercase',
                  }}>{gp}</button>
                ))}
              </div>
            </div>
          </>}

          {tab==='synth'&&<>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.96)',letterSpacing:'0.1em',marginBottom:2,textTransform:'uppercase'}}>SECTION GENERATOR</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:2}}>
              {Object.keys(SECTIONS).map(sec=>(
                <button key={sec} onClick={()=>regenerateSection(sec)} style={{
                  padding:'5px 3px',borderRadius:2,border:`1px solid ${currentSectionName===sec?gc:'rgba(255,255,255,0.08)'}`,
                  background:currentSectionName===sec?`${gc}18`:'rgba(255,255,255,0.02)',
                  color:currentSectionName===sec?gc:'rgba(255,255,255,0.97)',
                  fontSize:10,cursor:'pointer',fontFamily:'Space Mono,monospace',letterSpacing:'0.05em',textTransform:'uppercase',
                }}>{sec}</button>
              ))}
            </div>
            <div style={{marginTop:3,fontSize:9.5,color:'rgba(255,255,255,0.96)',lineHeight:1.5}}>
              Click to regenerate with that section's feel.
            </div>
          </>}

          {tab==='session'&&<>
            {/* Recording */}
            <button onClick={recState==='idle'?startRec:stopRec} style={{
              padding:'7px',borderRadius:3,border:`1px solid ${recState==='recording'?'#ff2244':'rgba(255,255,255,0.12)'}`,
              background:recState==='recording'?'rgba(255,34,68,0.12)':'rgba(255,255,255,0.03)',
              color:recState==='recording'?'#ff2244':'rgba(255,255,255,0.55)',
              fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'Space Mono,monospace',letterSpacing:'0.1em',textAlign:'center',
            }}>{recState==='recording'?'■ STOP REC':'● REC'}</button>
            {recordings.map((r,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:3,padding:'3px 5px',borderRadius:3,background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.05)'}}>
                <audio src={r.url} controls style={{flex:1,height:22,filter:'invert(1)',opacity:0.65}}/>
                <a href={r.url} download={r.name} style={{color:gc,fontSize:9.5,textDecoration:'none',fontFamily:'Space Mono,monospace'}}>DL</a>
              </div>
            ))}

            <div style={{height:1,background:'rgba(255,255,255,0.06)',margin:'4px 0'}}/>

            {/* Scenes */}
            <div style={{fontSize:10,color:'rgba(255,255,255,0.96)',letterSpacing:'0.12em',marginBottom:2,textTransform:'uppercase'}}>SCENES (6)</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:3}}>
              {savedScenes.map((sc,i)=>(
                <div key={i} style={{display:'flex',flexDirection:'column',gap:1}}>
                  <button onClick={()=>loadScene(i)} style={{
                    padding:'5px',borderRadius:3,border:`1px solid ${sc?gc+'44':'rgba(255,255,255,0.08)'}`,
                    background:sc?`${gc}0d`:'rgba(255,255,255,0.02)',
                    color:sc?gc:'rgba(255,255,255,0.95)',
                    fontSize:10,cursor:'pointer',fontFamily:'Space Mono,monospace',textAlign:'center',
                  }}>S{i+1}{sc?` ◆`:''}</button>
                  <button onClick={()=>saveScene(i)} style={{padding:'2px',borderRadius:2,border:'1px solid rgba(255,255,255,0.07)',background:'rgba(255,255,255,0.02)',color:'rgba(255,255,255,0.96)',fontSize:10,cursor:'pointer',fontFamily:'Space Mono,monospace',textAlign:'center'}}>SAVE</button>
                </div>
              ))}
            </div>

            <div style={{height:1,background:'rgba(255,255,255,0.06)',margin:'4px 0'}}/>

            {/* Export/Import */}
            <button onClick={exportJSON} style={{padding:'7px',borderRadius:3,border:`1px solid ${gc}44`,background:`${gc}0d`,color:gc,fontSize:10,cursor:'pointer',fontFamily:'Space Mono,monospace',letterSpacing:'0.1em',textAlign:'center',textTransform:'uppercase'}}>EXPORT JSON</button>
            <button onClick={()=>importRef.current?.click()} style={{padding:'7px',borderRadius:3,border:'1px solid rgba(255,255,255,0.12)',background:'rgba(255,255,255,0.03)',color:'rgba(255,255,255,0.96)',fontSize:10,cursor:'pointer',fontFamily:'Space Mono,monospace',letterSpacing:'0.1em',textAlign:'center',textTransform:'uppercase'}}>IMPORT JSON</button>
            <input ref={importRef} type="file" accept=".json" onChange={importJSON} style={{display:'none'}}/>

            <div style={{height:1,background:'rgba(255,255,255,0.06)',margin:'2px 0'}}/>
            <div style={{fontSize:9.5,color:'rgba(255,255,255,0.96)',lineHeight:1.7,letterSpacing:'0.06em'}}>
              SHORTCUTS<br/>
              SPACE = play/stop<br/>
              A=drop S=break D=build<br/>
              F=groove G=tension H=fill<br/>
              M=mutate R=regen P=autopilot<br/>
              T=tap tempo Z=undo
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SONG VIEW — arc composer and arrangement
// ─────────────────────────────────────────────────────────────────────────────
function SongView({genre,gc,songArc,arcIdx,songActive,startSongArc,stopSongArc,currentSectionName,SONG_ARCS,SECTIONS,triggerSection,modeName,arpeMode,bpm,compact,phone}){
  const SECTION_COLORS={drop:'#ff2244',break:'#4488ff',build:'#ffaa00',groove:'#00cc66',tension:'#ff6622',fill:'#cc00ff',intro:'#44ffcc',outro:'#aaaaaa'};
  const gd=GENRES[genre];

  return(
    <div style={{flex:1,display:'flex',flexDirection:compact?'column':'row',gap:8,padding:phone?'8px':'6px 12px 12px 12px',minHeight:0,overflowY:'auto',overflowX:'hidden'}}>

      {/* LEFT — Genre info + arc control */}
      <div style={{width:compact?'100%':260,display:'flex',flexDirection:'column',gap:8,flexShrink:0}}>
        {/* Genre card */}
        <div style={{padding:16,borderRadius:8,border:`1px solid ${gc}33`,background:`${gc}08`}}>
          <div style={{fontSize:18,fontWeight:700,color:gc,letterSpacing:'0.2em',textTransform:'uppercase',marginBottom:4}}>{genre}</div>
          <div style={{fontSize:10,color:'rgba(255,255,255,0.96)',letterSpacing:'0.08em',marginBottom:8}}>{gd.description}</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
            {[
              {l:'BPM',v:`${gd.bpm[0]}–${gd.bpm[1]}`},
              {l:'CURRENT',v:bpm},
              {l:'MODE',v:modeName},
              {l:'ARP',v:arpeMode},
              {l:'DENSITY',v:`${Math.round(gd.density*100)}%`},
              {l:'CHAOS',v:`${Math.round(gd.chaos*100)}%`},
              {l:'NOISE',v:gd.noiseColor},
              {l:'BASS',v:gd.bassMode},
            ].map(({l,v})=>(
              <div key={l}>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.96)',letterSpacing:'0.12em',textTransform:'uppercase'}}>{l}</div>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.96)',fontFamily:'Space Mono,monospace'}}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Arc control */}
        <button onClick={songActive?stopSongArc:startSongArc} style={{
          padding:'12px',borderRadius:6,border:`1px solid ${songActive?'#ff2244':gc}`,
          background:songActive?'rgba(255,34,68,0.12)':`${gc}18`,
          color:songActive?'#ff2244':gc,
          fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:'Space Mono,monospace',
          letterSpacing:'0.15em',textTransform:'uppercase',
          boxShadow:songActive?'0 0 16px rgba(255,34,68,0.3)':`0 0 16px ${gc}33`,
        }}>{songActive?'■ STOP ARC':'▶ START ARC'}</button>

        {songActive&&(
          <div style={{padding:10,borderRadius:6,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.02)'}}>
            <div style={{fontSize:10,color:'rgba(255,255,255,0.96)',letterSpacing:'0.12em',marginBottom:6,textTransform:'uppercase'}}>ARC PROGRESS</div>
            <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
              {songArc.map((s,i)=>{
                const sc=SECTION_COLORS[s]||'#ffffff';
                return(
                  <div key={i} style={{
                    padding:'4px 8px',borderRadius:3,
                    background:i===arcIdx?`${sc}33`:i<arcIdx?`${sc}11`:'rgba(255,255,255,0.03)',
                    border:`1px solid ${i===arcIdx?sc:i<arcIdx?`${sc}44`:'rgba(255,255,255,0.06)'}`,
                    color:i===arcIdx?sc:i<arcIdx?`${sc}88`:'rgba(255,255,255,0.95)',
                    fontSize:10,fontFamily:'Space Mono,monospace',fontWeight:700,
                    transition:'all 0.2s',
                  }}>{s}</div>
                );
              })}
            </div>
          </div>
        )}

        {/* Preset arcs */}
        <div style={{fontSize:10,color:'rgba(255,255,255,0.96)',letterSpacing:'0.15em',textTransform:'uppercase',marginTop:4}}>PRESET ARCS</div>
        {SONG_ARCS.map((arc,i)=>(
          <button key={i} onClick={()=>{}} style={{
            padding:'8px 10px',borderRadius:4,border:'1px solid rgba(255,255,255,0.08)',
            background:'rgba(255,255,255,0.02)',color:'rgba(255,255,255,0.96)',
            fontSize:10,cursor:'pointer',fontFamily:'Space Mono,monospace',textAlign:'left',
            letterSpacing:'0.04em',lineHeight:1.4,
          }}>
            {arc.join(' → ')}
          </button>
        ))}
      </div>

      {/* RIGHT — Section library + direct trigger */}
      <div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}>
        <div style={{fontSize:10,color:'rgba(255,255,255,0.96)',letterSpacing:'0.2em',textTransform:'uppercase'}}>SECTION LIBRARY — CLICK TO TRIGGER</div>
        <div style={{display:'grid',gridTemplateColumns:phone?'repeat(2,1fr)':'repeat(4,1fr)',gap:6}}>
          {Object.entries(SECTIONS).map(([name,data])=>{
            const sc=SECTION_COLORS[name]||'#ffffff';
            const isActive=currentSectionName===name;
            return(
              <button key={name} onClick={()=>triggerSection(name)} style={{
                padding:'18px 12px',borderRadius:6,border:`1px solid ${isActive?sc:sc+'33'}`,
                background:isActive?`${sc}18`:`${sc}06`,
                color:isActive?sc:`${sc}88`,
                cursor:'pointer',fontFamily:'Space Mono,monospace',
                textAlign:'left',transition:'all 0.1s',
                boxShadow:isActive?`0 0 16px ${sc}44`:'none',
              }}>
                <div style={{fontSize:13,fontWeight:700,letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:6}}>{name}</div>
                <div style={{fontSize:10,opacity:0.7,lineHeight:1.6}}>
                  {`k:${Math.round(data.kM*100)}% h:${Math.round(data.hM*100)}%`}<br/>
                  {`b:${Math.round(data.bM*100)}% sy:${Math.round(data.syM*100)}%`}<br/>
                  {`len:${data.lb}x vel:${data.vel}`}<br/>
                  {`${data.bars} bars`}
                </div>
              </button>
            );
          })}
        </div>

        {/* Current section info */}
        <div style={{padding:12,borderRadius:6,border:'1px solid rgba(255,255,255,0.06)',background:'rgba(255,255,255,0.02)',marginTop:4}}>
          <div style={{fontSize:10,color:'rgba(255,255,255,0.96)',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:6}}>CURRENT SESSION</div>
          <div style={{display:'grid',gridTemplateColumns:phone?'repeat(2,1fr)':'repeat(5,1fr)',gap:8}}>
            {[
              {l:'GENRE',v:genre},{l:'SECTION',v:currentSectionName},{l:'MODE',v:modeName},
              {l:'ARP',v:arpeMode},{l:'STATUS',v:songActive?`arc[${arcIdx+1}/${songArc.length}]`:'manual'},
            ].map(({l,v})=>(
              <div key={l}>
                <div style={{fontSize:10,color:'rgba(255,255,255,0.96)',letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:2}}>{l}</div>
                <div style={{fontSize:10,color:gc,fontFamily:'Space Mono,monospace',fontWeight:700}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

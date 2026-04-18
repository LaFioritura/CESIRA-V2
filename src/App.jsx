import React,{useCallback,useEffect,useRef,useState}from'react';

// ─── CESIRA V4 — Techno Intelligence Engine ───────────────────────────────────
const MAX_STEPS=64,PAGE=16,SCHED=0.14,LOOK=20,UNDO=32;
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const rnd=()=>Math.random();
const pick=a=>a[Math.floor(rnd()*a.length)];
const lerp=(a,b,t)=>a+(b-a)*t;

// ─── TECHNO SUBFAMILY DNA ─────────────────────────────────────────────────────
// Each is a distinct techno style with unique sonic signature
const GENRES={
  // BUNKER: Berlin warehouse, concrete walls, heavy compression, no mercy
  bunker:{
    label:'BUNKER',bpm:[132,140],kick:'every4',swing:0.0,
    kickFreq:58,kickEnd:28,kickDecay:0.28,kickDist:0.35,kickSub:0.9,
    noiseColor:'brown',modes:['phrygian'],density:0.82,chaos:0.22,
    bassMode:'fold',synthMode:'lead',fxProfile:{drive:0.55,space:0.18,tone:0.38},
    hatPattern:'16th',hatDecay:0.04,snareFilter:1200,
    grooveDefault:'bunker',description:'Berlin warehouse concrete',
    bassScale:'phrygian_ostinato',synthRole:'texture',
    tension:0.8,energy:0.9,
  },
  // DETROIT: Soulful, jazzy, warm analog, chord stabs, syncopated
  detroit:{
    label:'DETROIT',bpm:[128,135],kick:'every4',swing:0.04,
    kickFreq:72,kickEnd:38,kickDecay:0.22,kickDist:0.12,kickSub:0.65,
    noiseColor:'pink',modes:['minor','dorian'],density:0.62,chaos:0.32,
    bassMode:'sub',synthMode:'pad',fxProfile:{drive:0.1,space:0.48,tone:0.72},
    hatPattern:'offbeat',hatDecay:0.06,snareFilter:1800,
    grooveDefault:'steady',description:'Detroit soul & machinery',
    bassScale:'walking',synthRole:'chords',
    tension:0.4,energy:0.6,
  },
  // ACID: 303 squeal, resonance maxed, filter sweeps, obsessive repetition
  acid:{
    label:'ACID',bpm:[128,138],kick:'every4',swing:0.05,
    kickFreq:80,kickEnd:32,kickDecay:0.18,kickDist:0.2,kickSub:0.5,
    noiseColor:'white',modes:['phrygian','minor'],density:0.72,chaos:0.68,
    bassMode:'acid303',synthMode:'acid_lead',fxProfile:{drive:0.48,space:0.28,tone:0.42},
    hatPattern:'16th',hatDecay:0.035,snareFilter:1600,
    grooveDefault:'broken',description:'303 resonant acid squelch',
    bassScale:'chromatic_ostinato',synthRole:'lead',
    tension:0.7,energy:0.75,
  },
  // MINIMAL: Hypnotic, sparse, micro-variations, long sections, Richie Hawtin
  minimal:{
    label:'MINIMAL',bpm:[130,136],kick:'every4',swing:0.02,
    kickFreq:64,kickEnd:30,kickDecay:0.20,kickDist:0.08,kickSub:0.7,
    noiseColor:'pink',modes:['phrygian','minor'],density:0.45,chaos:0.28,
    bassMode:'sub',synthMode:'minimal_stab',fxProfile:{drive:0.08,space:0.32,tone:0.55},
    hatPattern:'16th',hatDecay:0.028,snareFilter:2000,
    grooveDefault:'steady',description:'Hypnotic minimal loop',
    bassScale:'minimal_ostinato',synthRole:'stab',
    tension:0.3,energy:0.45,
  },
  // INDUSTRIAL: EBM, noise, metallic, aggressive, TRST / Author & Punisher
  industrial:{
    label:'INDUSTRIAL',bpm:[134,148],kick:'every4',swing:0.0,
    kickFreq:52,kickEnd:22,kickDecay:0.32,kickDist:0.55,kickSub:0.85,
    noiseColor:'brown',modes:['chroma','phrygian'],density:0.88,chaos:0.72,
    bassMode:'fold',synthMode:'metal_lead',fxProfile:{drive:0.65,space:0.14,tone:0.28},
    hatPattern:'noise',hatDecay:0.05,snareFilter:900,
    grooveDefault:'bunker',description:'EBM industrial machinery',
    bassScale:'chromatic_power',synthRole:'noise_texture',
    tension:0.95,energy:1.0,
  },
  // HARD: Hard techno, schranz, distorted kick, fast hats, aggressive lead
  hard:{
    label:'HARD',bpm:[138,148],kick:'every4',swing:0.01,
    kickFreq:65,kickEnd:25,kickDecay:0.16,kickDist:0.45,kickSub:0.75,
    noiseColor:'white',modes:['phrygian','chroma'],density:0.78,chaos:0.45,
    bassMode:'grit',synthMode:'screech',fxProfile:{drive:0.55,space:0.12,tone:0.35},
    hatPattern:'16th',hatDecay:0.025,snareFilter:1400,
    grooveDefault:'bunker',description:'Hard schranz aggression',
    bassScale:'phrygian_ostinato',synthRole:'screech',
    tension:0.85,energy:0.95,
  },
  // DUB: Dub techno, spacy, delay-heavy, Basic Channel, foggy
  dub:{
    label:'DUB',bpm:[126,132],kick:'every4',swing:0.03,
    kickFreq:68,kickEnd:35,kickDecay:0.30,kickDist:0.06,kickSub:0.8,
    noiseColor:'pink',modes:['dorian','minor'],density:0.38,chaos:0.42,
    bassMode:'drone',synthMode:'dub_chord',fxProfile:{drive:0.04,space:0.85,tone:0.65},
    hatPattern:'sparse',hatDecay:0.08,snareFilter:2200,
    grooveDefault:'float',description:'Dub techno fog & depth',
    bassScale:'root_pedal',synthRole:'chords',
    tension:0.25,energy:0.35,
  },
  // HYPNOTIC: Long cycles, slowly evolving, Blawan / Paula Temple territory
  hypnotic:{
    label:'HYPNOTIC',bpm:[130,138],kick:'every4',swing:0.02,
    kickFreq:62,kickEnd:30,kickDecay:0.24,kickDist:0.18,kickSub:0.78,
    noiseColor:'brown',modes:['phrygian','minor'],density:0.58,chaos:0.38,
    bassMode:'fm',synthMode:'hypno_texture',fxProfile:{drive:0.22,space:0.55,tone:0.48},
    hatPattern:'16th',hatDecay:0.032,snareFilter:1500,
    grooveDefault:'steady',description:'Hypnotic evolving trance',
    bassScale:'modal_ostinato',synthRole:'texture',
    tension:0.55,energy:0.6,
  },
};
const GENRE_NAMES=Object.keys(GENRES);

// ─── MUSICAL THEORY — TECHNO EXTENDED ────────────────────────────────────────
const MODES={
  phrygian:{b:['C2','Db2','Eb2','F2','G2','Ab2','Bb2','C3','Db3','Eb3'],s:['C4','Db4','Eb4','F4','G4','Ab4','Bb4','C5','Db5','Eb5']},
  minor:   {b:['C2','D2','Eb2','F2','G2','Ab2','Bb2','C3','D3','Eb3'],  s:['C4','D4','Eb4','F4','G4','Ab4','Bb4','C5','D5','Eb5']},
  dorian:  {b:['C2','D2','Eb2','F2','G2','A2','Bb2','C3','D3','Eb3'],   s:['C4','D4','Eb4','F4','G4','A4','Bb4','C5','D5','Eb5']},
  chroma:  {b:['C2','Db2','D2','Eb2','E2','F2','G2','Ab2','A2','Bb2'],  s:['C4','Db4','D4','Eb4','E4','F4','G4','Ab4','A4','Bb4']},
};

// Techno chord progressions — real phrygian tension, not generic minor
const CHORD_PROGS={
  phrygian:[
    [{r:0,t:1,f:3},{r:1,t:3,f:5},{r:0,t:1,f:3},{r:1,t:3,f:5}], // i - II oscillation
    [{r:0,t:1,f:3},{r:0,t:1,f:3},{r:1,t:3,f:5},{r:1,t:3,f:5}], // static then shift
    [{r:0,t:1,f:3},{r:3,t:5,f:0},{r:1,t:3,f:5},{r:0,t:1,f:3}], // i-IV-II-i
  ],
  minor:[
    [{r:0,t:2,f:4},{r:5,t:0,f:2},{r:3,t:5,f:0},{r:4,t:0,f:2}],
    [{r:0,t:2,f:4},{r:0,t:2,f:4},{r:3,t:5,f:0},{r:3,t:5,f:0}], // static pairs
    [{r:0,t:2,f:4},{r:4,t:0,f:2},{r:0,t:2,f:4},{r:4,t:0,f:2}], // i-v alternation
  ],
  dorian:[
    [{r:0,t:2,f:4},{r:5,t:0,f:2},{r:3,t:5,f:0},{r:4,t:0,f:2}],
    [{r:0,t:2,f:4},{r:4,t:6,f:1},{r:0,t:2,f:4},{r:4,t:6,f:1}], // alternating
  ],
  chroma:[
    [{r:0,t:1,f:4},{r:3,t:6,f:1},{r:6,t:1,f:4},{r:3,t:6,f:1}],
    [{r:0,t:2,f:5},{r:1,t:4,f:7},{r:0,t:2,f:5},{r:1,t:4,f:7}],
  ],
};

// Song sections — techno-specific character
const SECTIONS={
  intro:   {kM:0.25,sM:0.1, hM:0.5, bM:0.4,syM:0.5,vel:'rise',  pb:0.42,lb:4,  bars:4},
  build:   {kM:0.75,sM:0.5, hM:1.1, bM:0.85,syM:0.7,vel:'rise',  pb:0.58,lb:1.5,bars:4},
  drop:    {kM:1.4, sM:1.2, hM:0.95,bM:1.3,syM:0.7,vel:'accent',pb:0.88,lb:0.8,bars:8},
  groove:  {kM:1.0, sM:1.0, hM:1.0, bM:1.0,syM:0.85,vel:'groove',pb:0.74,lb:1.2,bars:8},
  break:   {kM:0.05,sM:0.2, hM:0.15,bM:0.3,syM:1.6,vel:'flat',  pb:0.38,lb:5,  bars:4},
  tension: {kM:0.6, sM:0.8, hM:1.5, bM:1.1,syM:1.2,vel:'accent',pb:0.56,lb:1.5,bars:4},
  outro:   {kM:0.35,sM:0.2, hM:0.25,bM:0.25,syM:0.35,vel:'fall', pb:0.32,lb:3,  bars:4},
  fill:    {kM:1.8, sM:1.6, hM:0.5, bM:0.6,syM:0.3,vel:'accent',pb:0.78,lb:0.5,bars:2},
  peak:    {kM:1.5, sM:1.3, hM:1.2, bM:1.4,syM:1.0,vel:'accent',pb:0.92,lb:0.8,bars:4},
};

// DJ-style arcs — build narrative tension over a set
const SONG_ARCS=[
  ['intro','build','drop','groove','groove','break','tension','drop','groove','outro'],
  ['intro','groove','build','drop','groove','break','build','peak','drop','outro'],
  ['build','drop','groove','tension','fill','drop','groove','break','build','drop','outro'],
  ['intro','tension','build','drop','groove','groove','break','drop','outro'],
  ['groove','groove','tension','drop','break','tension','drop','peak','groove','outro'],
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
  C4:261.63,Db4:277.18,D4:293.66,Eb4:311.13,E4:329.63,F4:349.23,'F#4':370,G4:392,Ab4:415.3,A4:440,Bb4:466.16,B4:493.88,
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
  const parsed=parseNoteName(note);if(!parsed)return note;
  const idx=CHROMA.indexOf(parsed.name);if(idx===-1)return note;
  const abs=parsed.oct*12+idx+semitones;
  return`${CHROMA[((abs%12)+12)%12]}${Math.floor(abs/12)}`;
};
const mkSteps=()=>Array.from({length:MAX_STEPS},()=>({on:false,p:1,v:1,l:1}));
const mkNotes=(d='C2')=>Array.from({length:MAX_STEPS},()=>d);

// ─── INTELLIGENT MUSIC ENGINE ─────────────────────────────────────────────────
function chordNotes(chord,pool){
  const n=pool.length;
  return[pool[chord.r%n],pool[chord.t%n],pool[chord.f%n]].filter(Boolean);
}

// Smart voice leading — techno basses prefer stepwise motion and repeated notes
function voiceLead(cur,pool,style='techno'){
  if(!pool.length)return cur;
  const i=pool.indexOf(cur);
  if(i===-1)return pool[0];
  const r=rnd();
  if(style==='techno'){
    // Techno bass: heavy repetition, occasional semitone movement
    if(r<0.45)return cur; // repeat — most common in techno
    if(r<0.65)return pool[Math.min(i+1,pool.length-1)]; // step up
    if(r<0.80)return pool[Math.max(i-1,0)]; // step down
    return pool[clamp(i+(rnd()<0.5?2:-2),0,pool.length-1)];
  }
  // Default
  if(r<0.5)return pool[Math.min(i+1,pool.length-1)];
  if(r<0.78)return pool[Math.max(i-1,0)];
  return pool[clamp(i+(rnd()<0.5?2:-2),0,pool.length-1)];
}

function velCurve(type,i,total,pw){
  const t=i/total;
  switch(type){
    case'rise':   return clamp(0.28+t*0.72*pw,0.2,1);
    case'fall':   return clamp(0.95-t*0.65,0.12,1);
    case'accent': return i%4===0?clamp(0.88+pw*0.12,0.65,1):clamp(0.42+pw*0.26,0.2,0.78);
    case'groove': return i%8===0?0.96:i%4===0?0.78:i%2===0?0.58:0.38+rnd()*0.2;
    case'flat':   return clamp(0.52+pw*0.2,0.35,0.78);
    default:      return clamp(0.42+pw*0.52,0.25,1);
  }
}

// ─── TECHNO BASS LINE GENERATOR ───────────────────────────────────────────────
// Real techno bass: ostinato patterns, semitone tension, repetition is the point
function buildTechnoBassLine(pool,chordProg,steps,bassScale,chaos,lenBias){
  const line=mkNotes(pool[0]);
  const lengths=Array(steps).fill(1);
  const chordLen=Math.max(1,Math.floor(steps/4));

  // Choose root from pool — techno usually stays on one or two notes
  const root=pool[0];
  const second=pool[1]||pool[0];
  const fifth=pool[Math.min(4,pool.length-1)];

  if(bassScale==='phrygian_ostinato'||bassScale==='minimal_ostinato'){
    // Classic techno: root ostinato with occasional neighbor note tension
    for(let i=0;i<steps;i++){
      const r=rnd();
      const ci=Math.floor(i/chordLen)%chordProg.length;
      const cn=chordNotes(chordProg[ci],pool);
      if(r<0.55)line[i]=root;
      else if(r<0.72)line[i]=second;
      else if(r<0.84)line[i]=cn[0]||root;
      else if(r<0.92)line[i]=fifth;
      else line[i]=pool[Math.floor(rnd()*Math.min(4,pool.length))];
      // lengths — techno bass often has 1-step punchy notes
      const lr=rnd();
      if(lr<0.55)lengths[i]=lenBias*0.8;
      else if(lr<0.78)lengths[i]=lenBias*1.5;
      else if(lr<0.90)lengths[i]=lenBias*2;
      else lengths[i]=lenBias*0.5;
      lengths[i]=Math.min(lengths[i],6);
    }
  } else if(bassScale==='chromatic_ostinato'||bassScale==='acid303'){
    // Acid 303 style: chromatic neighbor motion, lots of slides
    let last=root;
    for(let i=0;i<steps;i++){
      const r=rnd();
      const neighbors=[last,transposeNote(last,1),transposeNote(last,-1),transposeNote(last,2),root];
      if(r<0.38)line[i]=last; // hold
      else if(r<0.60)line[i]=pool[0]; // return to root
      else if(r<0.78)line[i]=neighbors[Math.floor(rnd()*3)+1];
      else{const ci=Math.floor(i/chordLen)%chordProg.length;line[i]=chordNotes(chordProg[ci],pool)[0]||root;}
      last=line[i];
      const lr=rnd();
      if(lr<0.4)lengths[i]=lenBias*0.6;
      else if(lr<0.7)lengths[i]=lenBias;
      else lengths[i]=lenBias*1.8;
      lengths[i]=Math.min(lengths[i],4);
    }
  } else if(bassScale==='walking'){
    // Detroit walking bass: voice lead through chord tones
    let last=root;
    for(let i=0;i<steps;i++){
      const ci=Math.floor(i/chordLen)%chordProg.length;
      const cn=chordNotes(chordProg[ci],pool);
      last=voiceLead(last,cn,'detroit');
      line[i]=last;
      lengths[i]=lenBias*(0.8+rnd()*0.4);
      lengths[i]=Math.min(lengths[i],5);
    }
  } else if(bassScale==='root_pedal'){
    // Dub: root pedal, barely moves, huge sustain
    for(let i=0;i<steps;i++){
      const r=rnd();
      if(r<0.72)line[i]=root;
      else if(r<0.88)line[i]=fifth;
      else line[i]=second;
      lengths[i]=lenBias*(1.5+rnd()*1.5);
      lengths[i]=Math.min(lengths[i],8);
    }
  } else if(bassScale==='chromatic_power'){
    // Industrial: low chromatic cluster, power and weight
    const cluster=[root,second,pool[Math.min(2,pool.length-1)]];
    for(let i=0;i<steps;i++){
      line[i]=cluster[Math.floor(rnd()*cluster.length)];
      lengths[i]=lenBias*(rnd()<0.6?0.7:1.2);
      lengths[i]=Math.min(lengths[i],3);
    }
  } else {
    // Fallback modal
    let last=root;
    for(let i=0;i<steps;i++){
      const ci=Math.floor(i/chordLen)%chordProg.length;
      const cn=chordNotes(chordProg[ci],pool);
      last=voiceLead(last,cn,'techno');
      line[i]=last;
      lengths[i]=lenBias*(0.7+rnd()*0.6);
      lengths[i]=Math.min(lengths[i],5);
    }
  }

  // Fill remainder by looping
  for(let i=steps;i<MAX_STEPS;i++){line[i]=line[i%Math.max(1,steps)];}
  return{line,lengths};
}

// ─── SYNTH LINE GENERATOR ─────────────────────────────────────────────────────
// Techno synth: sparse, purposeful, no melody spam
function buildTechnoSynthLine(pool,chordProg,steps,synthRole,chaos,bassLine,lenBias){
  const line=mkNotes(pool[0]);
  const lengths=Array(steps).fill(1);
  const chordLen=Math.max(1,Math.floor(steps/4));

  if(synthRole==='texture'||synthRole==='hypno_texture'||synthRole==='noise_texture'){
    // Texture: long sustained notes, very sparse, atmospheric
    const holdLen=Math.floor(steps/4);
    for(let i=0;i<steps;i++){
      const ci=Math.floor(i/chordLen)%chordProg.length;
      const cn=chordNotes(chordProg[ci],pool);
      if(i%holdLen===0){
        line[i]=cn[Math.floor(rnd()*cn.length)];
        lengths[i]=holdLen*0.9;
      } else {
        line[i]=line[Math.max(0,i-1)];
        lengths[i]=1;
      }
    }
  } else if(synthRole==='stab'){
    // Minimal stab: short punchy hits on specific positions
    const stabPositions=[2,6,10,14,18,22,26,30];
    for(let i=0;i<steps;i++){
      const ci=Math.floor(i/chordLen)%chordProg.length;
      const cn=chordNotes(chordProg[ci],pool);
      line[i]=cn[0]||pool[0];
      lengths[i]=lenBias*0.5;
    }
  } else if(synthRole==='chords'||synthRole==='dub_chord'){
    // Chord stabs: sustained, let the reverb/delay carry it
    for(let i=0;i<steps;i++){
      const ci=Math.floor(i/chordLen)%chordProg.length;
      const cn=chordNotes(chordProg[ci],pool);
      line[i]=cn[Math.floor(rnd()*cn.length)];
      lengths[i]=lenBias*(synthRole==='dub_chord'?3:1.5);
      lengths[i]=Math.min(lengths[i],8);
    }
  } else if(synthRole==='lead'||synthRole==='acid_lead'){
    // Lead: motif-based, 4-step phrase repeated and varied
    const motif=[];
    const firstCn=chordNotes(chordProg[0],pool);
    for(let m=0;m<4;m++){
      const r=rnd();
      if(r<0.2)motif.push(null);
      else if(r<0.45)motif.push(firstCn[0]||pool[0]);
      else motif.push(firstCn[Math.floor(rnd()*firstCn.length)]||pool[0]);
    }
    for(let i=0;i<steps;i++){
      const ci=Math.floor(i/chordLen)%chordProg.length;
      const cn=chordNotes(chordProg[ci],pool);
      const mn=motif[i%4];
      if(mn===null){line[i]=pool[0];}
      else if(rnd()<0.68){
        line[i]=cn.reduce((best,n)=>
          Math.abs(pool.indexOf(n)-pool.indexOf(mn))<Math.abs(pool.indexOf(best)-pool.indexOf(mn))?n:best
        ,cn[0]||pool[0]);
      } else {
        line[i]=rnd()<chaos?pick(pool):voiceLead(line[Math.max(0,i-1)],cn,'techno');
      }
      lengths[i]=lenBias*(rnd()<0.5?0.8:1.4);
      lengths[i]=Math.min(lengths[i],4);
    }
  } else if(synthRole==='screech'){
    // Hard techno screech: upper register, aggressive
    const upPool=pool.filter(n=>n.includes('4')||n.includes('5'));
    const src=upPool.length?upPool:pool;
    for(let i=0;i<steps;i++){
      const ci=Math.floor(i/chordLen)%chordProg.length;
      const cn=chordNotes(chordProg[ci],src);
      line[i]=cn[Math.floor(rnd()*cn.length)]||src[0];
      lengths[i]=lenBias*0.6;
    }
  } else {
    // Generic modal
    for(let i=0;i<steps;i++){
      const ci=Math.floor(i/chordLen)%chordProg.length;
      const cn=chordNotes(chordProg[ci],pool);
      line[i]=cn[Math.floor(rnd()*cn.length)]||pool[0];
      lengths[i]=lenBias;
    }
  }

  for(let i=steps;i<MAX_STEPS;i++){line[i]=line[i%Math.max(1,steps)];}
  return{line,lengths};
}

// ─── SECTION BUILDER ──────────────────────────────────────────────────────────
function buildSection(genre,sectionName,modeName,progression,arpeMode,prevBass){
  const sec=SECTIONS[sectionName]||SECTIONS.groove;
  const gd=GENRES[genre];
  const grooveName=gd.grooveDefault||'bunker';
  const groove=GROOVE_MAPS[grooveName];
  const mode=MODES[modeName]||MODES.phrygian;
  const bp=mode.b,sp=mode.s;

  // Lane lengths — techno-specific polimetry
  const laneLen={kick:16,snare:16,hat:32,bass:32,synth:32};
  if(genre==='dub'){laneLen.bass=64;laneLen.synth=64;}
  if(genre==='hypnotic'){laneLen.hat=48;laneLen.bass=64;laneLen.synth=64;}
  if(genre==='minimal'){laneLen.hat=48;}
  if(genre==='acid'){laneLen.bass=16;} // 303 patterns short and repetitive

  const{density,chaos,bassScale,synthRole}=gd;
  const bassLb=sec.lb*(sectionName==='break'?3:sectionName==='drop'?0.7:1);
  const synthLb=sec.lb*(sectionName==='break'?4:1.5);

  const{line:bassLine,lengths:bassLengths}=buildTechnoBassLine(bp,progression,laneLen.bass,bassScale,chaos,bassLb);
  const{line:synthLine,lengths:synthLengths}=buildTechnoSynthLine(sp,progression,laneLen.synth,synthRole,chaos*0.6,bassLine,synthLb);

  const p={kick:mkSteps(),snare:mkSteps(),hat:mkSteps(),bass:mkSteps(),synth:mkSteps()};
  const bar=16;
  const phraseW=[1,0.78,0.94,0.70];

  for(const lane of['kick','snare','hat','bass','synth']){
    const ll=laneLen[lane];
    const lmKey=lane==='kick'?'kM':lane==='snare'?'sM':lane==='hat'?'hM':lane==='bass'?'bM':'syM';
    const lm=sec[lmKey]||1;
    const dm=density*lm;
    const maxDensity=lane==='bass'?0.55:lane==='synth'?0.40:1.0;

    for(let i=0;i<ll;i++){
      const pos=i%bar,pb=Math.floor(i/8)%4;
      const strong=pos===0||pos===8,bb=pos===4||pos===12,ob=pos%2===1;
      const pw=phraseW[pb];
      let hit=false;

      if(lane==='kick'){
        // Techno kick: always on 4/4, maybe syncopated additions
        if(pos%4===0)hit=true;
        else if(gd.kick==='syncopated'&&(pos===10||pos===14))hit=true;
        else if(rnd()<dm*0.08*pw)hit=true; // rare ghost kicks
      }
      else if(lane==='snare'){
        // Techno snare: mostly 2 and 4, sparse variations
        if(bb)hit=rnd()<0.88+dm*0.08;
        else hit=rnd()<dm*0.06*pw;
        if(genre==='industrial'||genre==='hard')if(pos%2===0&&pos!==0&&pos!==8)hit=hit||rnd()<0.2;
      }
      else if(lane==='hat'){
        const hatP=gd.hatPattern;
        if(hatP==='16th')hit=true;
        else if(hatP==='offbeat')hit=ob;
        else if(hatP==='sparse')hit=rnd()<0.22+dm*0.1;
        else if(hatP==='noise')hit=rnd()<0.55+dm*0.15;
        else hit=rnd()<(groove.hB+dm*0.18)*(0.82+pw*0.22);
        // Ghost hits
        if(hit&&rnd()<chaos*0.35)p.hat[i].p=0.35+rnd()*0.38;
        // Open hat on occasional 8th
        if(genre==='detroit'&&pos===14&&rnd()<0.4){hit=true;p.hat[i].p=0.85;}
      }
      else if(lane==='bass'){
        // Techno bass: phrase anchors + inline hits
        const phraseAnchor=pos===0||pos===4||pos===8||pos===12;
        const inline=pos===2||pos===6||pos===10||pos===14;
        let prob=phraseAnchor?0.86*lm:inline?(groove.bB+dm*0.10)*pw*0.55:dm*0.04;
        hit=rnd()<Math.min(prob,maxDensity);
      }
      else if(lane==='synth'){
        // Synth: sparse for texture roles, more active for lead
        const isLead=synthRole==='lead'||synthRole==='acid_lead'||synthRole==='screech';
        const phraseOn=pos===2||pos===6||pos===10||pos===14;
        let prob=isLead
          ?(phraseOn?0.60*lm:(groove.syB+dm*0.06)*pw*0.40)
          :(phraseOn?0.30*lm:dm*0.05*pw);
        hit=(rnd()<Math.min(prob,maxDensity)&&!strong)||(pb===3&&rnd()<0.12+chaos*0.1);
      }

      if(hit){
        p[lane][i].on=true;
        p[lane][i].p=clamp(sec.pb+rnd()*(1-sec.pb),sec.pb,1);
        p[lane][i].v=clamp(velCurve(sec.vel,i,ll,pw),0.2,1);
        if(lane==='bass')p[lane][i].l=bassLengths[i]||sec.lb;
        else if(lane==='synth')p[lane][i].l=synthLengths[i]||sec.lb;
        else p[lane][i].l=1;
      }
    }
  }

  // Rigid anchors — techno never misses beat 1
  for(let i=0;i<laneLen.kick;i+=16)p.kick[i].on=true;
  if(sectionName!=='break'&&sectionName!=='intro'){
    for(let i=0;i<laneLen.snare;i+=16){
      if(i+4<laneLen.snare)p.snare[i+4].on=true;
      if(i+12<laneLen.snare)p.snare[i+12].on=true;
    }
  }

  // Legature
  for(const lane of['bass','synth']){
    const ll=laneLen[lane];
    for(let i=0;i<ll;i++){
      if(p[lane][i].on&&p[lane][i].l>1){
        const holdEnd=Math.min(ll-1,i+Math.floor(p[lane][i].l));
        for(let j=i+1;j<=holdEnd;j++){p[lane][j].tied=true;p[lane][j].on=false;}
      }
    }
  }

  // Chaos mutations — drums only, never melodic
  const mp=Math.floor(chaos*4);
  for(let m=0;m<mp;m++){
    const ln=pick(['hat','snare']);
    const ll=laneLen[ln];
    const pos=Math.floor(rnd()*ll);
    if(ln==='hat')p.hat[pos].on=!p.hat[pos].on;
    else if(pos%4!==0&&pos%4!==2)p.snare[pos].on=!p.snare[pos].on;
  }

  return{patterns:p,bassLine,synthLine,laneLen,lastBass:bassLine[laneLen.bass-1]||bp[0]};
}

// ─── GROOVE ACCENT TABLE ──────────────────────────────────────────────────────
function grooveAccent(profile,lane,step,amount){
  const pos=step%16;
  const T={
    steady:{kick:[1.2,1,0.92,0.96,1,0.94,0.98,0.96,1.18,0.98,0.92,0.96,1.02,0.96,0.98,0.96],snare:[0.92,0.9,0.92,0.9,1.16,0.92,0.92,0.9,0.92,0.9,0.92,0.9,1.12,0.92,0.92,0.9],hat:[0.92,1.02,0.9,1.04,0.94,1.02,0.9,1.06,0.92,1.02,0.9,1.04,0.94,1.02,0.9,1.08],bass:[1.1,0.96,0.98,1.02,0.96,0.94,1,1.04,1.08,0.96,0.98,1.02,0.96,0.94,1,1.04],synth:[0.96,1,1.04,1,0.96,1,1.08,1,0.96,1,1.04,1,0.96,1,1.12,1]},
    broken:{kick:[1.22,0.88,1.04,0.84,0.96,1.06,0.9,1.02,1.14,0.86,1.08,0.82,0.94,1.04,0.9,1.06],snare:[0.88,0.94,0.9,1,1.12,0.9,0.96,0.9,0.88,1,0.9,0.96,1.1,0.88,1,0.92],hat:[0.84,1.08,0.9,1.14,0.86,1.02,0.92,1.12,0.84,1.08,0.9,1.14,0.86,1.02,0.92,1.16],bass:[1.06,0.94,1.1,0.88,1,0.94,1.08,0.9,1.04,0.94,1.1,0.88,1,0.94,1.08,0.92],synth:[0.92,1.04,1.12,0.9,0.94,1.08,1.14,0.88,0.92,1.04,1.1,0.9,0.94,1.08,1.16,0.86]},
    bunker:{kick:[1.30,0.90,0.92,0.88,1.04,0.90,0.92,0.88,1.26,0.90,0.92,0.88,1.06,0.90,0.92,0.88],snare:[0.88,0.88,0.90,0.88,1.10,0.88,0.90,0.88,0.88,0.88,0.90,0.88,1.08,0.88,0.90,0.88],hat:[0.86,0.96,0.88,1.00,0.86,0.96,0.88,1.02,0.86,0.96,0.88,1.00,0.86,0.96,0.88,1.04],bass:[1.18,0.92,0.94,0.98,1.06,0.92,0.94,1.00,1.16,0.92,0.94,0.98,1.08,0.92,0.94,1.02],synth:[0.88,0.96,1.00,0.94,0.88,0.96,1.04,0.94,0.88,0.96,1.00,0.94,0.88,0.96,1.08,0.94]},
    float: {kick:[1.12,0.98,0.96,1,1.04,0.98,0.96,1,1.1,0.98,0.96,1,1.02,0.98,0.96,1],snare:[0.94,0.98,0.96,1,1.06,0.98,0.96,1,0.94,0.98,0.96,1,1.08,0.98,0.96,1],hat:[0.96,1.02,0.98,1.04,0.96,1.02,0.98,1.06,0.96,1.02,0.98,1.04,0.96,1.02,0.98,1.08],bass:[1.04,0.98,1,1.02,1.04,0.98,1,1.04,1.02,0.98,1,1.02,1.06,0.98,1,1.04],synth:[1,1.04,1.08,1.02,1,1.04,1.1,1.02,1,1.04,1.08,1.02,1,1.04,1.12,1.02]},
  };
  const t=(T[profile]||T.bunker)[lane]||T.bunker.kick;
  return 1+(t[pos]-1)*clamp(amount,0,1);
}

// ─── COLORS ───────────────────────────────────────────────────────────────────
const LANE_CLR={kick:'#ff3344',snare:'#ff9900',hat:'#ffcc00',bass:'#00bbff',synth:'#bb77ff'};
const GENRE_CLR={
  bunker:'#ff2233',detroit:'#ff8844',acid:'#ccff00',minimal:'#44ccff',
  industrial:'#aaaaaa',hard:'#ff4400',dub:'#44ffcc',hypnotic:'#cc44ff',
};
const SECTION_COLORS={
  drop:'#ff2244',break:'#4488ff',build:'#ffaa00',groove:'#00cc66',
  tension:'#ff6622',fill:'#cc00ff',intro:'#44ffcc',outro:'#888888',peak:'#ff0088',
};

// ─── EXPANDED PRESET LIBRARY ──────────────────────────────────────────────────
const PRESETS={
  bass:{
    // CLEAN
    sub_deep:      {label:'SUB DEEP',      cat:'clean',   bassMode:'sub',  bassFilter:0.32,bassSubAmt:0.95,drive:0.04,compress:0.20,tone:0.42,fmIdx:0.3},
    sine_body:     {label:'SINE BODY',     cat:'clean',   bassMode:'sub',  bassFilter:0.45,bassSubAmt:0.80,drive:0.06,compress:0.22,tone:0.52,fmIdx:0.3},
    saw_clean:     {label:'SAW CLEAN',     cat:'clean',   bassMode:'saw',  bassFilter:0.55,bassSubAmt:0.50,drive:0.08,compress:0.26,tone:0.60,fmIdx:0.4},
    // DIRTY
    acid_squelch:  {label:'ACID SQUELCH', cat:'dirty',   bassMode:'acid303',bassFilter:0.78,bassSubAmt:0.30,drive:0.48,compress:0.35,tone:0.38,fmIdx:0.92},
    fm_crunch:     {label:'FM CRUNCH',    cat:'dirty',   bassMode:'fm',   bassFilter:0.65,bassSubAmt:0.32,drive:0.30,compress:0.40,tone:0.44,fmIdx:1.15},
    fold_grit:     {label:'FOLD GRIT',    cat:'dirty',   bassMode:'fold', bassFilter:0.70,bassSubAmt:0.38,drive:0.52,compress:0.42,tone:0.34,fmIdx:0.5},
    // DARK
    reese_sub:     {label:'REESE SUB',    cat:'dark',    bassMode:'grit', bassFilter:0.48,bassSubAmt:0.72,drive:0.18,compress:0.30,tone:0.40,fmIdx:0.6},
    industrial_low:{label:'INDUSTRIAL',   cat:'dark',    bassMode:'fold', bassFilter:0.38,bassSubAmt:0.88,drive:0.60,compress:0.45,tone:0.28,fmIdx:0.4},
    drone_floor:   {label:'DRONE FLOOR',  cat:'dark',    bassMode:'drone',bassFilter:0.42,bassSubAmt:0.85,drive:0.08,compress:0.18,tone:0.55,fmIdx:0.3},
    // EXPERIMENTAL
    bit_machine:   {label:'BIT MACHINE',  cat:'experimental',bassMode:'bit',bassFilter:0.82,bassSubAmt:0.22,drive:0.55,compress:0.38,tone:0.32,fmIdx:1.40},
    wet_morph:     {label:'WET MORPH',    cat:'experimental',bassMode:'wet',bassFilter:0.52,bassSubAmt:0.55,drive:0.25,compress:0.26,tone:0.68,fmIdx:0.7},
    pulse_hard:    {label:'PULSE HARD',   cat:'experimental',bassMode:'pulse',bassFilter:0.60,bassSubAmt:0.42,drive:0.35,compress:0.32,tone:0.48,fmIdx:0.5},
  },
  synth:{
    // TECHNO LEADS
    bunker_lead:   {label:'BUNKER LEAD',  cat:'techno',  synthMode:'lead',       synthFilter:0.55,space:0.15,tone:0.40,drive:0.45,polySynth:false},
    acid_lead:     {label:'ACID LEAD',    cat:'techno',  synthMode:'acid_lead',  synthFilter:0.72,space:0.20,tone:0.35,drive:0.55,polySynth:false},
    hard_screech:  {label:'HARD SCREECH', cat:'techno',  synthMode:'screech',    synthFilter:0.80,space:0.10,tone:0.30,drive:0.65,polySynth:false},
    minimal_stab:  {label:'MINIMAL STAB', cat:'techno',  synthMode:'minimal_stab',synthFilter:0.58,space:0.22,tone:0.52,drive:0.12,polySynth:false},
    // TEXTURES
    hypno_texture: {label:'HYPNO TEXTURE',cat:'texture', synthMode:'hypno_texture',synthFilter:0.62,space:0.55,tone:0.50,drive:0.10,polySynth:true},
    metal_layer:   {label:'METAL LAYER',  cat:'texture', synthMode:'metal_lead', synthFilter:0.70,space:0.18,tone:0.32,drive:0.60,polySynth:true},
    dub_chord:     {label:'DUB CHORD',    cat:'texture', synthMode:'dub_chord',  synthFilter:0.60,space:0.88,tone:0.70,drive:0.04,polySynth:true},
    // PADS
    dark_pad:      {label:'DARK PAD',     cat:'pads',    synthMode:'pad',        synthFilter:0.52,space:0.68,tone:0.55,drive:0.06,polySynth:true},
    detroit_chord: {label:'DETROIT CHORD',cat:'pads',    synthMode:'pad',        synthFilter:0.65,space:0.52,tone:0.72,drive:0.08,polySynth:true},
    glass_atmo:    {label:'GLASS ATMO',   cat:'pads',    synthMode:'glass',      synthFilter:0.80,space:0.60,tone:0.85,drive:0.04,polySynth:true},
    // EXPERIMENTAL
    noise_sculpt:  {label:'NOISE SCULPT', cat:'experimental',synthMode:'air',    synthFilter:0.72,space:0.45,tone:0.38,drive:0.55,polySynth:true},
    string_dark:   {label:'STRING DARK',  cat:'experimental',synthMode:'strings', synthFilter:0.58,space:0.62,tone:0.52,drive:0.12,polySynth:true},
  },
  drum:{
    // BUNKER
    bunker_kick:   {label:'BUNKER KICK',  cat:'bunker',  drumDecay:0.30,noiseMix:0.08,compress:0.42,drive:0.38,kickDist:0.40},
    warehouse_hit: {label:'WAREHOUSE',    cat:'bunker',  drumDecay:0.45,noiseMix:0.20,compress:0.32,drive:0.22,kickDist:0.25},
    concrete_slam: {label:'CONCRETE',     cat:'bunker',  drumDecay:0.52,noiseMix:0.35,compress:0.45,drive:0.45,kickDist:0.50},
    // CLEAN
    tight_punch:   {label:'TIGHT PUNCH',  cat:'clean',   drumDecay:0.28,noiseMix:0.10,compress:0.18,drive:0.08,kickDist:0.12},
    crisp_club:    {label:'CRISP CLUB',   cat:'clean',   drumDecay:0.24,noiseMix:0.08,compress:0.22,drive:0.06,kickDist:0.08},
    detroit_snap:  {label:'DETROIT SNAP', cat:'clean',   drumDecay:0.35,noiseMix:0.18,compress:0.25,drive:0.12,kickDist:0.15},
    // INDUSTRIAL
    industrial_hz: {label:'INDUSTRIAL HZ',cat:'industrial',drumDecay:0.62,noiseMix:0.45,compress:0.38,drive:0.55,kickDist:0.60},
    metal_clank:   {label:'METAL CLANK',  cat:'industrial',drumDecay:0.55,noiseMix:0.52,compress:0.42,drive:0.48,kickDist:0.55},
    // TEXTURED
    broken_air:    {label:'BROKEN AIR',   cat:'textured',drumDecay:0.58,noiseMix:0.32,compress:0.24,drive:0.15,swing:0.06},
    dusty_tape:    {label:'DUSTY TAPE',   cat:'textured',drumDecay:0.44,noiseMix:0.28,compress:0.20,drive:0.18},
  },
  performance:{
    // TECHNO ENVIRONMENTS
    club_berlin:   {label:'CLUB BERLIN',  cat:'techno',  genre:'bunker',   grooveAmt:0.82,swing:0.01,space:0.16,tone:0.38,drive:0.45,compress:0.40},
    berghain:      {label:'BERGHAIN',     cat:'techno',  genre:'bunker',   grooveAmt:0.90,swing:0.0, space:0.12,tone:0.32,drive:0.55,compress:0.48},
    tresor:        {label:'TRESOR',       cat:'techno',  genre:'industrial',grooveAmt:0.88,swing:0.0, space:0.10,tone:0.28,drive:0.62,compress:0.52},
    fabric:        {label:'FABRIC',       cat:'techno',  genre:'minimal',  grooveAmt:0.75,swing:0.02,space:0.24,tone:0.48,drive:0.22,compress:0.30},
    // MOODS
    deep_session:  {label:'DEEP SESSION', cat:'mood',    genre:'detroit',  grooveAmt:0.65,swing:0.04,space:0.52,tone:0.68,drive:0.12,compress:0.24},
    acid_night:    {label:'ACID NIGHT',   cat:'mood',    genre:'acid',     grooveAmt:0.78,swing:0.05,space:0.22,tone:0.38,drive:0.52,compress:0.35},
    dub_session:   {label:'DUB SESSION',  cat:'mood',    genre:'dub',      grooveAmt:0.45,swing:0.03,space:0.90,tone:0.70,drive:0.04,compress:0.16},
    hard_peak:     {label:'HARD PEAK',    cat:'mood',    genre:'hard',     grooveAmt:0.88,swing:0.0, space:0.08,tone:0.28,drive:0.65,compress:0.55},
    // ATMOSPHERE
    hypnotic_loop: {label:'HYPNOTIC LOOP',cat:'atmosphere',genre:'hypnotic',grooveAmt:0.60,swing:0.02,space:0.50,tone:0.45,drive:0.20,compress:0.28},
    dawn_raid:     {label:'DAWN RAID',    cat:'atmosphere',genre:'minimal', grooveAmt:0.55,swing:0.03,space:0.40,tone:0.58,drive:0.15,compress:0.22},
  },
};

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App(){
  const audioRef=useRef(null);
  const analyserRef=useRef(null);
  const [isPlaying,setIsPlaying]=useState(false);
  const isPlayingRef=useRef(false);
  const schedulerRef=useRef(null);
  const nextNoteRef=useRef(0);
  const stepRef=useRef(0);
  const [step,setStep]=useState(0);
  const [bpm,setBpm]=useState(136);
  const bpmRef=useRef(136);
  useEffect(()=>{bpmRef.current=bpm;},[bpm]);

  const [genre,setGenre]=useState('bunker');
  const genreRef=useRef('bunker');
  const [currentSectionName,setCurrentSectionName]=useState('groove');
  const [modeName,setModeName]=useState('phrygian');
  const [songArc,setSongArc]=useState([]);
  const [arcIdx,setArcIdx]=useState(0);
  const [songActive,setSongActive]=useState(false);
  const songActiveRef=useRef(false);
  const arcRef=useRef([]);
  const arcIdxRef=useRef(0);
  const barCountRef=useRef(0);

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

  // Parameters
  const [master,setMaster]=useState(0.85);
  const [swing,setSwing]=useState(0.01);
  const swingRef=useRef(0.01);
  useEffect(()=>{swingRef.current=swing;},[swing]);
  const [humanize,setHumanize]=useState(0.008);
  const humanizeRef=useRef(0.008);
  useEffect(()=>{humanizeRef.current=humanize;},[humanize]);
  const [grooveAmt,setGrooveAmt]=useState(0.82);
  const grooveRef=useRef(0.82);
  useEffect(()=>{grooveRef.current=grooveAmt;},[grooveAmt]);
  const [grooveProfile,setGrooveProfile]=useState('bunker');
  const grooveProfileRef=useRef('bunker');
  useEffect(()=>{grooveProfileRef.current=grooveProfile;},[grooveProfile]);
  const [space,setSpace]=useState(0.18);
  const [tone,setTone]=useState(0.38);
  const [noiseMix,setNoiseMix]=useState(0.12);
  const [drive,setDrive]=useState(0.45);
  const [compress,setCompress]=useState(0.40);
  const [bassFilter,setBassFilter]=useState(0.42);
  const [synthFilter,setSynthFilter]=useState(0.55);
  const [drumDecay,setDrumDecay]=useState(0.30);
  const [bassSubAmt,setBassSubAmt]=useState(0.88);
  const [fmIdx,setFmIdx]=useState(0.6);
  const fmIdxRef=useRef(0.6);
  useEffect(()=>{fmIdxRef.current=fmIdx;},[fmIdx]);
  const [polySynth,setPolySynth]=useState(false);
  const [bassStack,setBassStack]=useState(false);
  const [bassPreset,setBassPreset]=useState('sub_deep');
  const [synthPreset,setSynthPreset]=useState('bunker_lead');
  const [drumPreset,setDrumPreset]=useState('bunker_kick');
  const [perfPreset,setPerfPreset]=useState('club_berlin');

  // Autopilot — DJ mode
  const [autopilot,setAutopilot]=useState(false);
  const autopilotRef=useRef(false);
  useEffect(()=>{autopilotRef.current=autopilot;},[autopilot]);
  const autopilotTimerRef=useRef(null);
  const [autopilotIntensity,setAutopilotIntensity]=useState(0.5);
  // DJ energy state: rises and falls like a DJ set
  const djEnergyRef=useRef(0.3); // starts low
  const djPhaseRef=useRef('build'); // build | peak | release | valley

  const lastBassRef=useRef('C2');
  const progressionRef=useRef(CHORD_PROGS.phrygian[0]);
  const arpModeRef=useRef('up');
  const [arpMode,setArpMode]=useState('up');

  const [view,setView]=useState('perform');
  const [laneVU,setLaneVU]=useState({kick:0,snare:0,hat:0,bass:0,synth:0});
  const vuTimers=useRef({});
  const [page,setPage]=useState(0);
  const [status,setStatus]=useState('CESIRA V4 — TECHNO ENGINE READY');
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
  const [activeNotes,setActiveNotes]=useState({bass:'—',synth:'—'});
  const vizRef=useRef(null);

  // ─── AUDIO ENGINE ────────────────────────────────────────────────────────────
  const driveCurve=(node,amt)=>{
    const k=2+clamp(amt,0,1)*80;const s=512;const c=new Float32Array(s);
    for(let i=0;i<s;i++){const x=(i*2)/s-1;c[i]=((1+k)*x)/(1+k*Math.abs(x));}
    node.curve=c;node.oversample='4x';
  };
  const identityCurve=node=>{const c=new Float32Array(512);for(let i=0;i<512;i++){c[i]=(i*2)/512-1;}node.curve=c;};
  const reverbIR=(ctx,dur=2.2,dec=3.0)=>{
    const sr=ctx.sampleRate,l=Math.floor(sr*dur);
    const b=ctx.createBuffer(2,l,sr);
    for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);for(let i=0;i<l;i++)d[i]=(rnd()*2-1)*Math.pow(1-i/l,dec);}
    return b;
  };

  const initAudio=async()=>{
    if(audioRef.current){await audioRef.current.ctx.resume();return;}
    const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;
    const ctx=new Ctx({sampleRate:44100,latencyHint:'interactive'});
    const bus=ctx.createGain();bus.gain.value=0.72;
    const preD=ctx.createWaveShaper();identityCurve(preD);
    const toneF=ctx.createBiquadFilter();toneF.type='lowpass';toneF.frequency.value=12000;toneF.Q.value=0.5;
    const comp=ctx.createDynamicsCompressor();comp.threshold.value=-18;comp.knee.value=12;comp.ratio.value=4;comp.attack.value=0.005;comp.release.value=0.18;
    const lim=ctx.createDynamicsCompressor();lim.threshold.value=-2;lim.knee.value=0;lim.ratio.value=20;lim.attack.value=0.001;lim.release.value=0.04;
    const dry=ctx.createGain(),wet=ctx.createGain();dry.gain.value=1;wet.gain.value=0;
    const spl=ctx.createChannelSplitter(2),mrg=ctx.createChannelMerger(2);
    const lDly=ctx.createDelay(0.5),rDly=ctx.createDelay(0.5),fb=ctx.createGain(),dlyT=ctx.createBiquadFilter();
    dlyT.type='lowpass';dlyT.frequency.value=3800;fb.gain.value=0.18;
    const chorus=ctx.createGain();chorus.gain.value=0;
    const cD1=ctx.createDelay(0.022),cD2=ctx.createDelay(0.028);
    const rev=ctx.createConvolver();rev.buffer=reverbIR(ctx);
    const revW=ctx.createGain();revW.gain.value=0;
    const out=ctx.createGain();out.gain.value=0.90;
    const an=ctx.createAnalyser();an.fftSize=512;an.smoothingTimeConstant=0.82;
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
    applyFxNow();
  };

  const applyFxNow=()=>{
    const a=audioRef.current;if(!a)return;
    const now=a.ctx.currentTime;
    const gd=GENRES[genreRef.current]||GENRES.bunker;
    const fx=gd.fxProfile;
    driveCurve(a.preD,clamp(fx.drive*0.5+drive*0.12,0,0.55));
    a.toneF.frequency.linearRampToValueAtTime(clamp(1200+10000*fx.tone*tone,400,18000),now+0.1);
    a.lDly.delayTime.linearRampToValueAtTime(clamp(0.015+space*0.06,0.01,0.40),now+0.1);
    a.rDly.delayTime.linearRampToValueAtTime(clamp(0.022+space*0.08,0.01,0.42),now+0.1);
    a.fb.gain.linearRampToValueAtTime(clamp(0.08+space*0.18,0.04,0.38),now+0.1);
    a.wet.gain.linearRampToValueAtTime(clamp(space*0.15,0,0.22),now+0.1);
    a.dry.gain.linearRampToValueAtTime(clamp(0.96-space*0.06,0.74,0.98),now+0.1);
    a.chorus.gain.linearRampToValueAtTime(clamp(space*0.06,0,0.12),now+0.15);
    a.revW.gain.linearRampToValueAtTime(clamp(fx.space*space*0.25,0,0.30),now+0.18);
    a.out.gain.linearRampToValueAtTime(master,now+0.06);
    a.comp.threshold.value=clamp(-14-compress*14,-28,-4);
    a.comp.ratio.value=clamp(2.5+compress*6,2,10);
  };
  useEffect(()=>{if(audioRef.current)applyFxNow();},[space,tone,drive,compress,master,genre]);

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
  const nodeGuard=()=>activeNodes.current<100;
  const trackNode=ms=>{activeNodes.current++;setTimeout(()=>{activeNodes.current=Math.max(0,activeNodes.current-1);},ms+80);};

  const flashLane=useCallback((lane,level=1)=>{
    setLaneVU(p=>({...p,[lane]:Math.min(1,level)}));
    if(vuTimers.current[lane])clearInterval(vuTimers.current[lane]);
    vuTimers.current[lane]=setInterval(()=>setLaneVU(p=>{const nv=Math.max(0,p[lane]-0.22);if(nv<=0)clearInterval(vuTimers.current[lane]);return{...p,[lane]:nv};}),50);
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

  // ─── DRUM SYNTHESIS — Genre-aware ────────────────────────────────────────────
  const playKick=(accent,t)=>{
    if(!nodeGuard())return;
    const a=audioRef.current;
    const gd=GENRES[genreRef.current]||GENRES.bunker;
    const kf=gd.kickFreq||65,ke=gd.kickEnd||28;
    const kDist=gd.kickDist||0.3;
    const et=0.065+drumDecay*0.10,dt=0.14+drumDecay*0.22;
    const body=a.ctx.createOscillator(),bG=a.ctx.createGain();
    const sub=a.ctx.createOscillator(),sG=a.ctx.createGain();
    const click=a.ctx.createBufferSource(),cG=a.ctx.createGain();
    const mG=a.ctx.createGain(),sh=a.ctx.createWaveShaper();
    body.type='sine';
    body.frequency.setValueAtTime(kf*2.2,t);
    body.frequency.exponentialRampToValueAtTime(Math.max(18,ke),t+et);
    sub.type='sine';
    sub.frequency.setValueAtTime(kf*0.5,t);
    sub.frequency.exponentialRampToValueAtTime(Math.max(16,ke*0.45),t+et*1.2);
    const cb=a.ctx.createBuffer(1,Math.floor(a.ctx.sampleRate*0.006),a.ctx.sampleRate);
    const cd=cb.getChannelData(0);for(let i=0;i<cd.length;i++)cd[i]=rnd()*2-1;
    click.buffer=cb;
    driveCurve(sh,clamp(kDist+noiseMix*0.1,0,0.7));
    bG.gain.setValueAtTime(0,t);bG.gain.linearRampToValueAtTime(0.88*accent,t+0.0008);bG.gain.exponentialRampToValueAtTime(0.001,t+dt);
    sG.gain.setValueAtTime(0,t);sG.gain.linearRampToValueAtTime(0.55*accent*bassSubAmt,t+0.001);sG.gain.exponentialRampToValueAtTime(0.001,t+dt*1.3);
    cG.gain.setValueAtTime(0,t);cG.gain.linearRampToValueAtTime(0.35*accent,t+0.0004);cG.gain.exponentialRampToValueAtTime(0.001,t+0.005);
    body.connect(sh);sh.connect(bG);sub.connect(sG);click.connect(cG);
    bG.connect(mG);sG.connect(mG);cG.connect(mG);
    const dest=getLaneGain('kick')||a.bus;mG.connect(dest);
    const dur=(dt+0.12)*1000+250;trackNode(dur);
    gc(body,[sub,click,bG,sG,cG,mG,sh],dur);
    ss(body,t);ss(sub,t);ss(click,t);st(body,t+dt+0.06);st(sub,t+dt+0.10);st(click,t+0.010);
  };

  const playSnare=(accent,t)=>{
    if(!nodeGuard())return;
    const a=audioRef.current;
    const gd=GENRES[genreRef.current]||GENRES.bunker;
    const snFreq=gd.snareFilter||1200;
    const nb=noiseBuffer(0.20,0.28+noiseMix*0.55,gd.noiseColor||'brown');
    const src=a.ctx.createBufferSource(),fil=a.ctx.createBiquadFilter(),g=a.ctx.createGain();
    src.buffer=nb;fil.type='bandpass';fil.frequency.value=snFreq+noiseMix*350;fil.Q.value=0.85+compress*0.35;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.52*accent,t+0.0015);g.gain.exponentialRampToValueAtTime(0.001,t+0.048+drumDecay*0.10);
    src.connect(fil);fil.connect(g);const dest=getLaneGain('snare')||a.bus;g.connect(dest);
    gc(src,[fil,g],400);ss(src,t);st(src,t+0.22);
  };

  const playHat=(accent,t,open=false)=>{
    if(!nodeGuard())return;
    const a=audioRef.current;
    const gd=GENRES[genreRef.current]||GENRES.bunker;
    const hDecay=gd.hatDecay||0.04;
    const nb=noiseBuffer(open?0.28:0.10,0.16+noiseMix*0.30,gd.noiseColor||'white');
    const src=a.ctx.createBufferSource(),fil=a.ctx.createBiquadFilter(),g=a.ctx.createGain();
    src.buffer=nb;fil.type='highpass';fil.frequency.value=open?6500:9000;
    const decay=open?hDecay*3.5:hDecay;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.28*accent,t+0.0008);g.gain.exponentialRampToValueAtTime(0.001,t+decay);
    src.connect(fil);fil.connect(g);const dest=getLaneGain('hat')||a.bus;g.connect(dest);
    gc(src,[fil,g],600);ss(src,t);st(src,t+(open?0.32:0.12));
  };

  const getVoiceNotes=(baseNote,lane='synth')=>{
    const mode=MODES[modeName]||MODES.phrygian;
    const pool=lane==='bass'?mode.b:mode.s;
    const idx=pool.indexOf(baseNote);
    if(lane==='bass'){
      if(!bassStack)return[baseNote];
      const fifth=idx>-1?pool[Math.min(idx+4,pool.length-1)]:transposeNote(baseNote,7);
      return[...new Set([baseNote,fifth])];
    }
    if(!polySynth)return[baseNote];
    if(idx===-1)return[...new Set([baseNote,transposeNote(baseNote,4),transposeNote(baseNote,7)])];
    return[...new Set([pool[idx],pool[Math.min(idx+2,pool.length-1)],pool[Math.min(idx+4,pool.length-1)]])];
  };

  // ─── BASS SYNTHESIS — extended with acid303 ───────────────────────────────────
  const playBassVoice=(note,accent,t,lenSteps=1)=>{
    if(!nodeGuard())return;
    const a=audioRef.current;
    const f=NOTE_FREQ[note]||110;
    const dur=clamp(stepSec()*lenSteps*0.90,0.04,6);
    const atk=Math.min(0.006,dur*0.04);
    const rel=Math.max(0.04,dur*0.86);
    const gd=GENRES[genreRef.current]||GENRES.bunker;
    let mode=gd.bassMode||'sub';
    // Override mode from preset if active
    const g=a.ctx.createGain(),fil=a.ctx.createBiquadFilter();
    fil.type='lowpass';
    fil.frequency.setValueAtTime(55+bassFilter*4000+tone*500,t);
    fil.Q.value=clamp(0.4+compress*4,0.4,18);
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(0.62*accent,t+atk);g.gain.setValueAtTime(0.62*accent,t+rel*0.28);g.gain.exponentialRampToValueAtTime(0.0001,t+rel);
    const cleanMs=(rel+0.3)*1000;

    if(mode==='acid303'){
      // Proper 303 emulation: sawtooth + resonant filter sweep
      const o1=a.ctx.createOscillator(),o2=a.ctx.createOscillator();
      o1.type='sawtooth';o2.type='sawtooth';
      o1.frequency.value=f;o2.frequency.value=f*1.003;
      // Filter envelope — the 303 signature
      const fEnv=bassFilter*12000+200;
      fil.frequency.setValueAtTime(fEnv*0.2,t);
      fil.frequency.linearRampToValueAtTime(fEnv,t+atk*3);
      fil.frequency.exponentialRampToValueAtTime(fEnv*0.15+50,t+rel*0.6);
      fil.Q.value=clamp(8+compress*15,8,28); // high resonance
      const mix=a.ctx.createGain();mix.gain.value=0.5;
      const sub=a.ctx.createOscillator(),sg=a.ctx.createGain();
      sub.type='sine';sub.frequency.value=f*0.5;sg.gain.value=bassSubAmt*0.35;
      o1.connect(mix);o2.connect(mix);mix.connect(fil);sub.connect(sg);sg.connect(fil);fil.connect(g);
      const dest=getLaneGain('bass')||a.bus;g.connect(dest);trackNode(cleanMs);
      gc(o1,[o2,mix,sub,sg,fil,g],cleanMs);
      ss(o1,t);ss(o2,t);ss(sub,t);st(o1,t+rel+0.05);st(o2,t+rel+0.05);st(sub,t+rel+0.05);
    } else if(mode==='fm'||mode==='bit'){
      const idx=fmIdxRef.current*(mode==='bit'?3:1.5);
      const car=a.ctx.createOscillator(),mod=a.ctx.createOscillator(),mg=a.ctx.createGain();
      car.type='sine';car.frequency.value=f;mod.type='sine';mod.frequency.value=f*(mode==='fm'?2:3);mg.gain.value=f*idx;
      const sub=a.ctx.createOscillator(),sg=a.ctx.createGain();
      sub.type='sine';sub.frequency.value=f*0.5;sg.gain.value=bassSubAmt*0.42;
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
      sub.type='sine';sub.frequency.value=f*0.5;sg.gain.value=bassSubAmt*0.52;
      sub.connect(sg);sg.connect(fil);fil.connect(g);
      const dest=getLaneGain('bass')||a.bus;g.connect(dest);trackNode(cleanMs);
      gc(car,[ring,rm,rg,sub,sg,fil,g],cleanMs);
      ss(car,t);ss(ring,t);ss(sub,t);st(car,t+rel+0.05);st(ring,t+rel+0.05);st(sub,t+rel+0.05);
    } else {
      const types={sub:'sine',grit:'sawtooth',drone:'sawtooth',saw:'sawtooth',pulse:'square'};
      const o1=a.ctx.createOscillator(),o2=a.ctx.createOscillator();
      o1.type=types[mode]||'sawtooth';o2.type='sine';
      o1.frequency.value=f;o2.frequency.value=f*1.005;
      const sg=a.ctx.createGain();sg.gain.value=bassSubAmt*(mode==='sub'?0.88:0.32);
      const lfo=a.ctx.createOscillator(),lg=a.ctx.createGain();
      lfo.frequency.value=0.5;lg.gain.value=mode==='drone'?35:6;
      lfo.connect(lg);lg.connect(fil.frequency);
      o1.connect(fil);o2.connect(sg);sg.connect(fil);fil.connect(g);
      const dest=getLaneGain('bass')||a.bus;g.connect(dest);trackNode(cleanMs);
      gc(o1,[o2,lfo,sg,fil,g,lg],cleanMs);
      ss(o1,t);ss(o2,t);ss(lfo,t);st(o1,t+rel+0.05);st(o2,t+rel+0.05);st(lfo,t+rel+0.05);
    }
  };
  const playBass=(note,accent,t,lenSteps=1)=>{
    const notes=Array.isArray(note)?note:getVoiceNotes(note,'bass');
    const va=accent/Math.sqrt(Math.max(1,notes.length));
    notes.forEach((voice,idx)=>playBassVoice(voice,va,t+idx*0.002,lenSteps));
    setActiveNotes(p=>({...p,bass:notes.join(' · ')}));
  };

  // ─── SYNTH SYNTHESIS — techno voices ─────────────────────────────────────────
  const playSynthVoice=(note,accent,t,lenSteps=1)=>{
    if(!nodeGuard())return;
    const a=audioRef.current;
    const f=NOTE_FREQ[note]||440;
    const dur=clamp(stepSec()*lenSteps*0.90,0.04,8);
    const gd=GENRES[genreRef.current]||GENRES.bunker;
    const mode=gd.synthMode||'lead';
    const cleanMs=(dur+2)*1000;
    const dest=getLaneGain('synth')||a.bus;

    if(mode==='pad'||mode==='dub_chord'||mode==='detroit_chord'){
      const atk=0.08+dur*0.10,rel=Math.max(atk+0.1,dur*0.92+space*0.8);
      const o1=a.ctx.createOscillator(),o2=a.ctx.createOscillator(),o3=a.ctx.createOscillator();
      o1.type='sawtooth';o2.type='sawtooth';o3.type='sine';
      o1.frequency.value=f;o2.frequency.value=f*1.014;o3.frequency.value=f*0.993;
      const mix=a.ctx.createGain();mix.gain.value=0.33;
      const fil=a.ctx.createBiquadFilter();fil.type='lowpass';
      fil.frequency.setValueAtTime(280+synthFilter*2200,t);fil.frequency.linearRampToValueAtTime(750+synthFilter*5500,t+atk*2);fil.Q.value=0.35+compress*1.2;
      const amp=a.ctx.createGain();
      amp.gain.setValueAtTime(0,t);amp.gain.linearRampToValueAtTime(0.36*accent,t+atk);amp.gain.setValueAtTime(0.36*accent,t+Math.max(atk+0.01,dur*0.62));amp.gain.exponentialRampToValueAtTime(0.001,t+rel);
      o1.connect(mix);o2.connect(mix);o3.connect(mix);mix.connect(fil);fil.connect(amp);amp.connect(dest);
      trackNode(cleanMs);gc(o1,[o2,o3,mix,fil,amp],cleanMs);
      ss(o1,t);ss(o2,t);ss(o3,t);st(o1,t+rel+0.1);st(o2,t+rel+0.1);st(o3,t+rel+0.1);
      return;
    }

    if(mode==='hypno_texture'||mode==='noise_texture'){
      // Noise-based texture, filtered
      const nb=noiseBuffer(Math.min(dur+0.5,4),0.6,'brown');
      const src=a.ctx.createBufferSource();src.buffer=nb;
      const hpf=a.ctx.createBiquadFilter();hpf.type='bandpass';hpf.frequency.value=f*0.5+synthFilter*2000;hpf.Q.value=2+compress*4;
      const amp=a.ctx.createGain();
      amp.gain.setValueAtTime(0,t);amp.gain.linearRampToValueAtTime(0.22*accent,t+0.15);amp.gain.setValueAtTime(0.22*accent,t+Math.max(0.2,dur*0.8));amp.gain.exponentialRampToValueAtTime(0.001,t+dur+0.5);
      src.connect(hpf);hpf.connect(amp);amp.connect(dest);
      trackNode(cleanMs);gc(src,[hpf,amp],cleanMs);
      ss(src,t);st(src,t+Math.min(dur+0.5,4));
      return;
    }

    if(mode==='glass'||mode==='bell'){
      const atk=0.001,rel=Math.max(0.4,dur*1.4+synthFilter*2.5);
      const nb=noiseBuffer(0.05,1,'white');
      const src=a.ctx.createBufferSource();src.buffer=nb;
      const dly=a.ctx.createDelay(0.05);dly.delayTime.value=1/f;
      const fbk=a.ctx.createGain();fbk.gain.value=0.96-synthFilter*0.12;
      const lpf=a.ctx.createBiquadFilter();lpf.type='lowpass';lpf.frequency.value=1800+synthFilter*7000;
      const amp=a.ctx.createGain();
      amp.gain.setValueAtTime(0,t);amp.gain.linearRampToValueAtTime(0.50*accent,t+atk);amp.gain.exponentialRampToValueAtTime(0.001,t+rel);
      src.connect(dly);dly.connect(lpf);lpf.connect(fbk);fbk.connect(dly);lpf.connect(amp);amp.connect(dest);
      trackNode(cleanMs);gc(src,[dly,lpf,fbk,amp],cleanMs);ss(src,t);st(src,t+0.05);
      return;
    }

    if(mode==='strings'||mode==='star'){
      const atk=0.10+dur*0.06,rel=Math.max(atk+0.1,dur*0.94+space*0.5);
      const o1=a.ctx.createOscillator(),o2=a.ctx.createOscillator();
      const vib=a.ctx.createOscillator(),vg=a.ctx.createGain();
      o1.type='sawtooth';o2.type='sawtooth';o1.frequency.value=f;o2.frequency.value=f*1.007;
      vib.frequency.value=5.0+rnd()*0.8;vg.gain.value=2.5+synthFilter*7;
      vib.connect(vg);vg.connect(o1.frequency);vg.connect(o2.frequency);
      const fil=a.ctx.createBiquadFilter();fil.type='lowpass';fil.frequency.value=380+synthFilter*5500;fil.Q.value=0.28;
      const amp=a.ctx.createGain();
      amp.gain.setValueAtTime(0,t);amp.gain.linearRampToValueAtTime(0.34*accent,t+atk);amp.gain.setValueAtTime(0.34*accent,t+Math.max(atk+0.01,dur*0.72));amp.gain.exponentialRampToValueAtTime(0.001,t+rel);
      o1.connect(fil);o2.connect(fil);fil.connect(amp);amp.connect(dest);
      trackNode(cleanMs);gc(o1,[o2,vib,vg,fil,amp],cleanMs);
      ss(o1,t);ss(o2,t);ss(vib,t);st(o1,t+rel+0.1);st(o2,t+rel+0.1);st(vib,t+rel+0.1);
      return;
    }

    if(mode==='acid_lead'){
      // Acid lead: 303-esque but in upper register, high resonance
      const atk=0.003,rel=Math.max(0.06,dur*0.88);
      const o1=a.ctx.createOscillator(),o2=a.ctx.createOscillator();
      o1.type='sawtooth';o2.type='square';o1.frequency.value=f;o2.frequency.value=f*0.5;
      const mix=a.ctx.createGain();mix.gain.value=0.5;
      const fil=a.ctx.createBiquadFilter();fil.type='lowpass';
      const fPeak=200+synthFilter*8000;
      fil.frequency.setValueAtTime(fPeak*0.25,t);fil.frequency.linearRampToValueAtTime(fPeak,t+atk*4);fil.frequency.exponentialRampToValueAtTime(fPeak*0.1+80,t+rel*0.7);
      fil.Q.value=clamp(10+compress*18,10,28);
      const amp=a.ctx.createGain();
      amp.gain.setValueAtTime(0,t);amp.gain.linearRampToValueAtTime(0.42*accent,t+atk);amp.gain.setValueAtTime(0.42*accent,t+Math.max(atk+0.01,dur*0.60));amp.gain.exponentialRampToValueAtTime(0.001,t+rel);
      o1.connect(mix);o2.connect(mix);mix.connect(fil);fil.connect(amp);amp.connect(dest);
      trackNode(cleanMs);gc(o1,[o2,mix,fil,amp],cleanMs);
      ss(o1,t);ss(o2,t);st(o1,t+rel+0.06);st(o2,t+rel+0.06);
      return;
    }

    if(mode==='screech'||mode==='metal_lead'){
      // Hard techno screech: detuned squares, heavy filter
      const atk=0.002,rel=Math.max(0.04,dur*0.82);
      const o1=a.ctx.createOscillator(),o2=a.ctx.createOscillator(),o3=a.ctx.createOscillator();
      o1.type='square';o2.type='square';o3.type='sawtooth';
      o1.frequency.value=f;o2.frequency.value=f*1.008;o3.frequency.value=f*0.998;
      const mix=a.ctx.createGain();mix.gain.value=0.33;
      const fil=a.ctx.createBiquadFilter();fil.type='lowpass';fil.frequency.value=300+synthFilter*6000;fil.Q.value=2+compress*5;
      const dist=a.ctx.createWaveShaper();driveCurve(dist,clamp(drive*0.6,0.1,0.6));
      const amp=a.ctx.createGain();
      amp.gain.setValueAtTime(0,t);amp.gain.linearRampToValueAtTime(0.38*accent,t+atk);amp.gain.setValueAtTime(0.38*accent,t+Math.max(atk+0.01,dur*0.58));amp.gain.exponentialRampToValueAtTime(0.001,t+rel);
      o1.connect(mix);o2.connect(mix);o3.connect(mix);mix.connect(dist);dist.connect(fil);fil.connect(amp);amp.connect(dest);
      trackNode(cleanMs);gc(o1,[o2,o3,mix,dist,fil,amp],cleanMs);
      ss(o1,t);ss(o2,t);ss(o3,t);st(o1,t+rel+0.06);st(o2,t+rel+0.06);st(o3,t+rel+0.06);
      return;
    }

    if(mode==='minimal_stab'){
      // Short transient stab — very fast, punchy
      const atk=0.002,rel=Math.max(0.03,dur*0.5);
      const o1=a.ctx.createOscillator();o1.type='square';o1.frequency.value=f;
      const fil=a.ctx.createBiquadFilter();fil.type='lowpass';fil.frequency.value=180+synthFilter*3500;fil.Q.value=3+compress*6;
      const amp=a.ctx.createGain();
      amp.gain.setValueAtTime(0,t);amp.gain.linearRampToValueAtTime(0.50*accent,t+atk);amp.gain.exponentialRampToValueAtTime(0.001,t+rel);
      o1.connect(fil);fil.connect(amp);amp.connect(dest);
      trackNode(cleanMs);gc(o1,[fil,amp],cleanMs);
      ss(o1,t);st(o1,t+rel+0.04);
      return;
    }

    // Default techno lead: square + triangle, hard filter
    const atk=0.004,rel=Math.max(0.05,dur*0.88);
    const o1=a.ctx.createOscillator(),o2=a.ctx.createOscillator();
    o1.type='square';o2.type='triangle';
    o1.frequency.value=f;o2.frequency.value=f*1.006;
    const vib=a.ctx.createOscillator(),vg=a.ctx.createGain();
    vib.frequency.value=5.5;vg.gain.value=clamp(6+compress*4,3,14);
    vib.connect(vg);vg.connect(o1.frequency);
    const fil=a.ctx.createBiquadFilter();fil.type='lowpass';
    fil.frequency.setValueAtTime(180+synthFilter*5000,t);
    fil.frequency.linearRampToValueAtTime(180+synthFilter*8000+tone*1000,t+atk*3);
    fil.Q.value=1.5+compress*4;
    const amp=a.ctx.createGain();
    amp.gain.setValueAtTime(0,t);amp.gain.linearRampToValueAtTime(0.40*accent,t+atk);amp.gain.setValueAtTime(0.40*accent,t+Math.max(atk+0.01,dur*0.62));amp.gain.exponentialRampToValueAtTime(0.001,t+rel);
    const mix=a.ctx.createGain();mix.gain.value=0.5;
    o1.connect(mix);o2.connect(mix);mix.connect(fil);fil.connect(amp);amp.connect(dest);
    trackNode(cleanMs);gc(o1,[o2,vib,vg,mix,fil,amp],cleanMs);
    ss(o1,t);ss(o2,t);ss(vib,t);st(o1,t+rel+0.1);st(o2,t+rel+0.1);st(vib,t+rel+0.1);
  };
  const playSynth=(note,accent,t,lenSteps=1)=>{
    const notes=Array.isArray(note)?note:getVoiceNotes(note,'synth');
    const va=accent/Math.sqrt(Math.max(1,notes.length));
    notes.forEach((voice,idx)=>playSynthVoice(voice,va,t+idx*0.003,lenSteps));
    setActiveNotes(p=>({...p,synth:notes.join(' · ')}));
  };

  // ─── SCHEDULER ────────────────────────────────────────────────────────────────
  const scheduleNote=(si,t)=>{
    const lp=patternsRef.current,ll=laneLenRef.current;
    const accent=si%4===0?1:si%2===0?0.88:0.76;
    for(const lane of['kick','snare','hat','bass','synth']){
      const len=ll[lane]||16;
      const li=si%len;
      const sd=lp[lane][li];
      if(!sd||!sd.on)continue;
      if(sd.tied)continue;
      if(sd.p<1&&rnd()>sd.p)continue;
      const jit=(rnd()-0.5)*humanizeRef.current*0.015;
      const noteT=t+Math.max(0,jit);
      const ga=grooveAccent(grooveProfileRef.current,lane,li,grooveRef.current);
      const fa=clamp(accent*ga*(sd.v||1),0.08,1.2);
      if(lane==='kick')playKick(fa,noteT);
      else if(lane==='snare')playSnare(fa,noteT);
      else if(lane==='hat')playHat(fa,noteT,si%32===0&&rnd()<0.10);
      else if(lane==='bass')playBass(bassRef.current[li]||'C2',fa,noteT,sd.l||1);
      else if(lane==='synth')playSynth(synthRef.current[li]||'C4',fa,noteT,sd.l||1);
      const delay=Math.max(0,(noteT-audioRef.current.ctx.currentTime)*1000);
      setTimeout(()=>flashLane(lane,fa),delay);
    }
    if(si===0&&songActiveRef.current){
      barCountRef.current++;
      const arc=arcRef.current;
      if(arc.length>0){
        const sec=SECTIONS[arc[arcIdxRef.current]]||SECTIONS.groove;
        if(barCountRef.current>=sec.bars){
          barCountRef.current=0;
          const nextIdx=(arcIdxRef.current+1)%arc.length;
          arcIdxRef.current=nextIdx;setArcIdx(nextIdx);
          const nextSec=arc[nextIdx];setCurrentSectionName(nextSec);
          regenerateSection(nextSec,false);
        }
      }
    }
  };

  const stepInterval=si=>{
    const ms=(60/bpmRef.current)*1000/4;
    const sw=si%2===1?ms*swingRef.current:-ms*swingRef.current*0.5;
    return Math.max(0.025,(ms+sw)/1000);
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
    startClock();setIsPlaying(true);setStatus(`▶ ${genre.toUpperCase()} · ${currentSectionName}`);
  };

  // ─── GENERATION ───────────────────────────────────────────────────────────────
  const regenerateSection=(sectionName,pushU=true)=>{
    const gd=GENRES[genreRef.current];
    const mName=modeName;
    const prog=progressionRef.current;
    const aMode=arpModeRef.current;
    const lb=lastBassRef.current;
    if(pushU)pushUndo();
    const result=buildSection(genreRef.current,sectionName||currentSectionName,mName,prog,aMode,lb);
    setPatterns(result.patterns);setBassLine(result.bassLine);setSynthLine(result.synthLine);setLaneLen(result.laneLen);
    patternsRef.current=result.patterns;bassRef.current=result.bassLine;synthRef.current=result.synthLine;laneLenRef.current=result.laneLen;
    lastBassRef.current=result.lastBass;
    const gp=gd.grooveDefault||'bunker';
    setGrooveProfile(gp);grooveProfileRef.current=gp;
    setStatus(`${genreRef.current} · ${sectionName||currentSectionName} · ${mName}`);
  };

  const newGenreSession=(g)=>{
    const gd=GENRES[g];
    const mName=pick(gd.modes);
    const pp=CHORD_PROGS[mName]||CHORD_PROGS.phrygian;
    const prog=pick(pp);
    const aMode=pick(['up','down','updown','outside']);
    genreRef.current=g;setGenre(g);setModeName(mName);setArpMode(aMode);
    progressionRef.current=prog;arpModeRef.current=aMode;
    const newBpm=Math.round(gd.bpm[0]+rnd()*(gd.bpm[1]-gd.bpm[0]));
    setBpm(newBpm);bpmRef.current=newBpm;
    setSpace(gd.fxProfile.space);setTone(gd.fxProfile.tone);setDrive(gd.fxProfile.drive);
    setNoiseMix(gd.chaos*0.35);setCompress(gd.density*0.42);
    setGrooveProfile(gd.grooveDefault||'bunker');grooveProfileRef.current=gd.grooveDefault||'bunker';
    const sec='groove';setCurrentSectionName(sec);
    lastBassRef.current='C2';
    const result=buildSection(g,sec,mName,prog,aMode,'C2');
    setPatterns(result.patterns);setBassLine(result.bassLine);setSynthLine(result.synthLine);setLaneLen(result.laneLen);
    patternsRef.current=result.patterns;bassRef.current=result.bassLine;synthRef.current=result.synthLine;laneLenRef.current=result.laneLen;
    lastBassRef.current=result.lastBass;
    if(audioRef.current)applyFxNow();
    setStatus(`${gd.label} — ${gd.description}`);
  };

  const triggerSection=(sec)=>{setCurrentSectionName(sec);regenerateSection(sec);};

  // ─── DJ AUTOPILOT ─────────────────────────────────────────────────────────────
  // Simulates a real DJ set: builds energy, peaks, releases, valleys
  const runDJAutopilot=useCallback(()=>{
    if(!autopilotRef.current)return;
    const energy=djEnergyRef.current;
    const phase=djPhaseRef.current;
    const intensity=autopilotIntensity;
    let nextDelay=0;
    let nextPhase=phase;

    if(phase==='build'){
      // Building: add density, regen sections, increase energy
      if(energy<0.4){triggerSection('intro');}
      else if(energy<0.6){triggerSection('build');}
      else if(energy<0.8){
        const r=rnd();
        if(r<0.4)triggerSection('tension');
        else if(r<0.7){const pp=CHORD_PROGS[modeName]||CHORD_PROGS.phrygian;progressionRef.current=pick(pp);regenerateSection(currentSectionName);}
        else regenerateSection(currentSectionName);
      } else {
        triggerSection('drop');nextPhase='peak';
      }
      djEnergyRef.current=Math.min(1,energy+0.15*intensity);
      nextDelay=(12+rnd()*8)*(240/bpm)*1000/intensity;
    } else if(phase==='peak'){
      // Peak: drops, fills, keep it high
      if(energy>0.7){
        const r=rnd();
        if(r<0.25)triggerSection('fill');
        else if(r<0.5)triggerSection('drop');
        else if(r<0.7)triggerSection('peak');
        else{const pp=CHORD_PROGS[modeName]||CHORD_PROGS.phrygian;progressionRef.current=pick(pp);regenerateSection(currentSectionName);}
        nextDelay=(8+rnd()*6)*(240/bpm)*1000;
      } else {
        triggerSection('groove');nextPhase='release';
        nextDelay=(16+rnd()*8)*(240/bpm)*1000;
      }
      djEnergyRef.current=Math.max(0.4,energy-0.08);
    } else if(phase==='release'){
      // Releasing: grooves, maybe breaks
      if(energy>0.5){
        const r=rnd();
        if(r<0.3)triggerSection('groove');
        else if(r<0.5)triggerSection('tension');
        else regenerateSection(currentSectionName);
        nextDelay=(16+rnd()*10)*(240/bpm)*1000;
      } else {
        triggerSection('break');nextPhase='valley';
        nextDelay=(20+rnd()*12)*(240/bpm)*1000;
      }
      djEnergyRef.current=Math.max(0.1,energy-0.12);
    } else { // valley
      // Valley: rest, rebuild
      if(energy<0.25){
        triggerSection('intro');nextPhase='build';
        // Occasional genre change for variety
        if(rnd()<0.25*intensity){
          const others=GENRE_NAMES.filter(g=>g!==genre);
          if(others.length)newGenreSession(pick(others));
        }
        nextDelay=(24+rnd()*12)*(240/bpm)*1000;
      } else {
        triggerSection('break');
        nextDelay=(16+rnd()*8)*(240/bpm)*1000;
      }
      djEnergyRef.current=Math.max(0.05,energy-0.15);
    }

    djPhaseRef.current=nextPhase;
    autopilotTimerRef.current=setTimeout(runDJAutopilot,Math.max(4000,nextDelay));
  },[autopilotIntensity,currentSectionName,genre,modeName,bpm]); // eslint-disable-line

  useEffect(()=>{
    if(autopilot){
      djEnergyRef.current=0.25;djPhaseRef.current='build';
      setStatus('◈ DJ AUTOPILOT — building...');
      autopilotTimerRef.current=setTimeout(runDJAutopilot,6000);
    } else {
      if(autopilotTimerRef.current)clearTimeout(autopilotTimerRef.current);
      setStatus('Autopilot off');
    }
    return()=>{if(autopilotTimerRef.current)clearTimeout(autopilotTimerRef.current);};
  },[autopilot,runDJAutopilot]);

  // ─── SONG ARC ─────────────────────────────────────────────────────────────────
  const startSongArc=()=>{
    const arc=pick(SONG_ARCS);
    setSongArc(arc);arcRef.current=arc;setArcIdx(0);arcIdxRef.current=0;barCountRef.current=0;
    setSongActive(true);songActiveRef.current=true;
    setCurrentSectionName(arc[0]);regenerateSection(arc[0]);
    setStatus(`Arc: ${arc.slice(0,4).join('→')}...`);
  };
  const stopSongArc=()=>{setSongActive(false);songActiveRef.current=false;setStatus('Arc stopped');};

  // ─── UNDO ─────────────────────────────────────────────────────────────────────
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

  // ─── PERFORMANCE ACTIONS ──────────────────────────────────────────────────────
  const perfActions={
    drop:()=>triggerSection('drop'),
    break:()=>triggerSection('break'),
    build:()=>triggerSection('build'),
    groove:()=>triggerSection('groove'),
    tension:()=>triggerSection('tension'),
    fill:()=>triggerSection('fill'),
    intro:()=>triggerSection('intro'),
    outro:()=>triggerSection('outro'),
    peak:()=>triggerSection('peak'),
    reharmonize:()=>{
      const pp=CHORD_PROGS[modeName]||CHORD_PROGS.phrygian;
      progressionRef.current=pick(pp);regenerateSection(currentSectionName);setStatus('Reharmonized');
    },
    mutate:()=>{
      pushUndo();
      const np={...patternsRef.current};
      ['kick','snare','hat','bass','synth'].forEach(ln=>{
        const ll=laneLenRef.current[ln]||16;const flips=Math.max(2,Math.floor(ll*0.08));
        np[ln]=np[ln].map(s=>({...s}));
        for(let i=0;i<flips;i++){const pos=Math.floor(rnd()*ll);if(pos%4!==0||ln!=='kick')np[ln][pos].on=!np[ln][pos].on;}
      });
      setPatterns(np);patternsRef.current=np;setStatus('Mutated');
    },
    thinOut:()=>{
      pushUndo();
      const np={...patternsRef.current};
      ['hat','synth','bass'].forEach(ln=>{const ll=laneLenRef.current[ln]||16;np[ln]=np[ln].map((s,i)=>({...s,on:s.on&&(i%4===0||rnd()>0.5)}));});
      setPatterns(np);patternsRef.current=np;setStatus('Thinned');
    },
    thicken:()=>{
      pushUndo();
      const np={...patternsRef.current};
      ['hat','kick'].forEach(ln=>{np[ln]=np[ln].map(s=>({...s,on:s.on||(rnd()<0.2),v:s.v||0.62,p:s.p||0.72}));});
      setPatterns(np);patternsRef.current=np;setStatus('Thickened');
    },
    randomizeNotes:()=>{
      const mode=MODES[modeName]||MODES.phrygian;pushUndo();
      setSynthLine(prev=>{const n=prev.map((v,i)=>patternsRef.current.synth[i]?.on?pick(mode.s):v);synthRef.current=n;return n;});
      setStatus('Synth randomized');
    },
    randomizeBass:()=>{
      const mode=MODES[modeName]||MODES.phrygian;pushUndo();
      setBassLine(prev=>{const n=prev.map((v,i)=>patternsRef.current.bass[i]?.on?pick(mode.b):v);bassRef.current=n;return n;});
      setStatus('Bass randomized');
    },
    shiftUp:()=>{
      const mode=MODES[modeName]||MODES.phrygian;pushUndo();
      ['bass','synth'].forEach(lane=>{
        const pool=lane==='bass'?mode.b:mode.s;
        const setter=lane==='bass'?setBassLine:setSynthLine;
        const ref=lane==='bass'?bassRef:synthRef;
        setter(prev=>{const n=prev.map((v,i)=>{if(!patternsRef.current[lane][i]?.on)return v;const idx=pool.indexOf(v);return pool[Math.min(idx+1,pool.length-1)];});ref.current=n;return n;});
      });
      setStatus('Notes up');
    },
    shiftDown:()=>{
      const mode=MODES[modeName]||MODES.phrygian;pushUndo();
      ['bass','synth'].forEach(lane=>{
        const pool=lane==='bass'?mode.b:mode.s;
        const setter=lane==='bass'?setBassLine:setSynthLine;
        const ref=lane==='bass'?bassRef:synthRef;
        setter(prev=>{const n=prev.map((v,i)=>{if(!patternsRef.current[lane][i]?.on)return v;const idx=pool.indexOf(v);return pool[Math.max(idx-1,0)];});ref.current=n;return n;});
      });
      setStatus('Notes down');
    },
    shiftArp:()=>{
      const modes=['up','down','updown','outside'];
      const next=modes[(modes.indexOf(arpModeRef.current)+1)%modes.length];
      setArpMode(next);arpModeRef.current=next;regenerateSection(currentSectionName);setStatus(`Arp → ${next}`);
    },
    clear:()=>{
      pushUndo();
      const mode=MODES[modeName]||MODES.phrygian;
      const empty={kick:mkSteps(),snare:mkSteps(),hat:mkSteps(),bass:mkSteps(),synth:mkSteps()};
      setPatterns(empty);setBassLine(mkNotes(mode.b[0]));setSynthLine(mkNotes(mode.s[0]));
      patternsRef.current=empty;bassRef.current=mkNotes(mode.b[0]);synthRef.current=mkNotes(mode.s[0]);
      setStatus('Cleared');
    },
  };

  // ─── PRESET APPLICATION ───────────────────────────────────────────────────────
  const applyPresetData=(preset)=>{
    if(!preset)return;
    if(preset.bassMode)GENRES[genre].bassMode=preset.bassMode; // mutate for session
    if(preset.synthMode)GENRES[genre].synthMode=preset.synthMode;
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
    if(preset.genre)newGenreSession(preset.genre);
  };
  const applyBassPreset=k=>{const p=PRESETS.bass[k];if(p){setBassPreset(k);applyPresetData(p);setStatus(`Bass: ${p.label}`);}};
  const applySynthPreset=k=>{const p=PRESETS.synth[k];if(p){setSynthPreset(k);applyPresetData(p);setStatus(`Synth: ${p.label}`);}};
  const applyDrumPreset=k=>{const p=PRESETS.drum[k];if(p){setDrumPreset(k);applyPresetData(p);setStatus(`Drum: ${p.label}`);}};
  const applyPerfPreset=k=>{const p=PRESETS.performance[k];if(p){setPerfPreset(k);applyPresetData(p);setStatus(`Perf: ${p.label}`);}};

  // ─── SAVE / LOAD ─────────────────────────────────────────────────────────────
  const serialize=()=>({
    v:4,genre,modeName,bpm,currentSectionName,grooveProfile,arpMode:arpModeRef.current,
    space,tone,noiseMix,drive,compress,bassFilter,synthFilter,drumDecay,bassSubAmt,fmIdx,
    master,swing,humanize,grooveAmt,projectName,polySynth,bassStack,
    bassPreset,synthPreset,drumPreset,perfPreset,
    patterns,bassLine,synthLine,laneLen,
  });
  const applySnap=(snap)=>{
    if(!snap||snap.v!==4){setStatus('Incompatible session');return;}
    stopClock();
    genreRef.current=snap.genre||'bunker';setGenre(snap.genre||'bunker');setModeName(snap.modeName||'phrygian');
    setBpm(snap.bpm||136);bpmRef.current=snap.bpm||136;
    setCurrentSectionName(snap.currentSectionName||'groove');
    setGrooveProfile(snap.grooveProfile||'bunker');grooveProfileRef.current=snap.grooveProfile||'bunker';
    setArpMode(snap.arpMode||'up');arpModeRef.current=snap.arpMode||'up';
    setSpace(snap.space??0.18);setTone(snap.tone??0.38);setNoiseMix(snap.noiseMix??0.12);
    setDrive(snap.drive??0.45);setCompress(snap.compress??0.40);setBassFilter(snap.bassFilter??0.42);
    setSynthFilter(snap.synthFilter??0.55);setDrumDecay(snap.drumDecay??0.30);
    setBassSubAmt(snap.bassSubAmt??0.88);setFmIdx(snap.fmIdx??0.6);
    setMaster(snap.master??0.85);setSwing(snap.swing??0.01);setHumanize(snap.humanize??0.008);
    setGrooveAmt(snap.grooveAmt??0.82);setPolySynth(snap.polySynth??false);setBassStack(snap.bassStack??false);
    if(snap.projectName)setProjectName(snap.projectName);
    if(snap.patterns){setPatterns(snap.patterns);patternsRef.current=snap.patterns;}
    if(snap.bassLine){setBassLine(snap.bassLine);bassRef.current=snap.bassLine;}
    if(snap.synthLine){setSynthLine(snap.synthLine);synthRef.current=snap.synthLine;}
    if(snap.laneLen){setLaneLen(snap.laneLen);laneLenRef.current=snap.laneLen;}
    setStatus('Session loaded');
  };
  const saveScene=slot=>{setSavedScenes(p=>p.map((v,i)=>i===slot?{...serialize(),label:`S${slot+1} ${new Date().toLocaleTimeString()}`}:v));setStatus(`Scene ${slot+1} saved`);};
  const loadScene=slot=>{if(savedScenes[slot])applySnap(savedScenes[slot]);};
  const exportJSON=()=>{const b=new Blob([JSON.stringify(serialize(),null,2)],{type:'application/json'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=`${projectName.replace(/\s+/g,'-')}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(u),500);setStatus('Exported');};
  const importRef=useRef(null);
  const importJSON=async e=>{const f=e.target.files?.[0];if(!f)return;try{const t=await f.text();applySnap(JSON.parse(t));}catch{setStatus('Import failed');}finally{e.target.value='';};};

  // ─── RECORDING ───────────────────────────────────────────────────────────────
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
      const blob=new Blob(chunksRef.current,{type:ft});const url=URL.createObjectURL(blob);
      setRecordings(p=>[{url,name:`${projectName.replace(/\s+/g,'-')}-take-${p.length+1}.${ext}`,time:new Date().toLocaleTimeString()},...p.slice(0,7)]);
      setRecState('idle');setStatus('Take saved');
    };
    rec.start();setRecState('recording');setStatus('● REC');
  };
  const stopRec=()=>{if(recorderRef.current&&recState==='recording'){recorderRef.current.stop();setRecState('stopping');}};

  // ─── TAP TEMPO ───────────────────────────────────────────────────────────────
  const tapTempo=()=>{
    const now=Date.now();
    setTapTimes(prev=>{
      const next=[...prev.filter(t=>now-t<3000),now];
      if(next.length>=2){const intervals=next.slice(1).map((t,i)=>t-next[i]);const avg=intervals.reduce((a,b)=>a+b,0)/intervals.length;const nb=clamp(Math.round(60000/avg),80,220);setBpm(nb);bpmRef.current=nb;setStatus(`TAP → ${nb} BPM`);}
      return next.slice(-6);
    });
  };

  // ─── MIDI ────────────────────────────────────────────────────────────────────
  useEffect(()=>{
    if(!navigator.requestMIDIAccess)return;
    navigator.requestMIDIAccess().then(m=>{midiRef.current=m;setMidiOk(true);}).catch(()=>{});
  },[]);

  // ─── KEYBOARD ────────────────────────────────────────────────────────────────
  useEffect(()=>{
    const onKey=e=>{
      if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT')return;
      if(e.code==='Space'){e.preventDefault();togglePlay();}
      else if(e.code==='KeyA')perfActions.drop();
      else if(e.code==='KeyS')perfActions.break();
      else if(e.code==='KeyD')perfActions.build();
      else if(e.code==='KeyF')perfActions.groove();
      else if(e.code==='KeyG')perfActions.tension();
      else if(e.code==='KeyH')perfActions.fill();
      else if(e.code==='KeyP')triggerSection('peak');
      else if(e.code==='KeyM')perfActions.mutate();
      else if(e.code==='KeyR')regenerateSection(currentSectionName);
      else if(e.code==='KeyO')setAutopilot(v=>!v);
      else if(e.code==='KeyT')tapTempo();
      else if(e.code==='KeyZ'&&(e.metaKey||e.ctrlKey)){e.preventDefault();undo();}
    };
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  },[currentSectionName,genre]);

  // ─── VISUALIZER ──────────────────────────────────────────────────────────────
  useEffect(()=>{
    let rafId;
    const draw=()=>{
      rafId=requestAnimationFrame(draw);
      const an=analyserRef.current;if(!an||!vizRef.current)return;
      const data=new Uint8Array(an.frequencyBinCount);
      an.getByteFrequencyData(data);
      const canvas=vizRef.current;const ctx=canvas.getContext('2d');
      const W=canvas.width,H=canvas.height;
      ctx.clearRect(0,0,W,H);
      const gc=GENRE_CLR[genre]||'#ff2233';
      const barW=W/data.length;
      for(let i=0;i<data.length;i++){
        const v=(data[i]/255)*H;
        const alpha=0.25+v/H*0.75;
        ctx.fillStyle=`${gc}${Math.round(alpha*255).toString(16).padStart(2,'0')}`;
        ctx.fillRect(i*barW,H-v,barW-0.5,v);
      }
    };
    draw();
    return()=>cancelAnimationFrame(rafId);
  },[genre]);

  // ─── INIT ────────────────────────────────────────────────────────────────────
  useEffect(()=>{
    newGenreSession('bunker');
  },[]);

  // ─── RENDER HELPERS ──────────────────────────────────────────────────────────
  const gcl=GENRE_CLR[genre]||'#ff2233';
  const gd=GENRES[genre]||GENRES.bunker;
  const visibleSteps=Array.from({length:PAGE},(_,i)=>page*PAGE+i);
  const [W,setW]=useState(typeof window!=='undefined'?window.innerWidth:1400);
  useEffect(()=>{const fn=()=>setW(window.innerWidth);window.addEventListener('resize',fn);return()=>window.removeEventListener('resize',fn);},[]);
  const isCompact=W<1200;const isPhone=W<820;

  const mono='Space Mono,monospace';
  const S={ // style shortcuts
    row:{display:'flex',alignItems:'center',gap:4},
    col:{display:'flex',flexDirection:'column'},
    label:{fontSize:9,letterSpacing:'0.12em',color:'rgba(255,255,255,0.42)',textTransform:'uppercase',fontFamily:mono},
    val:{fontSize:10,color:'rgba(255,255,255,0.82)',fontFamily:mono},
    btn:(active,color='rgba(255,255,255,0.08)')=>({
      padding:'3px 8px',borderRadius:3,border:`1px solid ${active?color+'88':'rgba(255,255,255,0.08)'}`,
      background:active?`${color}22`:'rgba(255,255,255,0.02)',
      color:active?color:'rgba(255,255,255,0.55)',
      fontSize:10,fontWeight:700,cursor:'pointer',fontFamily:mono,letterSpacing:'0.06em',
      transition:'all 0.08s',
    }),
    secBtn:(name)=>{
      const c=SECTION_COLORS[name]||'#fff';const isA=currentSectionName===name;
      return{padding:'5px 6px',borderRadius:3,border:`1px solid ${isA?c:c+'33'}`,
        background:isA?`${c}20`:`${c}06`,color:isA?c:`${c}77`,
        fontSize:9,fontWeight:700,cursor:'pointer',fontFamily:mono,letterSpacing:'0.08em',
        textTransform:'uppercase',boxShadow:isA?`0 0 8px ${c}44`:'none',transition:'all 0.08s',
        display:'flex',justifyContent:'space-between',alignItems:'center',
      };
    },
  };

  const PresetSel=({label,value,options,onChange,accent})=>(
    <label style={{...S.col,gap:2,minWidth:isCompact?96:116}}>
      <span style={S.label}>{label}</span>
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${accent}33`,color:accent,
          borderRadius:4,padding:'3px 5px',fontSize:9,fontFamily:mono,outline:'none'}}>
        {Object.entries(options).map(([k,p])=>
          <option key={k} value={k} style={{color:'#111',background:'#f2f2f2'}}>{p.label}</option>
        )}
      </select>
    </label>
  );

  const Knob=({label,value,min=0,max=1,step=0.01,onChange,color='rgba(255,255,255,0.7)'})=>{
    const pct=((value-min)/(max-min)*100).toFixed(0);
    return(
      <div style={{...S.col,alignItems:'center',gap:1,minWidth:44}}>
        <span style={{...S.label,fontSize:8}}>{label}</span>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e=>onChange(Number(e.target.value))}
          style={{width:40,accentColor:color,color}}/>
        <span style={{fontSize:9,color,fontFamily:mono}}>{pct}</span>
      </div>
    );
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────────
  return(
    <div style={{width:'100vw',height:'100dvh',background:'#060608',color:'#e8e8e8',
      fontFamily:"'DM Sans',sans-serif",display:'flex',flexDirection:'column',
      overflow:'hidden',userSelect:'none',position:'relative'}}>

      {/* Scanline */}
      <div style={{position:'fixed',inset:0,backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.08) 2px,rgba(0,0,0,0.08) 4px)',pointerEvents:'none',zIndex:999}}/>

      {/* ── TOP BAR ────────────────────────────────────────────────────────── */}
      <div style={{display:'flex',alignItems:'center',flexWrap:'wrap',gap:5,
        padding:'5px 10px',borderBottom:'1px solid rgba(255,255,255,0.06)',
        flexShrink:0,background:'rgba(0,0,0,0.45)',minHeight:40}}>

        {/* Logo + status */}
        <div style={{...S.col,gap:1}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:'0.28em',color:gc,fontFamily:mono}}>CESIRA V4</div>
          <div style={{fontSize:8,color:'rgba(255,255,255,0.35)',letterSpacing:'0.12em',fontFamily:mono,
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160}}>
            {recState==='recording'&&<span style={{color:'#ff2244',marginRight:3}}>●</span>}{status}
          </div>
        </div>

        {/* Genre pills */}
        <div style={{display:'flex',gap:2,flexWrap:'wrap'}}>
          {GENRE_NAMES.map(g=>(
            <button key={g} onClick={()=>newGenreSession(g)} style={{
              padding:'3px 7px',borderRadius:2,cursor:'pointer',fontFamily:mono,
              border:`1px solid ${genre===g?GENRE_CLR[g]:'rgba(255,255,255,0.07)'}`,
              background:genre===g?`${GENRE_CLR[g]}18`:'transparent',
              color:genre===g?GENRE_CLR[g]:'rgba(255,255,255,0.55)',
              fontSize:9,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',
            }}>{GENRES[g].label}</button>
          ))}
        </div>

        <div style={{flex:1}}/>

        {/* Visualizer */}
        {!isPhone&&<canvas ref={vizRef} width={100} height={20} style={{opacity:0.7,borderRadius:2}}/>}

        {/* BPM */}
        <div style={{...S.row,background:'rgba(255,255,255,0.05)',borderRadius:4,padding:'2px 5px',border:'1px solid rgba(255,255,255,0.10)'}}>
          <button onClick={()=>{const v=clamp(bpm-5,80,220);setBpm(v);bpmRef.current=v;}}
            style={{...S.btn(false),padding:'2px 5px',border:'none',background:'transparent'}}>−</button>
          <div style={{textAlign:'center',minWidth:34}}>
            <div style={{fontSize:14,fontWeight:700,color:gc,fontFamily:mono,lineHeight:1}}>{bpm}</div>
            <div style={{fontSize:8,color:'rgba(255,255,255,0.4)',letterSpacing:'0.1em'}}>BPM</div>
          </div>
          <button onClick={()=>{const v=clamp(bpm+5,80,220);setBpm(v);bpmRef.current=v;}}
            style={{...S.btn(false),padding:'2px 5px',border:'none',background:'transparent'}}>+</button>
          <button onClick={tapTempo}
            style={{...S.btn(false),padding:'2px 6px',fontSize:9,marginLeft:2}}>TAP</button>
        </div>

        {/* Presets — condensed */}
        <PresetSel label="BASS"  value={bassPreset}  options={PRESETS.bass}        onChange={applyBassPreset}  accent='#00bbff'/>
        <PresetSel label="SYNTH" value={synthPreset} options={PRESETS.synth}       onChange={applySynthPreset} accent={gcl}/>
        <PresetSel label="DRUM"  value={drumPreset}  options={PRESETS.drum}        onChange={applyDrumPreset}  accent='#ff9900'/>
        <PresetSel label="PERF"  value={perfPreset}  options={PRESETS.performance} onChange={applyPerfPreset}  accent='#44ffcc'/>

        {/* Transport */}
        <button onClick={togglePlay} style={{
          padding:'5px 16px',borderRadius:3,border:'none',fontFamily:mono,
          background:isPlaying?'#ff2244':'#00cc55',color:'#000',
          fontSize:10,fontWeight:700,cursor:'pointer',letterSpacing:'0.1em',
          boxShadow:isPlaying?'0 0 14px #ff224466':'0 0 14px #00cc5566',
        }}>{isPlaying?'■ STOP':'▶ PLAY'}</button>

        {/* Autopilot DJ */}
        <button onClick={()=>setAutopilot(v=>!v)} style={{
          padding:'4px 9px',borderRadius:3,fontFamily:mono,
          border:`1px solid ${autopilot?gcl:'rgba(255,255,255,0.1)'}`,
          background:autopilot?`${gcl}22`:'transparent',
          color:autopilot?gcl:'rgba(255,255,255,0.35)',
          fontSize:10,fontWeight:700,cursor:'pointer',
          boxShadow:autopilot?`0 0 12px ${gcl}55`:'none',
        }}>{autopilot?'◈ DJ AUTO':'○ DJ AUTO'}</button>

        {/* View */}
        <div style={{...S.row,gap:2}}>
          {['perform','studio','song'].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{...S.btn(view===v,gcl),padding:'3px 7px',textTransform:'uppercase'}}>{v}</button>
          ))}
        </div>

        {/* Save/load icons */}
        <button onClick={exportJSON} style={{...S.btn(false),padding:'3px 6px'}} title="Export">💾</button>
        <button onClick={()=>importRef.current?.click()} style={{...S.btn(false),padding:'3px 6px'}} title="Import">📂</button>
        <input ref={importRef} type="file" accept=".json" onChange={importJSON} style={{display:'none'}}/>
        <div style={{width:5,height:5,borderRadius:'50%',background:midiOk?'#00ff88':'rgba(255,255,255,0.12)'}} title={midiOk?'MIDI':'No MIDI'}/>
      </div>

      {/* ── CONTEXT BAR ────────────────────────────────────────────────────── */}
      <div style={{display:'flex',alignItems:'center',gap:6,padding:'2px 10px',
        background:'rgba(0,0,0,0.28)',borderBottom:'1px solid rgba(255,255,255,0.04)',
        flexShrink:0,height:20,fontFamily:mono,overflow:'hidden'}}>
        <span style={{fontSize:9,color:'rgba(255,255,255,0.28)',letterSpacing:'0.1em'}}>{gd.description.toUpperCase()}</span>
        <span style={{color:'rgba(255,255,255,0.18)',fontSize:9}}>·</span>
        <span style={{fontSize:9,fontWeight:700,color:gcl}}>{genre.toUpperCase()}</span>
        <span style={{color:'rgba(255,255,255,0.18)',fontSize:9}}>·</span>
        <span style={{fontSize:9,color:'rgba(255,255,255,0.42)'}}>{currentSectionName}</span>
        <span style={{color:'rgba(255,255,255,0.18)',fontSize:9}}>·</span>
        <span style={{fontSize:9,color:'rgba(255,255,255,0.42)'}}>{modeName}</span>
        <span style={{color:'rgba(255,255,255,0.18)',fontSize:9}}>·</span>
        <span style={{fontSize:9,color:'rgba(255,255,255,0.42)'}}>arp:{arpMode}</span>
        <div style={{flex:1}}/>
        {songActive&&<span style={{fontSize:9,color:'#ffaa00'}}>ARC {arcIdx+1}/{songArc.length}</span>}
        {autopilot&&<span style={{fontSize:9,color:gcl}}>◈ DJ AUTO — {djPhaseRef.current} E:{Math.round(djEnergyRef.current*100)}%</span>}
        {!isPhone&&<span style={{fontSize:8,color:'rgba(255,255,255,0.2)',letterSpacing:'0.04em'}}>SPC=play A=drop S=break D=build F=groove G=tension H=fill P=peak M=mutate R=regen O=auto T=tap Z=undo</span>}
      </div>

      {/* ── PERFORM VIEW ───────────────────────────────────────────────────── */}
      {view==='perform'&&(
        <div style={{flex:1,display:'flex',flexDirection:isCompact?'column':'row',gap:0,minHeight:0,overflow:'hidden'}}>

          {/* LEFT — Section triggers */}
          <div style={{width:isCompact?'100%':120,display:'flex',flexDirection:'column',gap:2,
            padding:'8px 8px',flexShrink:0,borderRight:'1px solid rgba(255,255,255,0.05)',
            overflowY:'auto',background:'rgba(0,0,0,0.2)'}}>
            <div style={{...S.label,marginBottom:2}}>SECTIONS</div>
            {Object.keys(SECTIONS).map(sec=>{
              const c=SECTION_COLORS[sec]||'#fff';
              const shortcuts={drop:'A',break:'S',build:'D',groove:'F',tension:'G',fill:'H',peak:'P'};
              return(
                <button key={sec} onClick={()=>triggerSection(sec)} style={S.secBtn(sec)}>
                  <span>{sec}</span>
                  {shortcuts[sec]&&<span style={{fontSize:8,opacity:0.35}}>[{shortcuts[sec]}]</span>}
                </button>
              );
            })}

            <div style={{...S.label,marginTop:6,marginBottom:2}}>ACTIONS</div>
            {[
              {l:'MUTATE',k:'mutate',s:'M'},{l:'THIN',k:'thinOut'},{l:'THICKEN',k:'thicken'},
              {l:'REHARM',k:'reharmonize'},{l:'ARP→',k:'shiftArp'},{l:'REGEN',k:'_regen',s:'R'},
              {l:'RND BASS',k:'randomizeBass'},{l:'RND SYNTH',k:'randomizeNotes'},
              {l:'NOTES ↑',k:'shiftUp'},{l:'NOTES ↓',k:'shiftDown'},{l:'CLEAR',k:'clear'},
            ].map(({l,k,s})=>(
              <button key={k} onClick={()=>k==='_regen'?regenerateSection(currentSectionName):perfActions[k]?.()} style={{
                padding:'3px 5px',borderRadius:2,border:'1px solid rgba(255,255,255,0.07)',
                background:'rgba(255,255,255,0.015)',color:'rgba(255,255,255,0.58)',
                fontSize:9,fontWeight:700,cursor:'pointer',fontFamily:mono,
                display:'flex',justifyContent:'space-between',alignItems:'center',
              }}>
                <span>{l}</span>
                {s&&<span style={{fontSize:8,opacity:0.32}}>[{s}]</span>}
              </button>
            ))}

            <div style={{...S.label,marginTop:6,marginBottom:2}}>SONG ARC</div>
            <button onClick={songActive?stopSongArc:startSongArc} style={{
              padding:'5px',borderRadius:3,cursor:'pointer',fontFamily:mono,textAlign:'center',
              border:`1px solid ${songActive?'#ff2244':gcl+'55'}`,
              background:songActive?'rgba(255,34,68,0.12)':`${gcl}0e`,
              color:songActive?'#ff2244':gc,fontSize:9,fontWeight:700,
            }}>{songActive?'■ STOP ARC':'▶ START ARC'}</button>
            {songActive&&(
              <div style={{display:'flex',gap:2,flexWrap:'wrap',marginTop:2}}>
                {songArc.map((s,i)=>(
                  <div key={i} style={{width:i===arcIdx?18:10,height:4,borderRadius:2,transition:'all 0.2s',
                    background:i===arcIdx?(SECTION_COLORS[s]||gcl):i<arcIdx?'rgba(255,255,255,0.25)':'rgba(255,255,255,0.06)'}}/>
                ))}
              </div>
            )}
          </div>

          {/* CENTER — Grid + VU */}
          <div style={{flex:1,display:'flex',flexDirection:'column',gap:0,minWidth:0,overflow:'hidden'}}>
            {/* Section + page nav */}
            <div style={{...S.row,padding:'6px 10px',flexShrink:0,borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
              <span style={{fontSize:14,fontWeight:700,color:SECTION_COLORS[currentSectionName]||gc,
                letterSpacing:'0.14em',textTransform:'uppercase',fontFamily:mono,
                textShadow:`0 0 18px ${(SECTION_COLORS[currentSectionName]||gcl)}55`}}>
                {currentSectionName}
              </span>
              <span style={{fontSize:9,color:'rgba(255,255,255,0.35)',marginLeft:8,fontFamily:mono}}>
                {genre} · {modeName}
              </span>
              <div style={{flex:1}}/>
              <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}
                style={{...S.btn(false),opacity:page===0?0.25:1,padding:'2px 7px'}}>‹</button>
              <span style={{fontSize:9,color:'rgba(255,255,255,0.4)',fontFamily:mono}}>{page+1}/4</span>
              <button onClick={()=>setPage(p=>Math.min(3,p+1))} disabled={page===3}
                style={{...S.btn(false),opacity:page===3?0.25:1,padding:'2px 7px'}}>›</button>
            </div>

            {/* Lane grids */}
            <div style={{flex:1,display:'flex',flexDirection:'column',gap:2,padding:'6px 10px',overflowY:'auto'}}>
              {['kick','snare','hat','bass','synth'].map(lane=>{
                const lc=LANE_CLR[lane];
                const ll=laneLen[lane]||16;
                const vu=laneVU[lane]||0;
                return(
                  <div key={lane} style={{display:'flex',alignItems:'stretch',gap:6,minHeight:0,flex:1}}>
                    {/* Label + VU */}
                    <div style={{width:44,flexShrink:0,...S.col,justifyContent:'center',gap:2}}>
                      <span style={{fontSize:9,fontWeight:700,color:lc,letterSpacing:'0.14em',textTransform:'uppercase',fontFamily:mono}}>{lane}</span>
                      <div style={{height:3,borderRadius:2,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${vu*100}%`,background:lc,borderRadius:2,transition:'width 0.04s',boxShadow:`0 0 5px ${lc}`}}/>
                      </div>
                      {(lane==='bass'||lane==='synth')&&(
                        <span style={{fontSize:8,color:'rgba(255,255,255,0.35)',fontFamily:mono,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:40}}>
                          {activeNotes[lane]}
                        </span>
                      )}
                    </div>
                    {/* Steps */}
                    <div style={{flex:1,display:'grid',gridTemplateColumns:`repeat(${visibleSteps.length},1fr)`,gap:1.5,alignItems:'stretch'}}>
                      {visibleSteps.map(idx=>{
                        if(idx>=ll)return<div key={idx} style={{borderRadius:2,background:'rgba(255,255,255,0.01)',opacity:0.2}}/>;
                        const sd=patterns[lane][idx];
                        const on=sd.on,isActive=step===idx&&isPlaying;
                        const isTied=sd.tied;
                        const isBeat=idx%4===0,isBar=idx%16===0;
                        const borderC=isActive?lc:isBar?`${lc}44`:isBeat?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.025)';
                        const bgC=isActive?`${lc}88`:isTied?`${lc}18`:on?`${lc}${Math.round(clamp(sd.p||1,0.3,1)*220).toString(16).padStart(2,'0')}`:'rgba(255,255,255,0.018)';
                        return(
                          <button key={idx} onClick={()=>{pushUndo();setPatterns(p=>{const n={...p,[lane]:p[lane].map((s,i)=>i===idx?{...s,on:!s.on}:s)};patternsRef.current=n;return n;});}} style={{
                            borderRadius:isTied?'1px 2px 2px 1px':'2px',
                            border:`1px solid ${borderC}`,
                            borderLeft:isTied?`2px solid ${lc}44`:`1px solid ${borderC}`,
                            background:bgC,
                            boxShadow:isActive?`0 0 8px ${lc}77`:on&&!isTied?`0 0 2px ${lc}22`:'none',
                            cursor:'pointer',transition:'background 0.03s',
                          }}/>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Note display row */}
              <div style={{display:'flex',gap:1.5,height:11,flexShrink:0}}>
                {visibleSteps.map(idx=>{
                  const bn=bassLine[idx],sn=synthLine[idx];
                  const hb=patterns.bass[idx]?.on,hs=patterns.synth[idx]?.on;
                  return(
                    <div key={idx} style={{flex:1,textAlign:'center'}}>
                      {(hb||hs)&&<span style={{fontSize:7,color:'rgba(255,255,255,0.28)',fontFamily:mono}}>
                        {hb?bn?.replace(/[0-9]/g,''):sn?.replace(/[0-9]/g,'')}
                      </span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT — Macros + Scenes */}
          <div style={{width:isCompact?'100%':130,display:'flex',flexDirection:'column',gap:3,
            padding:'8px 8px',flexShrink:0,borderLeft:'1px solid rgba(255,255,255,0.05)',
            overflowY:'auto',background:'rgba(0,0,0,0.15)'}}>

            <div style={S.label}>MACROS</div>
            {[
              {l:'MASTER',v:master,s:setMaster,c:'#fff',max:1},
              {l:'SPACE',v:space,s:setSpace,c:'#44ffcc',max:1},
              {l:'TONE',v:tone,s:setTone,c:'#22d3ee',max:1},
              {l:'DRIVE',v:drive,s:setDrive,c:'#ff8844',max:1},
              {l:'GROOVE',v:grooveAmt,s:v=>{setGrooveAmt(v);grooveRef.current=v;},c:'#ffdd00',max:1},
              {l:'SWING',v:swing,s:v=>{setSwing(v);swingRef.current=v;},c:'#aa88ff',max:0.25},
              {l:'AUTO INT',v:autopilotIntensity,s:setAutopilotIntensity,c:gc,max:1},
            ].map(({l,v,s,c,max})=>(
              <div key={l} style={{marginBottom:1}}>
                <div style={{...S.row,justifyContent:'space-between',marginBottom:0}}>
                  <span style={{fontSize:8,color:'rgba(255,255,255,0.38)',textTransform:'uppercase',fontFamily:mono,letterSpacing:'0.06em'}}>{l}</span>
                  <span style={{fontSize:8,color:c,fontFamily:mono}}>{Math.round((v/max)*100)}</span>
                </div>
                <input type="range" min={0} max={max} step={max/100} value={v}
                  onChange={e=>s(Number(e.target.value))}
                  style={{width:'100%',accentColor:c,height:12}}/>
              </div>
            ))}

            <div style={{...S.label,marginTop:4}}>GROOVE</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:2}}>
              {['steady','broken','bunker','float'].map(gp=>(
                <button key={gp} onClick={()=>{setGrooveProfile(gp);grooveProfileRef.current=gp;}} style={{
                  padding:'3px',borderRadius:2,fontSize:8,cursor:'pointer',fontFamily:mono,textTransform:'uppercase',
                  border:`1px solid ${grooveProfile===gp?gcl:'rgba(255,255,255,0.07)'}`,
                  background:grooveProfile===gp?`${gcl}18`:'rgba(255,255,255,0.02)',
                  color:grooveProfile===gp?gcl:'rgba(255,255,255,0.45)',
                }}>{gp}</button>
              ))}
            </div>

            <div style={{flex:1}}/>

            <div style={S.label}>SCENES</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:2}}>
              {savedScenes.map((sc2,i)=>(
                <div key={i} style={{...S.col,gap:1}}>
                  <button onClick={()=>loadScene(i)} style={{
                    padding:'3px 2px',borderRadius:2,cursor:'pointer',fontFamily:mono,textAlign:'center',
                    border:`1px solid ${sc2?gcl+'44':'rgba(255,255,255,0.07)'}`,
                    background:sc2?`${gcl}0e`:'rgba(255,255,255,0.01)',
                    color:sc2?gcl:'rgba(255,255,255,0.38)',fontSize:9,fontWeight:700,
                  }}>S{i+1}{sc2?'◆':''}</button>
                  <button onClick={()=>saveScene(i)} style={{padding:'1px',borderRadius:2,
                    border:'1px solid rgba(255,255,255,0.05)',background:'rgba(255,255,255,0.01)',
                    color:'rgba(255,255,255,0.3)',fontSize:8,cursor:'pointer',fontFamily:mono,textAlign:'center'}}>
                    SAVE
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── STUDIO VIEW ────────────────────────────────────────────────────── */}
      {view==='studio'&&(
        <div style={{flex:1,display:'flex',flexDirection:isCompact?'column':'row',gap:0,minHeight:0,overflow:'hidden'}}>
          {/* Grid side */}
          <div style={{flex:1,display:'flex',flexDirection:'column',gap:3,padding:'8px 10px',minWidth:0,overflowY:'auto'}}>
            <div style={{...S.row,marginBottom:2}}>
              <span style={{fontSize:10,color:'rgba(255,255,255,0.45)',fontFamily:mono,letterSpacing:'0.08em'}}>
                {genre.toUpperCase()} · {modeName.toUpperCase()} · {currentSectionName.toUpperCase()}
              </span>
              <div style={{flex:1}}/>
              <button onClick={undo} disabled={undoLen===0} style={{...S.btn(false),opacity:undoLen>0?1:0.3}}>↩({undoLen})</button>
              <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{...S.btn(false),opacity:page===0?0.25:1}}>‹</button>
              <span style={{fontSize:9,color:'rgba(255,255,255,0.4)',fontFamily:mono}}>pg {page+1}/4</span>
              <button onClick={()=>setPage(p=>Math.min(3,p+1))} disabled={page===3} style={{...S.btn(false),opacity:page===3?0.25:1}}>›</button>
            </div>

            {['kick','snare','hat','bass','synth'].map(lane=>{
              const lc=LANE_CLR[lane];const ll=laneLen[lane]||16;const vu=laneVU[lane]||0;
              return(
                <div key={lane} style={{display:'flex',alignItems:'stretch',gap:5,flex:1,minHeight:32}}>
                  <div style={{width:40,flexShrink:0,...S.col,justifyContent:'center',gap:2}}>
                    <span style={{fontSize:9,fontWeight:700,color:lc,letterSpacing:'0.12em',textTransform:'uppercase',fontFamily:mono}}>{lane}</span>
                    <div style={{height:2,borderRadius:1,background:'rgba(255,255,255,0.05)',overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${vu*100}%`,background:lc,borderRadius:1,transition:'width 0.04s'}}/>
                    </div>
                  </div>
                  <div style={{flex:1,display:'grid',gridTemplateColumns:`repeat(${visibleSteps.length},1fr)`,gap:1.5,alignItems:'stretch'}}>
                    {visibleSteps.map(idx=>{
                      if(idx>=ll)return<div key={idx} style={{borderRadius:2,background:'rgba(255,255,255,0.01)',opacity:0.3}}/>;
                      const sd=patterns[lane][idx];const on=sd.on,isActive=step===idx;
                      const isBeat=idx%4===0,isBar=idx%16===0;
                      return(
                        <button key={idx} onClick={()=>{pushUndo();setPatterns(p=>{const n={...p,[lane]:p[lane].map((s,i)=>i===idx?{...s,on:!s.on}:s)};patternsRef.current=n;return n;});}} style={{
                          borderRadius:2,border:`1px solid ${isActive?lc:isBar?`${lc}38`:isBeat?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.025)'}`,
                          background:isActive?`${lc}77`:on?`${lc}66`:'rgba(255,255,255,0.018)',
                          cursor:'pointer',transition:'background 0.03s',
                        }}/>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Note editor */}
            <div style={{borderTop:'1px solid rgba(255,255,255,0.05)',paddingTop:6}}>
              {['bass','synth'].map(lane=>{
                const lc=LANE_CLR[lane];const ll=laneLen[lane]||16;
                const mode=MODES[modeName]||MODES.phrygian;const pool=lane==='bass'?mode.b:mode.s;
                return(
                  <div key={lane} style={{marginBottom:4}}>
                    <span style={{...S.label,color:lc,marginBottom:2}}>{lane} notes</span>
                    <div style={{display:'grid',gridTemplateColumns:`repeat(${visibleSteps.length},1fr)`,gap:1.5}}>
                      {visibleSteps.map(idx=>{
                        if(idx>=ll)return<div key={idx}/>;
                        const isOn=patterns[lane][idx]?.on;
                        const curNote=lane==='bass'?bassLine[idx]:synthLine[idx];
                        const cur=pool.indexOf(curNote);
                        return(
                          <button key={idx} disabled={!isOn} onClick={()=>{if(!isOn)return;const next=pool[(cur+1)%pool.length];if(lane==='bass')setBassLine(p=>{const n=[...p];n[idx]=next;bassRef.current=n;return n;});else setSynthLine(p=>{const n=[...p];n[idx]=next;synthRef.current=n;return n;});}} style={{
                            opacity:isOn?1:0.15,padding:'2px 0',borderRadius:2,
                            border:`1px solid ${isOn?lc+'44':'rgba(255,255,255,0.04)'}`,
                            background:isOn?`${lc}18`:'rgba(255,255,255,0.01)',
                            color:isOn?lc:'rgba(255,255,255,0.4)',fontSize:8,
                            cursor:isOn?'pointer':'default',fontFamily:mono,textAlign:'center',
                          }}>{curNote?.replace(/[0-9]/g,'')||'—'}</button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls side */}
          <div style={{width:isCompact?'100%':200,display:'flex',flexDirection:'column',
            borderLeft:isCompact?'none':'1px solid rgba(255,255,255,0.05)',flexShrink:0}}>
            <div style={{flex:1,overflowY:'auto',padding:'8px 10px',...S.col,gap:3}}>
              <div style={S.label}>SYNTHESIS PARAMS</div>
              {[
                {l:'MASTER',v:master,s:setMaster,c:'#fff',max:1},
                {l:'SPACE',v:space,s:setSpace,c:'#44ffcc',max:1},
                {l:'TONE',v:tone,s:setTone,c:'#22d3ee',max:1},
                {l:'NOISE',v:noiseMix,s:setNoiseMix,c:'#aaa',max:1},
                {l:'DRIVE',v:drive,s:setDrive,c:'#ff8844',max:1},
                {l:'COMPRESS',v:compress,s:setCompress,c:'#ffaa44',max:1},
                {l:'BASS FILTER',v:bassFilter,s:setBassFilter,c:'#00bbff',max:1},
                {l:'BASS SUB',v:bassSubAmt,s:setBassSubAmt,c:'#00bbff',max:1},
                {l:'SYNTH FILTER',v:synthFilter,s:setSynthFilter,c:'#bb77ff',max:1},
                {l:'DRUM DECAY',v:drumDecay,s:setDrumDecay,c:'#ff3344',max:1},
                {l:'SWING',v:swing,s:v=>{setSwing(v);swingRef.current=v;},c:'#aa88ff',max:0.25},
                {l:'HUMANIZE',v:humanize,s:v=>{setHumanize(v);humanizeRef.current=v;},c:'#88aaff',max:0.05},
                {l:'GROOVE AMT',v:grooveAmt,s:v=>{setGrooveAmt(v);grooveRef.current=v;},c:'#ffdd00',max:1},
                {l:'FM INDEX',v:fmIdx,s:v=>{setFmIdx(v);fmIdxRef.current=v;},c:'#cc88ff',max:3},
              ].map(({l,v,s,c,max})=>{
                const pct=((v/max)*100).toFixed(0);
                return(
                  <div key={l}>
                    <div style={{...S.row,justifyContent:'space-between'}}>
                      <span style={S.label}>{l}</span>
                      <span style={{fontSize:8,color:c,fontFamily:mono}}>{pct}</span>
                    </div>
                    <input type="range" min={0} max={max} step={max/200} value={v}
                      onChange={e=>s(Number(e.target.value))}
                      style={{width:'100%',accentColor:c,height:12}}/>
                  </div>
                );
              })}

              <div style={{...S.label,marginTop:4}}>POLY / STACK</div>
              <div style={{...S.row,gap:3}}>
                <button onClick={()=>setPolySynth(v=>!v)} style={{...S.btn(polySynth,gcl),flex:1}}>POLY {polySynth?'ON':'OFF'}</button>
                <button onClick={()=>setBassStack(v=>!v)} style={{...S.btn(bassStack,'#00bbff'),flex:1}}>STACK {bassStack?'ON':'OFF'}</button>
              </div>

              <div style={{...S.label,marginTop:4}}>SECTION GENERATOR</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:2}}>
                {Object.keys(SECTIONS).map(sec=>(
                  <button key={sec} onClick={()=>regenerateSection(sec)} style={{
                    padding:'4px 3px',borderRadius:2,fontSize:8,cursor:'pointer',fontFamily:mono,textTransform:'uppercase',
                    border:`1px solid ${currentSectionName===sec?gcl:'rgba(255,255,255,0.07)'}`,
                    background:currentSectionName===sec?`${gcl}18`:'rgba(255,255,255,0.02)',
                    color:currentSectionName===sec?gcl:'rgba(255,255,255,0.45)',
                  }}>{sec}</button>
                ))}
              </div>

              <div style={{...S.label,marginTop:4}}>SESSION</div>
              <button onClick={recState==='idle'?startRec:stopRec} style={{
                padding:'6px',borderRadius:3,textAlign:'center',cursor:'pointer',fontFamily:mono,
                border:`1px solid ${recState==='recording'?'#ff2244':'rgba(255,255,255,0.12)'}`,
                background:recState==='recording'?'rgba(255,34,68,0.12)':'rgba(255,255,255,0.03)',
                color:recState==='recording'?'#ff2244':'rgba(255,255,255,0.45)',fontSize:10,fontWeight:700,
              }}>{recState==='recording'?'■ STOP REC':'● REC'}</button>

              {recordings.map((r,i)=>(
                <div key={i} style={{...S.row,padding:'3px 5px',borderRadius:3,background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.05)'}}>
                  <audio src={r.url} controls style={{flex:1,height:20,filter:'invert(1)',opacity:0.65}}/>
                  <a href={r.url} download={r.name} style={{color:gc,fontSize:8,textDecoration:'none',fontFamily:mono}}>DL</a>
                </div>
              ))}

              <div style={{...S.label,marginTop:4}}>SCENES (6)</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:2}}>
                {savedScenes.map((sc2,i)=>(
                  <div key={i} style={{...S.col,gap:1}}>
                    <button onClick={()=>loadScene(i)} style={{padding:'4px',borderRadius:3,cursor:'pointer',fontFamily:mono,textAlign:'center',
                      border:`1px solid ${sc2?gcl+'44':'rgba(255,255,255,0.07)'}`,background:sc2?`${gcl}0d`:'rgba(255,255,255,0.02)',
                      color:sc2?gcl:'rgba(255,255,255,0.4)',fontSize:9}}>S{i+1}{sc2?' ◆':''}</button>
                    <button onClick={()=>saveScene(i)} style={{padding:'2px',borderRadius:2,border:'1px solid rgba(255,255,255,0.06)',
                      background:'rgba(255,255,255,0.02)',color:'rgba(255,255,255,0.3)',fontSize:8,cursor:'pointer',fontFamily:mono,textAlign:'center'}}>SAVE</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SONG VIEW ──────────────────────────────────────────────────────── */}
      {view==='song'&&(
        <div style={{flex:1,display:'flex',flexDirection:isCompact?'column':'row',gap:8,
          padding:'10px 14px',minHeight:0,overflowY:'auto'}}>
          <div style={{width:isCompact?'100%':280,...S.col,gap:8,flexShrink:0}}>
            <div style={{padding:16,borderRadius:8,border:`1px solid ${gcl}33`,background:`${gcl}08`}}>
              <div style={{fontSize:18,fontWeight:700,color:gc,letterSpacing:'0.2em',marginBottom:4,fontFamily:mono}}>{GENRES[genre].label}</div>
              <div style={{fontSize:10,color:'rgba(255,255,255,0.5)',marginBottom:10,fontFamily:mono}}>{gd.description}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
                {[
                  {l:'BPM',v:`${gd.bpm[0]}–${gd.bpm[1]}`},{l:'CURRENT',v:bpm},
                  {l:'MODE',v:modeName},{l:'GROOVE',v:gd.grooveDefault},
                  {l:'DENSITY',v:`${Math.round(gd.density*100)}%`},{l:'CHAOS',v:`${Math.round(gd.chaos*100)}%`},
                  {l:'BASS',v:gd.bassMode},{l:'SYNTH',v:gd.synthMode},
                  {l:'TENSION',v:`${Math.round((gd.tension||0.5)*100)}%`},{l:'ENERGY',v:`${Math.round((gd.energy||0.5)*100)}%`},
                ].map(({l,v})=>(
                  <div key={l}>
                    <div style={{...S.label,marginBottom:1}}>{l}</div>
                    <div style={{fontSize:10,color:'rgba(255,255,255,0.78)',fontFamily:mono}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={songActive?stopSongArc:startSongArc} style={{
              padding:'12px',borderRadius:6,cursor:'pointer',fontFamily:mono,textAlign:'center',
              border:`1px solid ${songActive?'#ff2244':gcl}`,
              background:songActive?'rgba(255,34,68,0.12)':`${gcl}18`,
              color:songActive?'#ff2244':gc,
              fontSize:11,fontWeight:700,letterSpacing:'0.15em',textTransform:'uppercase',
              boxShadow:songActive?'0 0 16px rgba(255,34,68,0.3)':`0 0 16px ${gcl}33`,
            }}>{songActive?'■ STOP ARC':'▶ START ARC'}</button>

            {songActive&&(
              <div style={{padding:10,borderRadius:6,border:'1px solid rgba(255,255,255,0.08)',background:'rgba(255,255,255,0.02)'}}>
                <div style={{...S.label,marginBottom:6}}>ARC PROGRESS</div>
                <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
                  {songArc.map((s,i)=>{const c=SECTION_COLORS[s]||'#fff';return(
                    <div key={i} style={{padding:'3px 7px',borderRadius:3,fontFamily:mono,fontSize:9,fontWeight:700,transition:'all 0.2s',
                      background:i===arcIdx?`${c}33`:i<arcIdx?`${c}11`:'rgba(255,255,255,0.03)',
                      border:`1px solid ${i===arcIdx?c:i<arcIdx?`${c}44`:'rgba(255,255,255,0.06)'}`,
                      color:i===arcIdx?c:i<arcIdx?`${c}88`:'rgba(255,255,255,0.5)'}}>
                      {s}
                    </div>
                  );})}
                </div>
              </div>
            )}
          </div>

          <div style={{flex:1,...S.col,gap:6}}>
            <div style={{...S.label,letterSpacing:'0.18em'}}>SECTION LIBRARY — CLICK TO TRIGGER</div>
            <div style={{display:'grid',gridTemplateColumns:isPhone?'repeat(2,1fr)':'repeat(3,1fr)',gap:6}}>
              {Object.entries(SECTIONS).map(([name,data])=>{
                const c=SECTION_COLORS[name]||'#fff';const isA=currentSectionName===name;
                return(
                  <button key={name} onClick={()=>triggerSection(name)} style={{
                    padding:'14px 10px',borderRadius:6,cursor:'pointer',fontFamily:mono,textAlign:'left',transition:'all 0.1s',
                    border:`1px solid ${isA?c:c+'33'}`,background:isA?`${c}18`:`${c}06`,
                    color:isA?c:`${c}88`,boxShadow:isA?`0 0 14px ${c}44`:'none',
                  }}>
                    <div style={{fontSize:12,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:5}}>{name}</div>
                    <div style={{fontSize:8,opacity:0.65,lineHeight:1.6}}>
                      k:{Math.round(data.kM*100)}% h:{Math.round(data.hM*100)}%<br/>
                      b:{Math.round(data.bM*100)}% sy:{Math.round(data.syM*100)}%<br/>
                      {data.bars} bars · {data.vel}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

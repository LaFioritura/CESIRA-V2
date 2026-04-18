// ─── CESIRA V3 — App State ────────────────────────────────────────────────────
import { useRef, useState, useCallback, useEffect } from 'react'
import {
  clamp, rnd, pick,
  GENRES, MODES, CHORD_PROGS, SECTIONS, SONG_ARCS, UNDO_LIMIT,
  mkSteps, mkNotes,
} from '../engine/constants.js'
import { buildSection } from '../engine/music.js'

const DEFAULT_PARAMS = {
  master:0.85, swing:0.03, humanize:0.012, grooveAmt:0.65, grooveProfile:'steady',
  space:0.3, tone:0.7, noiseMix:0.2, drive:0.1, compress:0.3,
  bassFilter:0.55, synthFilter:0.65, drumDecay:0.5, bassSubAmt:0.5, fmIdx:0.6,
  polySynth:true, bassStack:true,
  bassPreset:'sub_floor', synthPreset:'velvet_pad', drumPreset:'tight_punch', performancePreset:'club_night',
}

export function useStore() {
  const [isPlaying, setIsPlaying] = useState(false)
  const isPlayingRef = useRef(false)
  const [step, setStep] = useState(0)
  const [bpm, setBpmState] = useState(128)
  const bpmRef = useRef(128)
  const setBpm = useCallback(v => { const n=clamp(v,40,250); setBpmState(n); bpmRef.current=n },[])

  const [genre, setGenreState] = useState('techno')
  const genreRef = useRef('techno')
  const [sectionName, setSectionName] = useState('groove')
  const [modeName, setModeName] = useState('minor')
  const [arpMode, setArpMode] = useState('up')
  const arpModeRef = useRef('up')
  const progressionRef = useRef(CHORD_PROGS.minor[0])
  const [view, setView] = useState('perform')

  const [patterns,  setPatterns]  = useState({kick:mkSteps(),snare:mkSteps(),hat:mkSteps(),bass:mkSteps(),synth:mkSteps()})
  const patternsRef = useRef(patterns)
  const [bassLine,  setBassLine]  = useState(mkNotes('C2'))
  const bassRef = useRef(bassLine)
  const [synthLine, setSynthLine] = useState(mkNotes('C4'))
  const synthRef = useRef(synthLine)
  const [laneLen, setLaneLen]   = useState({kick:16,snare:16,hat:32,bass:32,synth:32})
  const laneLenRef = useRef(laneLen)
  const lastBassRef = useRef('C2')
  useEffect(()=>{patternsRef.current=patterns},[patterns])
  useEffect(()=>{bassRef.current=bassLine},[bassLine])
  useEffect(()=>{synthRef.current=synthLine},[synthLine])
  useEffect(()=>{laneLenRef.current=laneLen},[laneLen])

  const [params, setParamsState] = useState({...DEFAULT_PARAMS})
  const paramsRef = useRef({...DEFAULT_PARAMS})
  const setParam = useCallback((k,v)=>setParamsState(p=>{const n={...p,[k]:v};paramsRef.current=n;return n}),[])
  const setParamsBatch = useCallback(obj=>setParamsState(p=>{const n={...p,...obj};paramsRef.current=n;return n}),[])

  const [songArc, setSongArc] = useState([])
  const [arcIdx, setArcIdx] = useState(0)
  const [songActive, setSongActive] = useState(false)
  const songActiveRef = useRef(false)
  const arcRef = useRef([]); const arcIdxRef = useRef(0); const barCountRef = useRef(0)

  const [autopilot, setAutopilot] = useState(false)
  const autopilotRef = useRef(false)
  const [autopilotIntensity, setAutopilotIntensity] = useState(0.5)
  const autopilotTimerRef = useRef(null)
  useEffect(()=>{autopilotRef.current=autopilot},[autopilot])

  const [status, setStatus] = useState('Ready — press PLAY')
  const [activeNotes, setActiveNotes] = useState({bass:'—',synth:'—'})
  const [laneVU, setLaneVU] = useState({kick:0,snare:0,hat:0,bass:0,synth:0})
  const vuTimers = useRef({})
  const [page, setPage] = useState(0)
  const [recordings, setRecordings] = useState([])
  const [recState, setRecState] = useState('idle')
  const recorderRef = useRef(null)
  const [projectName, setProjectName] = useState('CESIRA SESSION')
  const [savedScenes, setSavedScenes] = useState([null,null,null,null,null,null])
  const [midiOk, setMidiOk] = useState(false)
  const midiRef = useRef(null)
  const [tapTimes, setTapTimes] = useState([])
  const undoStack = useRef([])
  const [undoLen, setUndoLen] = useState(0)

  const flashLane = useCallback((lane,level=1)=>{
    setLaneVU(p=>({...p,[lane]:Math.min(1,level)}))
    if(vuTimers.current[lane]) clearInterval(vuTimers.current[lane])
    vuTimers.current[lane]=setInterval(()=>setLaneVU(p=>{const nv=Math.max(0,p[lane]-0.2);if(nv<=0)clearInterval(vuTimers.current[lane]);return{...p,[lane]:nv}}),55)
  },[])

  const pushUndo = useCallback(()=>{
    undoStack.current=[{patterns:{...patternsRef.current},bassLine:[...bassRef.current],synthLine:[...synthRef.current]},...undoStack.current.slice(0,UNDO_LIMIT-1)]
    setUndoLen(undoStack.current.length)
  },[])
  const undo = useCallback(()=>{
    if(!undoStack.current.length)return
    const snap=undoStack.current.shift();setUndoLen(undoStack.current.length)
    setPatterns(snap.patterns);setBassLine(snap.bassLine);setSynthLine(snap.synthLine)
    patternsRef.current=snap.patterns;bassRef.current=snap.bassLine;synthRef.current=snap.synthLine
    setStatus('Undo')
  },[])

  const grooveFromGenre = g=>{const gd=GENRES[g];return gd.density>0.65&&gd.chaos>0.4?'bunker':gd.chaos>0.6?'broken':gd.density<0.4?'float':'steady'}

  const applySection = useCallback((result,pushU=true)=>{
    if(pushU)pushUndo()
    setPatterns(result.patterns);setBassLine(result.bassLine);setSynthLine(result.synthLine);setLaneLen(result.laneLen)
    patternsRef.current=result.patterns;bassRef.current=result.bassLine;synthRef.current=result.synthLine;laneLenRef.current=result.laneLen
    lastBassRef.current=result.lastBass
  },[pushUndo])

  const regenerateSection = useCallback((secName,pushU=true)=>{
    const g=genreRef.current
    const result=buildSection(g,secName,modeName,progressionRef.current,arpModeRef.current,lastBassRef.current)
    applySection(result,pushU)
    setParam('grooveProfile',grooveFromGenre(g))
    setStatus(`${g} · ${secName} · ${modeName}`)
  },[modeName,applySection,setParam])

  const newGenreSession = useCallback((g)=>{
    const gd=GENRES[g]; const mName=pick(gd.modes)
    const prog=pick(CHORD_PROGS[mName]||CHORD_PROGS.minor)
    const aMode=pick(['up','down','updown','outside'])
    genreRef.current=g; setGenreState(g); setModeName(mName); setArpMode(aMode)
    progressionRef.current=prog; arpModeRef.current=aMode
    setBpm(Math.round(gd.bpm[0]+rnd()*(gd.bpm[1]-gd.bpm[0])))
    setParamsBatch({space:gd.fxProfile.space,tone:gd.fxProfile.tone,drive:gd.fxProfile.drive*2,noiseMix:gd.chaos*0.4,compress:gd.density*0.4})
    const sec=pick(Object.keys(SECTIONS)); setSectionName(sec); lastBassRef.current='C2'
    const result=buildSection(g,sec,mName,prog,aMode,'C2')
    applySection(result,false); setParam('grooveProfile',grooveFromGenre(g))
    setStatus(`${g} loaded — ${sec} · ${mName}`)
  },[setBpm,setParamsBatch,setParam,applySection])

  const triggerSection = useCallback((sec)=>{setSectionName(sec);regenerateSection(sec)},[regenerateSection])
  const toggleCell = useCallback((lane,idx)=>{pushUndo();setPatterns(p=>{const n={...p,[lane]:p[lane].map((s,i)=>i===idx?{...s,on:!s.on}:s)};patternsRef.current=n;return n})},[pushUndo])
  const setNote = useCallback((lane,idx,note)=>{if(lane==='bass')setBassLine(p=>{const n=[...p];n[idx]=note;bassRef.current=n;return n});else setSynthLine(p=>{const n=[...p];n[idx]=note;synthRef.current=n;return n})},[])
  const clearPattern = useCallback(()=>{
    pushUndo()
    const mode=MODES[modeName]||MODES.minor
    const empty={kick:mkSteps(),snare:mkSteps(),hat:mkSteps(),bass:mkSteps(),synth:mkSteps()}
    const nb=mkNotes(mode.b[0]||'C2'),ns=mkNotes(mode.s[0]||'C4')
    setPatterns(empty);setBassLine(nb);setSynthLine(ns)
    patternsRef.current=empty;bassRef.current=nb;synthRef.current=ns; setStatus('Pattern cleared')
  },[pushUndo,modeName])

  const perfActions = {
    drop:()=>triggerSection('drop'), break:()=>triggerSection('break'),
    build:()=>triggerSection('build'), groove:()=>triggerSection('groove'),
    tension:()=>triggerSection('tension'), fill:()=>triggerSection('fill'),
    intro:()=>triggerSection('intro'), outro:()=>triggerSection('outro'),
    reharmonize:()=>{progressionRef.current=pick(CHORD_PROGS[modeName]||CHORD_PROGS.minor);regenerateSection(sectionName);setStatus('Reharmonized')},
    mutate:()=>{
      pushUndo(); const np={...patternsRef.current}
      for(const ln of['kick','snare','hat','bass','synth']){
        const ll=laneLenRef.current[ln]||16; np[ln]=np[ln].map(s=>({...s}))
        const flips=Math.max(2,Math.floor(ll*0.08))
        for(let i=0;i<flips;i++){const pos=Math.floor(rnd()*ll);if(pos%4!==0||ln!=='kick')np[ln][pos].on=!np[ln][pos].on}
      }
      setPatterns(np);patternsRef.current=np;setStatus('Pattern mutated')
    },
    thinOut:()=>{
      pushUndo(); const np={}
      for(const ln of['hat','synth','bass']){np[ln]=patternsRef.current[ln].map((s,i)=>({...s,on:s.on&&(i%4===0||rnd()>0.45)}))}
      setPatterns(p=>({...p,...np}));patternsRef.current={...patternsRef.current,...np};setStatus('Thinned out')
    },
    thicken:()=>{
      pushUndo(); const np={}
      for(const ln of['hat','kick']){np[ln]=patternsRef.current[ln].map(s=>({...s,on:s.on||(rnd()<0.22),v:s.v||0.65,p:s.p||0.7}))}
      setPatterns(p=>({...p,...np}));patternsRef.current={...patternsRef.current,...np};setStatus('Thickened')
    },
    randomizeNotes:()=>{const mode=MODES[modeName]||MODES.minor;pushUndo();setSynthLine(prev=>{const n=prev.map((v,i)=>patternsRef.current.synth[i]?.on?pick(mode.s):v);synthRef.current=n;return n});setStatus('Synth notes randomized')},
    randomizeBass:()=>{const mode=MODES[modeName]||MODES.minor;pushUndo();setBassLine(prev=>{const n=prev.map((v,i)=>patternsRef.current.bass[i]?.on?pick(mode.b):v);bassRef.current=n;return n});setStatus('Bass notes randomized')},
    shiftNotesUp:()=>{const mode=MODES[modeName]||MODES.minor;pushUndo();setBassLine(prev=>{const n=prev.map((v,i)=>{if(!patternsRef.current.bass[i]?.on)return v;const idx=mode.b.indexOf(v);return mode.b[Math.min(idx+1,mode.b.length-1)]});bassRef.current=n;return n});setSynthLine(prev=>{const n=prev.map((v,i)=>{if(!patternsRef.current.synth[i]?.on)return v;const idx=mode.s.indexOf(v);return mode.s[Math.min(idx+1,mode.s.length-1)]});synthRef.current=n;return n});setStatus('Notes shifted up')},
    shiftNotesDown:()=>{const mode=MODES[modeName]||MODES.minor;pushUndo();setBassLine(prev=>{const n=prev.map((v,i)=>{if(!patternsRef.current.bass[i]?.on)return v;const idx=mode.b.indexOf(v);return mode.b[Math.max(idx-1,0)]});bassRef.current=n;return n});setSynthLine(prev=>{const n=prev.map((v,i)=>{if(!patternsRef.current.synth[i]?.on)return v;const idx=mode.s.indexOf(v);return mode.s[Math.max(idx-1,0)]});synthRef.current=n;return n});setStatus('Notes shifted down')},
    shiftArp:()=>{const modes=['up','down','updown','outside'];const next=modes[(modes.indexOf(arpModeRef.current)+1)%modes.length];setArpMode(next);arpModeRef.current=next;regenerateSection(sectionName);setStatus(`Arp → ${next}`)},
    clear:clearPattern,
  }

  const startSongArc = useCallback(()=>{
    const arc=pick(SONG_ARCS); setSongArc(arc); arcRef.current=arc; setArcIdx(0); arcIdxRef.current=0; barCountRef.current=0
    setSongActive(true); songActiveRef.current=true; setSectionName(arc[0]); regenerateSection(arc[0])
    setStatus(`Arc: ${arc.join(' → ')}`)
  },[regenerateSection])
  const stopSongArc = useCallback(()=>{setSongActive(false);songActiveRef.current=false;setStatus('Song arc stopped')},[])
  const onBarElapsed = useCallback(()=>{
    if(!songActiveRef.current||!arcRef.current.length)return
    barCountRef.current++
    const sec=SECTIONS[arcRef.current[arcIdxRef.current]]||SECTIONS.groove
    if(barCountRef.current>=sec.bars){
      barCountRef.current=0
      const nextIdx=(arcIdxRef.current+1)%arcRef.current.length; arcIdxRef.current=nextIdx; setArcIdx(nextIdx)
      const nextSec=arcRef.current[nextIdx]; setSectionName(nextSec); regenerateSection(nextSec,false)
    }
  },[regenerateSection])

  const applyPreset = useCallback((preset,type)=>{
    if(!preset)return
    const patch={}
    const keys=['space','tone','drive','compress','noiseMix','drumDecay','bassFilter','synthFilter','bassSubAmt','fmIdx','polySynth','bassStack','grooveAmt','swing']
    keys.forEach(k=>{if(preset[k]!==undefined)patch[k]=preset[k]})
    if(preset.bassMode)patch.bassMode=preset.bassMode
    if(preset.synthMode)patch.synthMode=preset.synthMode
    setParamsBatch(patch)
    if(preset.genre&&preset.genre!==genreRef.current)newGenreSession(preset.genre)
    setStatus(`${type} — ${preset.label}`)
  },[setParamsBatch,newGenreSession])

  const tapTempo = useCallback(()=>{
    const now=Date.now()
    setTapTimes(prev=>{
      const next=[...prev.filter(t=>now-t<3000),now]
      if(next.length>=2){const avg=next.slice(1).map((t,i)=>t-next[i]).reduce((a,b)=>a+b,0)/(next.length-1);const nb=clamp(Math.round(60000/avg),40,250);setBpm(nb);setStatus(`TAP → ${nb} BPM`)}
      return next.slice(-6)
    })
  },[setBpm])

  const serialize = useCallback(()=>({v:3,genre:genreRef.current,modeName,bpm:bpmRef.current,sectionName,arpMode:arpModeRef.current,...paramsRef.current,projectName,patterns:patternsRef.current,bassLine:bassRef.current,synthLine:synthRef.current,laneLen:laneLenRef.current}),[modeName,sectionName,projectName])
  const applySnap = useCallback((snap)=>{
    if(!snap||snap.v!==3){setStatus('Incompatible session (need v3)');return}
    genreRef.current=snap.genre||'techno'; setGenreState(snap.genre||'techno'); setModeName(snap.modeName||'minor')
    setBpm(snap.bpm||128); setSectionName(snap.sectionName||'groove'); setArpMode(snap.arpMode||'up'); arpModeRef.current=snap.arpMode||'up'
    const pp={}; Object.keys(DEFAULT_PARAMS).forEach(k=>{if(snap[k]!==undefined)pp[k]=snap[k]}); setParamsBatch(pp)
    if(snap.projectName)setProjectName(snap.projectName)
    if(snap.patterns){setPatterns(snap.patterns);patternsRef.current=snap.patterns}
    if(snap.bassLine){setBassLine(snap.bassLine);bassRef.current=snap.bassLine}
    if(snap.synthLine){setSynthLine(snap.synthLine);synthRef.current=snap.synthLine}
    if(snap.laneLen){setLaneLen(snap.laneLen);laneLenRef.current=snap.laneLen}
    setStatus('Session loaded')
  },[setBpm,setParamsBatch])

  const saveScene = useCallback((slot)=>{setSavedScenes(p=>p.map((v,i)=>i===slot?{...serialize(),label:`S${slot+1} ${new Date().toLocaleTimeString()}`}:v));setStatus(`Scene ${slot+1} saved`)},[serialize])
  const loadScene = useCallback((slot)=>{setSavedScenes(p=>{if(p[slot])applySnap(p[slot]);return p})},[applySnap])
  const exportJSON = useCallback(()=>{const b=new Blob([JSON.stringify(serialize(),null,2)],{type:'application/json'});const url=URL.createObjectURL(b);const a=document.createElement('a');a.href=url;a.download=`${projectName.replace(/\s+/g,'-').toLowerCase()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),500);setStatus('Exported')},[serialize,projectName])
  const importJSON = useCallback(async(e)=>{const f=e.target.files?.[0];if(!f)return;try{applySnap(JSON.parse(await f.text()))}catch{setStatus('Import failed')}finally{e.target.value=''}},[applySnap])

  useEffect(()=>{newGenreSession('techno')},[]) // eslint-disable-line

  return {
    isPlaying,setIsPlaying,isPlayingRef,step,setStep,bpm,setBpm,bpmRef,
    genre,genreRef,sectionName,setSectionName,modeName,arpMode,arpModeRef,view,setView,progressionRef,
    patterns,patternsRef,bassLine,bassRef,synthLine,synthRef,laneLen,laneLenRef,lastBassRef,
    params,paramsRef,setParam,setParamsBatch,
    songArc,arcIdx,songActive,songActiveRef,arcRef,arcIdxRef,barCountRef,onBarElapsed,startSongArc,stopSongArc,
    autopilot,setAutopilot,autopilotRef,autopilotIntensity,setAutopilotIntensity,autopilotTimerRef,
    status,setStatus,activeNotes,setActiveNotes,laneVU,flashLane,page,setPage,
    recordings,setRecordings,recState,setRecState,recorderRef,
    projectName,setProjectName,savedScenes,setSavedScenes,midiOk,setMidiOk,midiRef,
    tapTimes,undoLen,
    newGenreSession,triggerSection,regenerateSection,toggleCell,setNote,clearPattern,
    perfActions,pushUndo,undo,applyPreset,tapTempo,
    saveScene,loadScene,exportJSON,importJSON,serialize,applySnap,
  }
}

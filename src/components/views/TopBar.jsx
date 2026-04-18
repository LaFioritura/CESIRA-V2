import React, { useRef } from 'react'
import { GENRE_NAMES, GENRE_CLR, SOUND_PRESETS } from '../../engine/constants.js'
import { PresetSelect } from '../ui/shared.js'
import Visualizer from '../ui/Visualizer.jsx'

export default function TopBar({ store, scheduler, phone, compact }) {
  const { genre, bpm, setBpm, isPlaying, params, setParam, setParamsBatch,
    newGenreSession, autopilot, setAutopilot, view, setView,
    status, projectName, setProjectName, midiOk, recState,
    sectionName, modeName, arpMode, songActive, arcIdx, songArc,
    applyPreset, tapTempo, perfActions, clearPattern, exportJSON, importJSON,
  } = store

  const importRef = useRef(null)
  const gc = GENRE_CLR[genre] || '#ff4444'

  const applyBassPreset    = k => applyPreset(SOUND_PRESETS.bass[k],        'bass')
  const applySynthPreset   = k => applyPreset(SOUND_PRESETS.synth[k],       'synth')
  const applyDrumPreset    = k => applyPreset(SOUND_PRESETS.drum[k],        'drum')
  const applyPerfPreset    = k => applyPreset(SOUND_PRESETS.performance[k], 'performance')

  return (
    <div style={{
      display:'flex', alignItems:'center', flexWrap:'wrap', gap:6,
      padding: phone ? '8px' : '6px 10px',
      borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0,
      background:'rgba(0,0,0,0.4)', overflow:'hidden', minHeight:36,
    }}>
      {/* Logo */}
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.22em', color:gc, borderRadius:3, padding:'2px 6px', border:`1px solid ${gc}44`, whiteSpace:'nowrap', fontFamily:'Space Mono,monospace' }}>
        CESIRA V3
      </div>

      {/* Project name */}
      <input value={projectName} onChange={e => setProjectName(e.target.value)}
        style={{ background:'transparent', border:'none', outline:'none', color:'rgba(255,255,255,0.92)', fontSize:10, fontFamily:'Space Mono,monospace', letterSpacing:'0.08em', width: phone ? '100%' : 110 }}
      />

      {/* Genre pills */}
      <div style={{ display:'flex', gap:2, flexWrap:'wrap' }}>
        {GENRE_NAMES.map(g => (
          <button key={g} onClick={() => newGenreSession(g)} style={{
            padding:'2px 5px', borderRadius:2, cursor:'pointer', fontFamily:'Space Mono,monospace',
            border:`1px solid ${genre===g ? GENRE_CLR[g] : 'rgba(255,255,255,0.07)'}`,
            background: genre===g ? `${GENRE_CLR[g]}18` : 'transparent',
            color: genre===g ? GENRE_CLR[g] : 'rgba(255,255,255,0.78)',
            fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', transition:'all 0.1s',
          }}>{g}</button>
        ))}
      </div>

      <div style={{ flex:1 }} />

      {/* Visualizer */}
      {!phone && <Visualizer genre={genre} />}

      {/* BPM */}
      <div style={{ display:'flex', alignItems:'center', gap:2, background:'rgba(255,255,255,0.05)', borderRadius:4, padding:'2px 4px', border:'1px solid rgba(255,255,255,0.1)' }}>
        {[['−',−5],['‹',−1]].map(([l,d]) =>
          <button key={l} onClick={() => setBpm(bpm+d)} style={{ width:l==='−'?16:14, height:16, borderRadius:2, border:'none', background:`rgba(255,255,255,${l==='−'?0.08:0.05})`, color:'rgba(255,255,255,0.88)', fontSize:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Space Mono,monospace' }}>{l}</button>
        )}
        <div style={{ textAlign:'center', minWidth:32 }}>
          <div style={{ fontSize:13, fontWeight:700, color:gc, fontFamily:'Space Mono,monospace', lineHeight:1 }}>{bpm}</div>
          <div style={{ fontSize:9.5, color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em' }}>BPM</div>
        </div>
        {[['›',1],['+',5]].map(([l,d]) =>
          <button key={l} onClick={() => setBpm(bpm+d)} style={{ width:l==='+'?16:14, height:16, borderRadius:2, border:'none', background:`rgba(255,255,255,${l==='+'?0.08:0.05})`, color:'rgba(255,255,255,0.88)', fontSize:10, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Space Mono,monospace' }}>{l}</button>
        )}
        <button onClick={tapTempo} style={{ padding:'1px 5px', borderRadius:2, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.7)', fontSize:9.5, cursor:'pointer', fontFamily:'Space Mono,monospace', marginLeft:2 }}>TAP</button>
      </div>

      {/* Poly / Stack toggles */}
      <div style={{ display:'flex', gap:4 }}>
        <button onClick={() => setParam('polySynth', !params.polySynth)} style={{ padding:'4px 7px', borderRadius:3, border:`1px solid ${params.polySynth?gc:'rgba(255,255,255,0.1)'}`, background:params.polySynth?`${gc}18`:'rgba(255,255,255,0.03)', color:params.polySynth?gc:'rgba(255,255,255,0.6)', fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'Space Mono,monospace' }}>SYNTH POLY</button>
        <button onClick={() => setParam('bassStack', !params.bassStack)}  style={{ padding:'4px 7px', borderRadius:3, border:`1px solid ${params.bassStack?'#22d3ee':'rgba(255,255,255,0.1)'}`, background:params.bassStack?'rgba(34,211,238,0.12)':'rgba(255,255,255,0.03)', color:params.bassStack?'#22d3ee':'rgba(255,255,255,0.6)', fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'Space Mono,monospace' }}>BASS STACK</button>
        <button onClick={clearPattern} style={{ padding:'4px 8px', borderRadius:3, border:'1px solid rgba(255,80,80,0.35)', background:'rgba(255,80,80,0.08)', color:'#ff8a8a', fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'Space Mono,monospace' }}>CLEAR</button>
      </div>

      {/* Presets */}
      <PresetSelect label='BASS'  value={params.bassPreset}        category='bass'        onChange={applyBassPreset}  accent='#22d3ee' />
      <PresetSelect label='SYNTH' value={params.synthPreset}       category='synth'       onChange={applySynthPreset} accent={gc} />
      <PresetSelect label='DRUM'  value={params.drumPreset}        category='drum'        onChange={applyDrumPreset}  accent='#ffb347' />
      <PresetSelect label='PERF'  value={params.performancePreset} category='performance' onChange={applyPerfPreset}   accent='#7ee787' />

      {/* Transport */}
      <button onClick={scheduler.toggle} style={{
        padding:'4px 14px', borderRadius:3, border:'none',
        background: isPlaying ? '#ff2244' : '#00cc66', color:'#000',
        fontSize:10, fontWeight:700, cursor:'pointer', letterSpacing:'0.1em', fontFamily:'Space Mono,monospace',
        boxShadow: isPlaying ? '0 0 12px #ff224466' : '0 0 12px #00cc6666', transition:'all 0.1s', flexShrink:0,
      }}>{isPlaying ? '■ STOP' : '▶ PLAY'}</button>

      {/* Autopilot */}
      <button onClick={() => setAutopilot(v => !v)} style={{
        padding:'4px 8px', borderRadius:3, border:`1px solid ${autopilot?gc:'rgba(255,255,255,0.1)'}`,
        background: autopilot ? `${gc}22` : 'rgba(255,255,255,0.04)',
        color: autopilot ? gc : 'rgba(255,255,255,0.38)', fontSize:10, fontWeight:700, cursor:'pointer',
        letterSpacing:'0.1em', fontFamily:'Space Mono,monospace', boxShadow: autopilot?`0 0 10px ${gc}55`:'none', transition:'all 0.12s',
      }}>{autopilot ? '◈ AUTO' : '○ AUTO'}</button>

      {/* View tabs */}
      <div style={{ display:'flex', gap:2 }}>
        {['perform','studio','song'].map(v => (
          <button key={v} onClick={() => setView(v)} style={{
            padding:'2px 6px', borderRadius:2, border:`1px solid ${view===v?gc:'rgba(255,255,255,0.08)'}`,
            background: view===v ? `${gc}18` : 'transparent',
            color: view===v ? gc : 'rgba(255,255,255,0.62)',
            fontSize:10, fontWeight:700, cursor:'pointer', letterSpacing:'0.08em', fontFamily:'Space Mono,monospace', textTransform:'uppercase',
          }}>{v}</button>
        ))}
      </div>

      {/* Status */}
      <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)', maxWidth:100, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'0.05em', fontFamily:'Space Mono,monospace' }}>
        {recState==='recording' && <span style={{ color:'#ff2244', marginRight:3 }}>●</span>}{status}
      </div>
      <div style={{ width:5, height:5, borderRadius:'50%', background: midiOk?'#00ff88':'rgba(255,255,255,0.12)', flexShrink:0 }} />

      <input ref={importRef} type="file" accept=".json" onChange={importJSON} style={{ display:'none' }} />
    </div>
  )
}

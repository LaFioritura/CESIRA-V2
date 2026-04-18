import React, { useRef } from 'react'
import { GENRE_NAMES, GENRE_CLR, SOUND_PRESETS } from '../../engine/constants.js'
import Visualizer from '../ui/Visualizer.jsx'

const mono = { fontFamily: 'Space Mono,monospace' }

function PresetSelect({ label, value, options, onChange, accent }) {
  return (
    <label style={{ display:'flex', flexDirection:'column', gap:2 }}>
      <span style={{ fontSize:9, color:'rgba(255,255,255,0.4)', letterSpacing:'0.12em', textTransform:'uppercase', ...mono }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${accent}33`, color:accent, borderRadius:4, padding:'3px 5px', fontSize:10, ...mono, outline:'none', minWidth:100 }}>
        {Object.entries(options).map(([k, p]) =>
          <option key={k} value={k} style={{ color:'#111', background:'#f2f2f2' }}>{p.label}</option>
        )}
      </select>
    </label>
  )
}

export default function TopBar({ store, scheduler, phone }) {
  const { genre, bpm, setBpm, isPlaying, params, setParam, newGenreSession,
    autopilot, setAutopilot, view, setView, status, projectName, setProjectName,
    midiOk, recState, sectionName, modeName, arpMode, applyPreset, tapTempo,
    clearPattern, exportJSON, importJSON } = store

  const importRef = useRef(null)
  const gc = GENRE_CLR[genre] || '#ff4444'

  return (
    <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:5, padding: phone ? '8px' : '5px 10px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0, background:'rgba(0,0,0,0.4)', minHeight:36 }}>

      {/* Logo */}
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:'0.22em', color:gc, borderRadius:3, padding:'2px 6px', border:`1px solid ${gc}44`, whiteSpace:'nowrap', ...mono }}>
        CESIRA V3
      </div>

      {/* Project name */}
      <input value={projectName} onChange={e => setProjectName(e.target.value)}
        style={{ background:'transparent', border:'none', outline:'none', color:'rgba(255,255,255,0.85)', fontSize:10, ...mono, width:100 }} />

      {/* Genre pills */}
      <div style={{ display:'flex', gap:2, flexWrap:'wrap' }}>
        {GENRE_NAMES.map(g => (
          <button key={g} onClick={() => newGenreSession(g)} style={{
            padding:'2px 5px', borderRadius:2, cursor:'pointer', ...mono,
            border:`1px solid ${genre===g ? GENRE_CLR[g] : 'rgba(255,255,255,0.07)'}`,
            background: genre===g ? `${GENRE_CLR[g]}18` : 'transparent',
            color: genre===g ? GENRE_CLR[g] : 'rgba(255,255,255,0.65)',
            fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase',
          }}>{g}</button>
        ))}
      </div>

      <div style={{ flex:1 }} />

      {/* Visualizer */}
      {!phone && <Visualizer genre={genre} />}

      {/* BPM */}
      <div style={{ display:'flex', alignItems:'center', gap:2, background:'rgba(255,255,255,0.05)', borderRadius:4, padding:'2px 4px', border:'1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={() => setBpm(bpm - 5)} style={{ width:16, height:16, borderRadius:2, border:'none', background:'rgba(255,255,255,0.08)', color:'#fff', fontSize:10, cursor:'pointer', ...mono }}>−</button>
        <button onClick={() => setBpm(bpm - 1)} style={{ width:14, height:16, borderRadius:2, border:'none', background:'rgba(255,255,255,0.05)', color:'#fff', fontSize:10, cursor:'pointer', ...mono }}>‹</button>
        <div style={{ textAlign:'center', minWidth:32 }}>
          <div style={{ fontSize:13, fontWeight:700, color:gc, ...mono, lineHeight:1 }}>{bpm}</div>
          <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', letterSpacing:'0.1em' }}>BPM</div>
        </div>
        <button onClick={() => setBpm(bpm + 1)} style={{ width:14, height:16, borderRadius:2, border:'none', background:'rgba(255,255,255,0.05)', color:'#fff', fontSize:10, cursor:'pointer', ...mono }}>›</button>
        <button onClick={() => setBpm(bpm + 5)} style={{ width:16, height:16, borderRadius:2, border:'none', background:'rgba(255,255,255,0.08)', color:'#fff', fontSize:10, cursor:'pointer', ...mono }}>+</button>
        <button onClick={tapTempo} style={{ padding:'1px 5px', borderRadius:2, border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.04)', color:'rgba(255,255,255,0.6)', fontSize:9, cursor:'pointer', ...mono, marginLeft:2 }}>TAP</button>
      </div>

      {/* Toggles */}
      <button onClick={() => setParam('polySynth', !params.polySynth)} style={{ padding:'3px 7px', borderRadius:3, border:`1px solid ${params.polySynth ? gc : 'rgba(255,255,255,0.1)'}`, background: params.polySynth ? `${gc}18` : 'transparent', color: params.polySynth ? gc : 'rgba(255,255,255,0.5)', fontSize:10, fontWeight:700, cursor:'pointer', ...mono }}>POLY</button>
      <button onClick={() => setParam('bassStack', !params.bassStack)} style={{ padding:'3px 7px', borderRadius:3, border:`1px solid ${params.bassStack ? '#22d3ee' : 'rgba(255,255,255,0.1)'}`, background: params.bassStack ? 'rgba(34,211,238,0.12)' : 'transparent', color: params.bassStack ? '#22d3ee' : 'rgba(255,255,255,0.5)', fontSize:10, fontWeight:700, cursor:'pointer', ...mono }}>STACK</button>
      <button onClick={clearPattern} style={{ padding:'3px 7px', borderRadius:3, border:'1px solid rgba(255,80,80,0.35)', background:'rgba(255,80,80,0.08)', color:'#ff8a8a', fontSize:10, fontWeight:700, cursor:'pointer', ...mono }}>CLEAR</button>

      {/* Presets */}
      <PresetSelect label='BASS'  value={params.bassPreset}        options={SOUND_PRESETS.bass}        onChange={k => applyPreset(SOUND_PRESETS.bass[k], 'bass')}               accent='#22d3ee' />
      <PresetSelect label='SYNTH' value={params.synthPreset}       options={SOUND_PRESETS.synth}       onChange={k => applyPreset(SOUND_PRESETS.synth[k], 'synth')}             accent={gc} />
      <PresetSelect label='DRUM'  value={params.drumPreset}        options={SOUND_PRESETS.drum}        onChange={k => applyPreset(SOUND_PRESETS.drum[k], 'drum')}               accent='#ffb347' />
      <PresetSelect label='PERF'  value={params.performancePreset} options={SOUND_PRESETS.performance} onChange={k => applyPreset(SOUND_PRESETS.performance[k], 'performance')} accent='#7ee787' />

      {/* Play / Auto / Views */}
      <button onClick={scheduler.toggle} style={{ padding:'4px 14px', borderRadius:3, border:'none', background: isPlaying ? '#ff2244' : '#00cc66', color:'#000', fontSize:10, fontWeight:700, cursor:'pointer', letterSpacing:'0.1em', ...mono, boxShadow: isPlaying ? '0 0 12px #ff224466' : '0 0 12px #00cc6666' }}>
        {isPlaying ? '■ STOP' : '▶ PLAY'}
      </button>

      <button onClick={() => setAutopilot(v => !v)} style={{ padding:'3px 8px', borderRadius:3, border:`1px solid ${autopilot ? gc : 'rgba(255,255,255,0.1)'}`, background: autopilot ? `${gc}22` : 'transparent', color: autopilot ? gc : 'rgba(255,255,255,0.35)', fontSize:10, fontWeight:700, cursor:'pointer', ...mono }}>
        {autopilot ? '◈ AUTO' : '○ AUTO'}
      </button>

      <div style={{ display:'flex', gap:2 }}>
        {['perform','studio','song'].map(v => (
          <button key={v} onClick={() => setView(v)} style={{ padding:'2px 6px', borderRadius:2, border:`1px solid ${view===v ? gc : 'rgba(255,255,255,0.08)'}`, background: view===v ? `${gc}18` : 'transparent', color: view===v ? gc : 'rgba(255,255,255,0.5)', fontSize:10, fontWeight:700, cursor:'pointer', ...mono, textTransform:'uppercase' }}>{v}</button>
        ))}
      </div>

      {/* Export/Import */}
      <button onClick={exportJSON} style={{ padding:'3px 7px', borderRadius:3, border:`1px solid ${gc}33`, background:'transparent', color:'rgba(255,255,255,0.5)', fontSize:10, cursor:'pointer', ...mono }} title="Export session">💾</button>
      <button onClick={() => importRef.current?.click()} style={{ padding:'3px 7px', borderRadius:3, border:'1px solid rgba(255,255,255,0.1)', background:'transparent', color:'rgba(255,255,255,0.5)', fontSize:10, cursor:'pointer', ...mono }} title="Import session">📂</button>
      <input ref={importRef} type="file" accept=".json" onChange={importJSON} style={{ display:'none' }} />

      {/* Status */}
      <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:120, ...mono }}>
        {recState==='recording' && <span style={{ color:'#ff2244', marginRight:3 }}>●</span>}{status}
      </div>
      <div style={{ width:5, height:5, borderRadius:'50%', background: midiOk ? '#00ff88' : 'rgba(255,255,255,0.12)', flexShrink:0 }} title={midiOk ? 'MIDI connected' : 'No MIDI'} />
    </div>
  )
}

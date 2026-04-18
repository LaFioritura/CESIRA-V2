import React, { useState } from 'react'
import { GENRE_CLR, LANE_CLR, MODES, SECTIONS, SOUND_PRESETS } from '../../engine/constants.js'
import { navBtn, PresetSelect } from '../ui/shared.js'
import StepGrid from '../ui/StepGrid.jsx'

const MIXER_PARAMS = [
  { l:'MASTER',       k:'master',      c:'#ffffff', min:0, max:1 },
  { l:'SPACE',        k:'space',       c:'#44ffcc', min:0, max:1 },
  { l:'TONE',         k:'tone',        c:'#22d3ee', min:0, max:1 },
  { l:'NOISE',        k:'noiseMix',    c:'#aaaaaa', min:0, max:1 },
  { l:'DRIVE',        k:'drive',       c:'#ff8844', min:0, max:1 },
  { l:'COMPRESS',     k:'compress',    c:'#ffaa44', min:0, max:1 },
  { l:'BASS FILTER',  k:'bassFilter',  c:'#00ccff', min:0, max:1 },
  { l:'SYNTH FILTER', k:'synthFilter', c:'#cc88ff', min:0, max:1 },
  { l:'DRUM DECAY',   k:'drumDecay',   c:'#ff4444', min:0, max:1 },
  { l:'BASS SUB',     k:'bassSubAmt',  c:'#00ccff', min:0, max:1 },
  { l:'SWING',        k:'swing',       c:'#aa88ff', min:0, max:0.25 },
  { l:'HUMANIZE',     k:'humanize',    c:'#88aaff', min:0, max:0.05 },
  { l:'GROOVE AMT',   k:'grooveAmt',   c:'#ffdd00', min:0, max:1 },
  { l:'FM INDEX',     k:'fmIdx',       c:'#cc88ff', min:0, max:3 },
]

export default function StudioView({ store, compact, phone }) {
  const [tab, setTab] = useState('mixer')
  const [noteEditLane, setNoteEditLane] = useState('bass')
  const gc = GENRE_CLR[store.genre] || '#ff4444'

  const mode = MODES[store.modeName] || MODES.minor
  const notePool = noteEditLane === 'bass' ? mode.b : mode.s

  const applyBassPreset  = k => store.applyPreset(SOUND_PRESETS.bass[k],        'bass')
  const applySynthPreset = k => store.applyPreset(SOUND_PRESETS.synth[k],       'synth')
  const applyDrumPreset  = k => store.applyPreset(SOUND_PRESETS.drum[k],        'drum')
  const applyPerfPreset  = k => store.applyPreset(SOUND_PRESETS.performance[k], 'performance')

  const PAGE = 16
  const visStart = store.page * PAGE
  const visEnd   = Math.min(visStart + PAGE, 64)
  const visIdx   = Array.from({ length: visEnd - visStart }, (_, i) => visStart + i)

  return (
    <div style={{ flex:1, display:'flex', flexDirection: compact ? 'column':'row', gap:5, padding: phone?'8px':'5px 7px 8px 7px', minHeight:0, overflowY:'auto', overflowX:'hidden' }}>

      {/* LEFT — Grid editor */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:3, minWidth:0 }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:5, height:20, flexShrink:0 }}>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)', letterSpacing:'0.1em', fontFamily:'Space Mono,monospace' }}>
            {store.genre.toUpperCase()} · {store.modeName.toUpperCase()} · {store.sectionName.toUpperCase()}
          </span>
          <div style={{ flex:1 }} />
          <button onClick={store.undo} disabled={store.undoLen===0} style={{ ...navBtn, opacity: store.undoLen>0?1:0.3 }}>↩ ({store.undoLen})</button>
          <button onClick={() => store.setPage(p=>Math.max(0,p-1))} disabled={store.page===0} style={{ ...navBtn, opacity:store.page===0?0.3:1 }}>‹</button>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.45)', fontFamily:'Space Mono,monospace' }}>pg {store.page+1}/4</span>
          <button onClick={() => store.setPage(p=>Math.min(3,p+1))} disabled={store.page===3} style={{ ...navBtn, opacity:store.page===3?0.3:1 }}>›</button>
        </div>

        <StepGrid
          patterns={store.patterns} bassLine={store.bassLine} synthLine={store.synthLine}
          laneLen={store.laneLen} step={store.step} page={store.page} isPlaying={store.isPlaying}
          toggleCell={store.toggleCell} activeNotes={store.activeNotes}
        />

        {/* Note editor */}
        <div style={{ flexShrink:0, borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:4 }}>
          <div style={{ display:'flex', gap:4, marginBottom:3, alignItems:'center' }}>
            <span style={{ fontSize:10, color:'rgba(255,255,255,0.45)', letterSpacing:'0.12em', fontFamily:'Space Mono,monospace' }}>NOTES</span>
            {['bass','synth'].map(l => (
              <button key={l} onClick={() => setNoteEditLane(l)} style={{ ...navBtn, border:`1px solid ${noteEditLane===l?LANE_CLR[l]:'rgba(255,255,255,0.1)'}`, color: noteEditLane===l?LANE_CLR[l]:'rgba(255,255,255,0.55)' }}>{l}</button>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${visIdx.length},1fr)`, gap:1.5 }}>
            {visIdx.map(idx => {
              const lc = LANE_CLR[noteEditLane]
              const isOn = noteEditLane==='bass' ? store.patterns.bass[idx]?.on : store.patterns.synth[idx]?.on
              const curNote = noteEditLane==='bass' ? store.bassLine[idx] : store.synthLine[idx]
              const cur = notePool.indexOf(curNote)
              return (
                <div key={idx} style={{ opacity: isOn?1:0.2 }}>
                  <button disabled={!isOn}
                    onClick={() => { if(!isOn)return; store.setNote(noteEditLane,idx,notePool[(cur+1)%notePool.length]) }}
                    style={{ width:'100%', padding:'2px 0', borderRadius:2, border:`1px solid ${isOn?lc+'44':'rgba(255,255,255,0.04)'}`, background: isOn?`${lc}1a`:'rgba(255,255,255,0.01)', color: isOn?lc:'rgba(255,255,255,0.55)', fontSize:9, cursor: isOn?'pointer':'default', fontFamily:'Space Mono,monospace', textAlign:'center' }}>
                    {curNote||'—'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* RIGHT — Controls */}
      <div style={{ width: compact?'100%':182, display:'flex', flexDirection:'column', gap:0, flexShrink:0, borderLeft: compact?'none':'1px solid rgba(255,255,255,0.05)' }}>
        {/* Preset row */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:3, padding:'4px 7px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
          <PresetSelect label='BASS'  value={store.params.bassPreset}        category='bass'        onChange={applyBassPreset}  accent='#22d3ee' compact />
          <PresetSelect label='SYNTH' value={store.params.synthPreset}       category='synth'       onChange={applySynthPreset} accent={gc}      compact />
          <PresetSelect label='DRUM'  value={store.params.drumPreset}        category='drum'        onChange={applyDrumPreset}  accent='#ffb347' compact />
          <PresetSelect label='PERF'  value={store.params.performancePreset} category='performance' onChange={applyPerfPreset}   accent='#7ee787' compact />
          <button onClick={store.clearPattern} style={{ padding:'4px 8px', borderRadius:3, border:'1px solid rgba(255,80,80,0.3)', background:'rgba(255,80,80,0.08)', color:'#ff8a8a', fontSize:10, cursor:'pointer', fontFamily:'Space Mono,monospace' }}>CLEAR</button>
          <button onClick={() => store.setParam('polySynth',!store.params.polySynth)} style={{ padding:'4px 7px', borderRadius:3, border:`1px solid ${store.params.polySynth?gc:'rgba(255,255,255,0.08)'}`, background:store.params.polySynth?`${gc}18`:'rgba(255,255,255,0.03)', color:store.params.polySynth?gc:'rgba(255,255,255,0.55)', fontSize:10, cursor:'pointer', fontFamily:'Space Mono,monospace' }}>POLY</button>
          <button onClick={() => store.setParam('bassStack',!store.params.bassStack)} style={{ padding:'4px 7px', borderRadius:3, border:'1px solid rgba(34,211,238,0.25)', background:store.params.bassStack?'rgba(34,211,238,0.12)':'rgba(255,255,255,0.03)', color:store.params.bassStack?'#22d3ee':'rgba(255,255,255,0.55)', fontSize:10, cursor:'pointer', fontFamily:'Space Mono,monospace' }}>STACK</button>
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
          {['mixer','synth','session'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex:1, padding:'5px 0', fontSize:9.5, fontWeight:700, letterSpacing:'0.1em', border:'none', background:'transparent', color: tab===t?gc:'rgba(255,255,255,0.45)', cursor:'pointer', borderBottom: tab===t?`2px solid ${gc}`:'2px solid transparent', textTransform:'uppercase', fontFamily:'Space Mono,monospace', transition:'color 0.1s' }}>{t}</button>
          ))}
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'6px 7px', display:'flex', flexDirection:'column', gap:3 }}>
          {tab === 'mixer' && <>
            {MIXER_PARAMS.map(({ l, k, c, min, max }) => {
              const val = store.params[k] ?? min
              const pct = ((val-min)/(max-min)*100).toFixed(0)
              return (
                <div key={k}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:9, letterSpacing:'0.08em', color:'rgba(255,255,255,0.45)', textTransform:'uppercase', fontFamily:'Space Mono,monospace' }}>{l}</span>
                    <span style={{ fontSize:9, color:c, fontFamily:'Space Mono,monospace' }}>{pct}</span>
                  </div>
                  <input type="range" min={min} max={max} step={(max-min)/200} value={val}
                    onChange={e => store.setParam(k, Number(e.target.value))}
                    style={{ width:'100%', accentColor:c, color:c, height:12 }} />
                </div>
              )
            })}
            <div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', letterSpacing:'0.1em', marginBottom:2, textTransform:'uppercase', fontFamily:'Space Mono,monospace' }}>GROOVE PROFILE</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
                {['steady','broken','bunker','float'].map(gp => (
                  <button key={gp} onClick={() => store.setParam('grooveProfile',gp)} style={{ padding:'3px', borderRadius:2, border:`1px solid ${store.params.grooveProfile===gp?gc:'rgba(255,255,255,0.08)'}`, background:store.params.grooveProfile===gp?`${gc}18`:'rgba(255,255,255,0.02)', color:store.params.grooveProfile===gp?gc:'rgba(255,255,255,0.55)', fontSize:9.5, cursor:'pointer', fontFamily:'Space Mono,monospace', letterSpacing:'0.06em', textTransform:'uppercase' }}>{gp}</button>
                ))}
              </div>
            </div>
          </>}

          {tab === 'synth' && <>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:'Space Mono,monospace' }}>SECTION GENERATOR</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:2 }}>
              {Object.keys(SECTIONS).map(sec => (
                <button key={sec} onClick={() => store.regenerateSection(sec)} style={{ padding:'5px 3px', borderRadius:2, border:`1px solid ${store.sectionName===sec?gc:'rgba(255,255,255,0.08)'}`, background:store.sectionName===sec?`${gc}18`:'rgba(255,255,255,0.02)', color:store.sectionName===sec?gc:'rgba(255,255,255,0.55)', fontSize:10, cursor:'pointer', fontFamily:'Space Mono,monospace', textTransform:'uppercase' }}>{sec}</button>
              ))}
            </div>
          </>}

          {tab === 'session' && <>
            <button onClick={store.recState==='idle' ? store._startRec : store._stopRec} style={{ padding:'7px', borderRadius:3, border:`1px solid ${store.recState==='recording'?'#ff2244':'rgba(255,255,255,0.12)'}`, background:store.recState==='recording'?'rgba(255,34,68,0.12)':'rgba(255,255,255,0.03)', color:store.recState==='recording'?'#ff2244':'rgba(255,255,255,0.4)', fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'Space Mono,monospace', textAlign:'center' }}>
              {store.recState==='recording' ? '■ STOP REC' : '● REC'}
            </button>

            {store.recordings.map((r, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:3, padding:'3px 5px', borderRadius:3, background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.05)' }}>
                <audio src={r.url} controls style={{ flex:1, height:22, filter:'invert(1)', opacity:0.65 }} />
                <a href={r.url} download={r.name} style={{ color:gc, fontSize:9.5, textDecoration:'none', fontFamily:'Space Mono,monospace' }}>DL</a>
              </div>
            ))}

            <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'4px 0' }} />

            <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'Space Mono,monospace' }}>SCENES</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:3 }}>
              {store.savedScenes.map((sc2, i) => (
                <div key={i} style={{ display:'flex', flexDirection:'column', gap:1 }}>
                  <button onClick={() => store.loadScene(i)} style={{ padding:'5px', borderRadius:3, border:`1px solid ${sc2?gc+'44':'rgba(255,255,255,0.08)'}`, background:sc2?`${gc}0d`:'rgba(255,255,255,0.02)', color:sc2?gc:'rgba(255,255,255,0.55)', fontSize:10, cursor:'pointer', fontFamily:'Space Mono,monospace', textAlign:'center' }}>S{i+1}{sc2?' ◆':''}</button>
                  <button onClick={() => store.saveScene(i)} style={{ padding:'2px', borderRadius:2, border:'1px solid rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.02)', color:'rgba(255,255,255,0.4)', fontSize:9, cursor:'pointer', fontFamily:'Space Mono,monospace', textAlign:'center' }}>SAVE</button>
                </div>
              ))}
            </div>

            <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'4px 0' }} />
            <button onClick={store.exportJSON} style={{ padding:'7px', borderRadius:3, border:`1px solid ${gc}44`, background:`${gc}0d`, color:gc, fontSize:10, cursor:'pointer', fontFamily:'Space Mono,monospace', textAlign:'center' }}>EXPORT JSON</button>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', lineHeight:1.7, letterSpacing:'0.06em', fontFamily:'Space Mono,monospace' }}>
              SPACE=play · A=drop · S=break<br/>
              D=build · F=groove · G=tension · H=fill<br/>
              M=mutate · R=regen · P=autopilot<br/>
              T=tap tempo · Ctrl+Z=undo
            </div>
          </>}
        </div>
      </div>
    </div>
  )
}

import React from 'react'
import { GENRE_CLR, SECTION_COLORS, LANE_CLR } from '../../engine/constants.js'
import StepGrid from '../ui/StepGrid.jsx'

const mono = { fontFamily: 'Space Mono,monospace' }

const SECTS = ['drop','break','build','groove','tension','fill','intro','outro']
const SHORTCUTS = { drop:'A', break:'S', build:'D', groove:'F', tension:'G', fill:'H' }
const ACTIONS = [
  { label:'MUTATE',    key:'mutate',         tip:'flip drum hits',   shortcut:'M' },
  { label:'THIN',      key:'thinOut',        tip:'sparse out' },
  { label:'THICKEN',   key:'thicken',        tip:'add hits' },
  { label:'REHARM',    key:'reharmonize',    tip:'new chords' },
  { label:'ARP →',     key:'shiftArp',       tip:'change arp' },
  { label:'REGEN',     key:'_regen',         tip:'full rebuild',     shortcut:'R' },
  { label:'RND SYNTH', key:'randomizeNotes', tip:'random notes' },
  { label:'RND BASS',  key:'randomizeBass',  tip:'random bass' },
  { label:'NOTES ↑',   key:'shiftNotesUp',   tip:'shift up' },
  { label:'NOTES ↓',   key:'shiftNotesDown', tip:'shift down' },
  { label:'CLEAR',     key:'clear',          tip:'clear all' },
]

export default function PerformView({ store, compact, phone }) {
  // Clean explicit destructuring - no spread tricks
  const genre        = store.genre
  const sectionName  = store.sectionName
  const modeName     = store.modeName
  const arpMode      = store.arpMode
  const isPlaying    = store.isPlaying
  const patterns     = store.patterns
  const bassLine     = store.bassLine
  const synthLine    = store.synthLine
  const laneLen      = store.laneLen
  const step         = store.step
  const page         = store.page
  const setPage      = store.setPage
  const activeNotes  = store.activeNotes
  const laneVU       = store.laneVU
  const songArc      = store.songArc
  const arcIdx       = store.arcIdx
  const songActive   = store.songActive
  const perfActions  = store.perfActions
  const regenerateSection = store.regenerateSection
  const toggleCell   = store.toggleCell
  const savedScenes  = store.savedScenes
  const saveScene    = store.saveScene
  const loadScene    = store.loadScene
  const setParam     = store.setParam
  const autopilotIntensity    = store.autopilotIntensity
  const setAutopilotIntensity = store.setAutopilotIntensity

  // Params pulled cleanly
  const master   = store.params.master
  const space    = store.params.space
  const tone     = store.params.tone
  const drive    = store.params.drive
  const grooveAmt = store.params.grooveAmt
  const swing    = store.params.swing

  const gc = GENRE_CLR[genre] || '#ff4444'
  const sc = SECTION_COLORS[sectionName] || gc

  const navBtn = { padding:'1px 5px', borderRadius:2, border:'1px solid rgba(255,255,255,0.09)', background:'rgba(255,255,255,0.03)', color:'rgba(255,255,255,0.7)', fontSize:10, cursor:'pointer', ...mono }

  return (
    <div style={{ flex:1, display:'flex', flexDirection: compact ? 'column' : 'row', gap:6, padding: phone ? '8px' : '5px 7px 8px', minHeight:0, overflowY:'auto', overflowX:'hidden' }}>

      {/* LEFT — Sections + Actions */}
      <div style={{ width: compact ? '100%' : 118, display:'flex', flexDirection:'column', gap:3, flexShrink:0 }}>
        <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:'0.18em', textTransform:'uppercase', ...mono }}>SECTIONS</div>
        {SECTS.map(sec => {
          const color = SECTION_COLORS[sec] || '#fff'
          const isActive = sectionName === sec
          return (
            <button key={sec} onClick={() => perfActions[sec]?.()} style={{
              padding:'5px 6px', borderRadius:4, cursor:'pointer', ...mono,
              border:`1px solid ${isActive ? color : color+'33'}`,
              background: isActive ? `${color}22` : `${color}08`,
              color: isActive ? color : `${color}88`,
              fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase',
              boxShadow: isActive ? `0 0 8px ${color}44` : 'none',
              display:'flex', justifyContent:'space-between', alignItems:'center',
              transition:'all 0.08s',
            }}>
              <span>{sec}</span>
              {SHORTCUTS[sec] && <span style={{ fontSize:9, opacity:0.35 }}>[{SHORTCUTS[sec]}]</span>}
            </button>
          )
        })}

        <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:'0.18em', marginTop:4, textTransform:'uppercase', ...mono }}>ACTIONS</div>
        {ACTIONS.map(({ label, key, tip, shortcut }) => (
          <button key={key} onClick={() => key === '_regen' ? regenerateSection(sectionName) : perfActions[key]?.()} title={tip} style={{
            padding:'4px 6px', borderRadius:3, cursor:'pointer', ...mono,
            border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.02)',
            color:'rgba(255,255,255,0.65)', fontSize:10, fontWeight:700,
            display:'flex', justifyContent:'space-between', alignItems:'center',
          }}>
            <span>{label}</span>
            {shortcut && <span style={{ fontSize:9, opacity:0.32 }}>[{shortcut}]</span>}
          </button>
        ))}
      </div>

      {/* CENTER — Grid */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:4, minWidth:0 }}>
        {/* Header bar */}
        <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:8, flexShrink:0, minHeight:22 }}>
          <div style={{ fontSize:13, fontWeight:700, color:sc, letterSpacing:'0.16em', textTransform:'uppercase', textShadow:`0 0 16px ${sc}55`, ...mono }}>
            {sectionName.toUpperCase()}
          </div>
          <div style={{ width:1, height:12, background:'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.4)', ...mono }}>{genre} · {modeName} · arp:{arpMode}</span>
          <div style={{ flex:1 }} />
          {songArc.length > 0 && (
            <div style={{ display:'flex', gap:2, alignItems:'center' }}>
              {songArc.map((s, i) => (
                <div key={i} style={{ width: i===arcIdx ? 22 : 14, height:4, borderRadius:2, transition:'all 0.2s', background: i===arcIdx ? (SECTION_COLORS[s]||gc) : i<arcIdx ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.05)' }} />
              ))}
            </div>
          )}
          <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page===0} style={{ ...navBtn, opacity: page===0 ? 0.3 : 1 }}>‹</button>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.4)', ...mono }}>{page+1}/4</span>
          <button onClick={() => setPage(p => Math.min(3, p+1))} disabled={page===3} style={{ ...navBtn, opacity: page===3 ? 0.3 : 1 }}>›</button>
        </div>

        {/* Lane VU meters */}
        <div style={{ display:'flex', gap:4, flexShrink:0 }}>
          {Object.entries(LANE_CLR).map(([lane, color]) => (
            <div key={lane} style={{ flex:1, display:'flex', flexDirection:'column', gap:1 }}>
              <div style={{ fontSize:8, color, letterSpacing:'0.1em', ...mono, textAlign:'center' }}>{lane[0].toUpperCase()}</div>
              <div style={{ height:3, borderRadius:2, background:'rgba(255,255,255,0.05)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${(laneVU[lane]||0)*100}%`, background:color, transition:'width 0.04s', boxShadow:`0 0 4px ${color}` }} />
              </div>
            </div>
          ))}
        </div>

        <StepGrid patterns={patterns} bassLine={bassLine} synthLine={synthLine}
          laneLen={laneLen} step={step} page={page} isPlaying={isPlaying}
          toggleCell={toggleCell} activeNotes={activeNotes} />
      </div>

      {/* RIGHT — Macros + Scenes */}
      <div style={{ width: compact ? '100%' : 118, display:'flex', flexDirection:'column', gap:4, flexShrink:0 }}>
        <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:'0.18em', textTransform:'uppercase', ...mono }}>MACROS</div>

        {[
          { label:'MASTER',   value:master,             setter: v => setParam('master', v),              color:'#ffffff', max:1 },
          { label:'SPACE',    value:space,              setter: v => setParam('space', v),               color:'#44ffcc', max:1 },
          { label:'TONE',     value:tone,               setter: v => setParam('tone', v),                color:'#22d3ee', max:1 },
          { label:'DRIVE',    value:drive,              setter: v => setParam('drive', v),               color:'#ff8844', max:1 },
          { label:'GROOVE',   value:grooveAmt,          setter: v => setParam('grooveAmt', v),           color:'#ffdd00', max:1 },
          { label:'SWING',    value:swing,              setter: v => setParam('swing', v),               color:'#aa88ff', max:0.25 },
          { label:'AUTO INT', value:autopilotIntensity, setter: setAutopilotIntensity,                   color:gc,        max:1 },
        ].map(({ label, value, setter, color, max }) => (
          <div key={label}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:9, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', ...mono }}>{label}</span>
              <span style={{ fontSize:9, color, ...mono }}>{Math.round((value/max)*100)}</span>
            </div>
            <input type="range" min={0} max={max} step={max/100} value={value}
              onChange={e => setter(Number(e.target.value))}
              style={{ width:'100%', accentColor:color, height:12 }} />
          </div>
        ))}

        <div style={{ flex:1 }} />

        {/* Scenes */}
        <div style={{ fontSize:9, color:'rgba(255,255,255,0.35)', letterSpacing:'0.18em', textTransform:'uppercase', ...mono }}>SCENES</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:2 }}>
          {savedScenes.map((sc2, i) => (
            <div key={i} style={{ display:'flex', flexDirection:'column', gap:1 }}>
              <button onClick={() => loadScene(i)} style={{ padding:'3px 2px', borderRadius:2, cursor:'pointer', ...mono, border:`1px solid ${sc2 ? gc+'44' : 'rgba(255,255,255,0.07)'}`, background: sc2 ? `${gc}0e` : 'rgba(255,255,255,0.01)', color: sc2 ? gc : 'rgba(255,255,255,0.4)', fontSize:10, fontWeight:700, textAlign:'center' }}>
                S{i+1}{sc2 ? '◆' : ''}
              </button>
              <button onClick={() => saveScene(i)} style={{ padding:'1px', borderRadius:2, border:'1px solid rgba(255,255,255,0.05)', background:'rgba(255,255,255,0.01)', color:'rgba(255,255,255,0.35)', fontSize:9, cursor:'pointer', ...mono, textAlign:'center' }}>
                SAVE
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

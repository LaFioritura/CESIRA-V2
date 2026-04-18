import React from 'react'
import { GENRE_CLR, SECTION_COLORS, LANE_CLR } from '../../engine/constants.js'
import { SectionBtn, ActionBtn, Slider, navBtn } from '../ui/shared.js'
import StepGrid from '../ui/StepGrid.jsx'

const SECTS = ['drop','break','build','groove','tension','fill','intro','outro']
const SHORTCUTS = { drop:'A', break:'S', build:'D', groove:'F', tension:'G', fill:'H' }
const ACTIONS = [
  { label:'MUTATE',    key:'mutate',          tip:'flip drum hits',    shortcut:'M' },
  { label:'THIN',      key:'thinOut',         tip:'sparse out' },
  { label:'THICKEN',   key:'thicken',         tip:'add hits' },
  { label:'REHARM',    key:'reharmonize',     tip:'new chords' },
  { label:'ARP→',      key:'shiftArp',        tip:'change arp mode' },
  { label:'REGEN',     key:'_regen',          tip:'full rebuild',      shortcut:'R' },
  { label:'RND SYNTH', key:'randomizeNotes',  tip:'random synth notes' },
  { label:'RND BASS',  key:'randomizeBass',   tip:'random bass notes' },
  { label:'NOTES ↑',   key:'shiftNotesUp',    tip:'shift up' },
  { label:'NOTES ↓',   key:'shiftNotesDown',  tip:'shift down' },
  { label:'CLEAR',     key:'clear',           tip:'clear all lanes' },
]

export default function PerformView({ store, compact, phone }) {
  const {
    genre, sectionName, modeName, arpMode, isPlaying,
    patterns, bassLine, synthLine, laneLen, step, page, setPage,
    activeNotes, laneVU, songArc, arcIdx, songActive,
    master, space, tone, drive, grooveAmt, swing, autopilotIntensity,
    params, setParam,
    perfActions, regenerateSection, toggleCell,
    savedScenes, saveScene, loadScene,
  } = { ...store, ...store.params, master:store.params.master, space:store.params.space, tone:store.params.tone, drive:store.params.drive, grooveAmt:store.params.grooveAmt, swing:store.params.swing, autopilotIntensity:store.autopilotIntensity }

  const gc = GENRE_CLR[genre] || '#ff4444'
  const sc = SECTION_COLORS[sectionName] || gc

  return (
    <div style={{ flex:1, display:'flex', flexDirection: compact ? 'column':'row', gap:6, padding: phone?'8px':'5px 7px 8px 7px', minHeight:0, overflowY:'auto', overflowX:'hidden' }}>

      {/* LEFT — Sections + Actions */}
      <div style={{ width: compact?'100%':118, display:'flex', flexDirection:'column', gap:3, flexShrink:0 }}>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'0.18em', textTransform:'uppercase', fontFamily:'Space Mono,monospace' }}>SECTIONS</div>
        {SECTS.map(sec => (
          <SectionBtn key={sec} name={sec} isActive={sectionName===sec}
            color={SECTION_COLORS[sec]||'#fff'}
            onClick={() => perfActions[sec] ? perfActions[sec]() : null}
            shortcut={SHORTCUTS[sec]}
          />
        ))}
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'0.18em', marginTop:3, textTransform:'uppercase', fontFamily:'Space Mono,monospace' }}>ACTIONS</div>
        {ACTIONS.map(({ label, key, tip, shortcut }) => (
          <ActionBtn key={key} label={label} tip={tip} shortcut={shortcut}
            onClick={() => key==='_regen' ? regenerateSection(sectionName) : perfActions[key]?.()}
          />
        ))}
      </div>

      {/* CENTER — Grid */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:4, minWidth:0, order: compact?1:2 }}>
        {/* Section header */}
        <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:8, minHeight:22, flexShrink:0 }}>
          <div style={{ fontSize:13, fontWeight:700, color:sc, letterSpacing:'0.16em', textTransform:'uppercase', textShadow:`0 0 16px ${sc}55`, fontFamily:'Space Mono,monospace' }}>
            {sectionName.toUpperCase()}
          </div>
          <div style={{ width:1, height:12, background:'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.45)', letterSpacing:'0.08em', fontFamily:'Space Mono,monospace' }}>{genre} · {modeName} · arp:{arpMode}</span>
          <div style={{ flex:1 }} />
          {songArc.length > 0 && (
            <div style={{ display:'flex', gap:2, alignItems:'center' }}>
              {songArc.map((s, i) => (
                <div key={i} style={{ width: i===arcIdx?22:14, height:4, borderRadius:2, background: i===arcIdx ? SECTION_COLORS[s]||gc : i<arcIdx ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.05)', transition:'all 0.2s' }} />
              ))}
            </div>
          )}
          <button onClick={() => setPage(p=>Math.max(0,p-1))} disabled={page===0} style={{ ...navBtn, opacity:page===0?0.3:1 }}>‹</button>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.5)', fontFamily:'Space Mono,monospace' }}>{page+1}/4</span>
          <button onClick={() => setPage(p=>Math.min(3,p+1))} disabled={page===3} style={{ ...navBtn, opacity:page===3?0.3:1 }}>›</button>
        </div>

        {/* VU bars */}
        <div style={{ display:'flex', gap:4, flexShrink:0 }}>
          {['kick','snare','hat','bass','synth'].map(lane => (
            <div key={lane} style={{ flex:1, display:'flex', flexDirection:'column', gap:1 }}>
              <div style={{ fontSize:8, color:LANE_CLR[lane], letterSpacing:'0.1em', fontFamily:'Space Mono,monospace', textAlign:'center' }}>{lane[0].toUpperCase()}</div>
              <div style={{ height:3, borderRadius:2, background:'rgba(255,255,255,0.05)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${(store.laneVU[lane]||0)*100}%`, background:LANE_CLR[lane], transition:'width 0.04s', boxShadow:`0 0 4px ${LANE_CLR[lane]}` }} />
              </div>
            </div>
          ))}
        </div>

        <StepGrid
          patterns={patterns} bassLine={bassLine} synthLine={synthLine}
          laneLen={laneLen} step={step} page={page} isPlaying={isPlaying}
          toggleCell={toggleCell} activeNotes={activeNotes}
        />
      </div>

      {/* RIGHT — Macros + Scenes */}
      <div style={{ width: compact?'100%':118, display:'flex', flexDirection:'column', gap:4, flexShrink:0, order: compact?3:3 }}>
        <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'0.18em', textTransform:'uppercase', fontFamily:'Space Mono,monospace' }}>MACROS</div>
        {[
          { label:'MASTER',   k:'master',             c:'#ffffff', max:1 },
          { label:'SPACE',    k:'space',              c:'#44ffcc', max:1 },
          { label:'TONE',     k:'tone',               c:'#22d3ee', max:1 },
          { label:'DRIVE',    k:'drive',              c:'#ff8844', max:1 },
          { label:'GROOVE',   k:'grooveAmt',          c:'#ffdd00', max:1 },
          { label:'SWING',    k:'swing',              c:'#aa88ff', max:0.25 },
          { label:'AUTO INT', k:'_autopilotIntensity',c:gc,        max:1 },
        ].map(({ label, k, c, max }) => {
          const val = k==='_autopilotIntensity' ? store.autopilotIntensity : (store.params[k]||0)
          const set = k==='_autopilotIntensity' ? store.setAutopilotIntensity : (v => store.setParam(k, v))
          const pct = ((val/(max||1))*100).toFixed(0)
          return (
            <div key={k}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:9, letterSpacing:'0.07em', color:'rgba(255,255,255,0.45)', textTransform:'uppercase', fontFamily:'Space Mono,monospace' }}>{label}</span>
                <span style={{ fontSize:9, color:c, fontFamily:'Space Mono,monospace' }}>{pct}</span>
              </div>
              <input type="range" min={0} max={max} step={0.01} value={val} onChange={e=>set(Number(e.target.value))}
                style={{ width:'100%', accentColor:c, color:c, height:12 }} />
            </div>
          )
        })}

        <div style={{ flex:1 }} />

        <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'0.18em', textTransform:'uppercase', fontFamily:'Space Mono,monospace' }}>SCENES</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:2 }}>
          {store.savedScenes.map((sc2, i) => (
            <div key={i} style={{ display:'flex', flexDirection:'column', gap:1 }}>
              <button onClick={() => loadScene(i)} style={{
                padding:'4px 2px', borderRadius:2, cursor:'pointer', fontFamily:'Space Mono,monospace',
                border:`1px solid ${sc2 ? gc+'44':'rgba(255,255,255,0.07)'}`,
                background: sc2 ? `${gc}0e`:'rgba(255,255,255,0.015)',
                color: sc2 ? gc :'rgba(255,255,255,0.55)', fontSize:10, fontWeight:700, textAlign:'center',
              }}>S{i+1}{sc2?'◆':''}</button>
              <button onClick={() => saveScene(i)} style={{ padding:'1px', borderRadius:2, border:'1px solid rgba(255,255,255,0.05)', background:'rgba(255,255,255,0.01)', color:'rgba(255,255,255,0.4)', fontSize:9, cursor:'pointer', fontFamily:'Space Mono,monospace', textAlign:'center' }}>SAVE</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

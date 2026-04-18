// ─── CESIRA V3 — Step Grid ────────────────────────────────────────────────────
import React from 'react'
import { LANE_CLR } from '../../engine/constants.js'
import { VU } from './shared.jsx'

export default function StepGrid({ patterns, bassLine, synthLine, laneLen, step, page, isPlaying, toggleCell, activeNotes, showNotes=false, setNote, notePool }) {
  const PAGE = 16
  const visStart = page * PAGE
  const visEnd   = Math.min(visStart + PAGE, 64)
  const visIdx   = Array.from({ length: visEnd - visStart }, (_, i) => visStart + i)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
      {['kick','snare','hat','bass','synth'].map(lane => {
        const lc = LANE_CLR[lane]
        const ll = laneLen[lane] || 16

        return (
          <div key={lane} style={{ display:'flex', alignItems:'stretch', gap:4, height:36 }}>
            {/* Label */}
            <div style={{ width:36, flexShrink:0, display:'flex', flexDirection:'column', justifyContent:'center', gap:2 }}>
              <span style={{ fontSize:10, fontWeight:700, color:lc, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:'Space Mono,monospace' }}>{lane}</span>
              {(lane==='bass'||lane==='synth') && activeNotes &&
                <span style={{ fontSize:9, color:'rgba(255,255,255,0.45)', letterSpacing:'0.04em', fontFamily:'Space Mono,monospace' }}>{activeNotes[lane]}</span>
              }
            </div>

            {/* Steps */}
            <div style={{ flex:1, display:'grid', gridTemplateColumns:`repeat(${visIdx.length},1fr)`, gap:1.5, alignItems:'stretch' }}>
              {visIdx.map(idx => {
                if (idx >= ll) return <div key={idx} style={{ borderRadius:2, background:'rgba(255,255,255,0.012)', opacity:0.3 }} />
                const sd = patterns[lane][idx]
                const on = sd.on, isActive = step === idx && isPlaying
                const isTied = sd.tied
                const isBeat = idx%4===0, isBar = idx%16===0

                const borderColor = isActive ? lc : isBar ? `${lc}44` : isBeat ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)'
                const bg = isActive
                  ? `${lc}88`
                  : isTied ? `${lc}1a`
                  : on ? `${lc}${Math.round(Math.min((sd.p||1),1)*255).toString(16).padStart(2,'0')}`
                  : 'rgba(255,255,255,0.02)'

                return (
                  <button key={idx} onClick={() => toggleCell(lane, idx)} style={{
                    borderRadius: isTied ? '1px 2px 2px 1px' : 2,
                    border: `1px solid ${borderColor}`,
                    borderLeft: isTied ? `2px solid ${lc}44` : `1px solid ${borderColor}`,
                    background: bg,
                    boxShadow: isActive ? `0 0 7px ${lc}77` : on && !isTied ? `0 0 2px ${lc}22` : 'none',
                    cursor:'pointer', transition:'background 0.03s',
                  }} />
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Note row */}
      <div style={{ display:'flex', gap:1.5, height:11, flexShrink:0 }}>
        {visIdx.map(idx => {
          const hasBass  = patterns.bass[idx]?.on
          const hasSynth = patterns.synth[idx]?.on
          const note = hasBass ? bassLine[idx] : hasSynth ? synthLine[idx] : null
          return (
            <div key={idx} style={{ flex:1, textAlign:'center' }}>
              {note && <span style={{ fontSize:7, color:'rgba(255,255,255,0.38)', fontFamily:'Space Mono,monospace' }}>{note.replace(/[0-9]/g,'')}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

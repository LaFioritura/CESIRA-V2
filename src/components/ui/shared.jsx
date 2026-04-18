// ─── CESIRA V3 — Shared UI Primitives ────────────────────────────────────────
import React from 'react'
import { SOUND_PRESETS } from '../../engine/constants.js'

export const navBtn = {
  padding:'2px 7px', borderRadius:2,
  border:'1px solid rgba(255,255,255,0.09)',
  background:'rgba(255,255,255,0.03)',
  color:'rgba(255,255,255,0.88)', fontSize:10,
  cursor:'pointer', fontFamily:'Space Mono,monospace',
}

export const mono = { fontFamily: 'Space Mono,monospace' }

export function Slider({ label, value, min=0, max=1, step, color='#ffffff', onChange }) {
  const s = step || (max-min)/200
  const pct = ((value-min)/(max-min)*100).toFixed(0)
  return (
    <div style={{ marginBottom:2 }}>
      <div style={{ display:'flex', justifyContent:'space-between' }}>
        <span style={{ fontSize:10, letterSpacing:'0.08em', color:'rgba(255,255,255,0.62)', textTransform:'uppercase' }}>{label}</span>
        <span style={{ fontSize:10, color, ...mono }}>{pct}</span>
      </div>
      <input type="range" min={min} max={max} step={s} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width:'100%', accentColor:color, color, height:12 }}
      />
    </div>
  )
}

export function PresetSelect({ label, value, category, onChange, accent='#ffffff', compact=false }) {
  const options = SOUND_PRESETS[category] || {}
  return (
    <label style={{ display:'flex', flexDirection:'column', gap:2, minWidth: compact ? 108 : 124 }}>
      <span style={{ fontSize:10, color:'rgba(255,255,255,0.55)', letterSpacing:'0.12em', textTransform:'uppercase' }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ background:'rgba(255,255,255,0.04)', border:`1px solid ${accent}33`, color:accent, borderRadius:4, padding: compact ? '3px 5px':'5px 7px', fontSize:10, ...mono, outline:'none' }}>
        {Object.entries(options).map(([key, preset]) =>
          <option key={key} value={key} style={{ color:'#111', background:'#f2f2f2' }}>{preset.label}</option>
        )}
      </select>
    </label>
  )
}

export function SectionBtn({ name, isActive, color, onClick, shortcut }) {
  return (
    <button onClick={onClick} style={{
      padding:'6px', borderRadius:4, cursor:'pointer', fontFamily:'Space Mono,monospace',
      border:`1px solid ${isActive ? color : color+'33'}`,
      background: isActive ? `${color}22` : `${color}08`,
      color: isActive ? color : `${color}88`,
      fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase',
      boxShadow: isActive ? `0 0 8px ${color}44` : 'none',
      display:'flex', justifyContent:'space-between', alignItems:'center',
      transition:'all 0.08s',
    }}>
      <span>{name}</span>
      {shortcut && <span style={{ fontSize:10, opacity:0.38 }}>[{shortcut}]</span>}
    </button>
  )
}

export function ActionBtn({ label, onClick, tip, shortcut }) {
  return (
    <button onClick={onClick} title={tip} style={{
      padding:'4px 6px', borderRadius:3, cursor:'pointer', fontFamily:'Space Mono,monospace',
      border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.02)',
      color:'rgba(255,255,255,0.72)', fontSize:10, fontWeight:700, letterSpacing:'0.06em',
      display:'flex', justifyContent:'space-between', alignItems:'center',
      transition:'all 0.08s',
    }}>
      <span>{label}</span>
      {shortcut && <span style={{ fontSize:10, opacity:0.35 }}>[{shortcut}]</span>}
    </button>
  )
}

export function VU({ value, color, height=3 }) {
  return (
    <div style={{ height, borderRadius:2, background:'rgba(255,255,255,0.05)', overflow:'hidden' }}>
      <div style={{ height:'100%', width:`${value*100}%`, background:color, borderRadius:2, transition:'width 0.04s', boxShadow:`0 0 4px ${color}` }} />
    </div>
  )
}

import React from 'react'
import { GENRE_CLR } from '../../engine/constants.js'

export default function ContextBar({ store, phone }) {
  const { genre, sectionName, modeName, arpMode, isPlaying, autopilot, songActive, arcIdx, songArc, params } = store
  const gc = GENRE_CLR[genre] || '#ff4444'
  const dot = <span style={{ color:'rgba(255,255,255,0.3)', fontSize:10 }}>·</span>

  return (
    <div style={{
      display:'flex', alignItems:'center', flexWrap:'wrap', gap:8,
      padding: phone ? '6px 10px' : '3px 10px',
      background:'rgba(0,0,0,0.25)', borderBottom:'1px solid rgba(255,255,255,0.04)',
      flexShrink:0, minHeight: phone ? 40 : 20, overflow:'hidden',
      fontFamily:'Space Mono,monospace',
    }}>
      <span style={{ fontSize:9.5, color:'rgba(255,255,255,0.35)', letterSpacing:'0.12em' }}>NOW PLAYING:</span>
      <span style={{ fontSize:10, fontWeight:700, color:gc, letterSpacing:'0.1em', textTransform:'uppercase' }}>{genre}</span>
      {dot}<span style={{ fontSize:10, color:'rgba(255,255,255,0.55)' }}>{sectionName}</span>
      {dot}<span style={{ fontSize:10, color:'rgba(255,255,255,0.55)' }}>{modeName}</span>
      {dot}<span style={{ fontSize:10, color:'rgba(255,255,255,0.55)' }}>arp:{arpMode}</span>
      {dot}<span style={{ fontSize:10, color:'rgba(255,255,255,0.55)' }}>poly:{params.polySynth?'3v':'mono'} / bass:{params.bassStack?'stack':'mono'}</span>
      {dot}<span style={{ fontSize:10, color: isPlaying ? '#00ff88' : 'rgba(255,255,255,0.55)' }}>{isPlaying ? '▶ RUNNING' : '■ STOPPED'}</span>
      {autopilot   && <>{dot}<span style={{ fontSize:10, color:gc }}>◈ AUTOPILOT ON</span></>}
      {songActive  && <>{dot}<span style={{ fontSize:10, color:'#ffaa00' }}>ARC {arcIdx+1}/{songArc.length}</span></>}
      <div style={{ flex:1 }} />
      {!phone && <span style={{ fontSize:9.5, color:'rgba(255,255,255,0.25)', letterSpacing:'0.06em' }}>SPACE=play · A=drop · S=break · D=build · F=groove · G=tension · M=mutate · R=regen · P=auto · T=tap</span>}
    </div>
  )
}

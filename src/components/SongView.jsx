import React from 'react'

export default function SongView({ genre, bpm, density, energy, stats }) {
  const blocks = [
    ['Intro', Math.round((1 - energy) * 28 + 8)],
    ['Groove', Math.round(density * 18 + 8)],
    ['Build', Math.round(energy * 12 + 8)],
    ['Peak', Math.round(energy * 20 + 10)],
    ['Outro', Math.round((1 - density) * 16 + 6)],
  ]
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <section className="panel">
        <div className="section-head"><h2>Commercial Layout</h2><span>Readable structure for a buyer demo</span></div>
        <div style={{ display: 'grid', gap: 12 }}>
          {blocks.map(([label, width]) => (
            <div key={label} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 12, alignItems: 'center' }}>
              <strong>{label}</strong>
              <div style={{ background: '#171d28', borderRadius: 999, overflow: 'hidden', border: '1px solid #283245' }}>
                <div style={{ width: `${Math.min(100, width * 2.6)}%`, height: 20, borderRadius: 999, background: 'linear-gradient(90deg,#7c5cff,#27d6a5)' }} />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="grid-3">
        <div className="panel"><div className="stat-label">Genre</div><div className="stat-value">{genre}</div></div>
        <div className="panel"><div className="stat-label">Tempo</div><div className="stat-value">{bpm} BPM</div></div>
        <div className="panel"><div className="stat-label">Complexity</div><div className="stat-value">{stats.activeSteps}</div></div>
      </section>
    </div>
  )
}

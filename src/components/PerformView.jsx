import React from 'react'
import { ShellButton, VuBar } from './shared'

export default function PerformView({ isPlaying, toggleTransport, applyScene, readMeter, status, stats, autopilot, setAutopilot }) {
  const meter = readMeter()
  const scenes = [
    ['drop', 'Drop'], ['break', 'Break'], ['build', 'Build'], ['groove', 'Groove'], ['tension', 'Tension'], ['fill', 'Fill'],
  ]
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <section className="panel hero-panel">
        <div>
          <p className="eyebrow">Live Console</p>
          <h2>Performance surface built for immediate control.</h2>
          <p className="hero-copy">The engine stays responsive, the transport is isolated, and failures in the interface do not leave the audio path in an unusable state.</p>
        </div>
        <div style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
          <ShellButton active={isPlaying} tone="success" onClick={toggleTransport}>{isPlaying ? 'Stop transport' : 'Start transport'}</ShellButton>
          <ShellButton active={autopilot} onClick={() => setAutopilot(!autopilot)}>{autopilot ? 'Autopilot on' : 'Autopilot off'}</ShellButton>
          <div><strong>Status:</strong> {status}</div>
          <VuBar values={meter} />
        </div>
      </section>
      <section className="panel">
        <div className="section-head"><h2>Scenes</h2><span>One-touch energy shifts</span></div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {scenes.map(([id, label]) => <ShellButton key={id} onClick={() => applyScene(id)}>{label}</ShellButton>)}
        </div>
      </section>
      <section className="grid-3">
        <div className="panel"><div className="stat-label">Arc</div><div className="stat-value">{stats.arc}</div></div>
        <div className="panel"><div className="stat-label">Active steps</div><div className="stat-value">{stats.activeSteps}</div></div>
        <div className="panel"><div className="stat-label">Resolution</div><div className="stat-value">{stats.steps} step</div></div>
      </section>
    </div>
  )
}

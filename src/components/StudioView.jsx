import React from 'react'
import { GENRE_PRESETS, LANES } from '@/engine/musicEngine'
import { Fader, InstrumentPresetCluster, PresetSelect, ShellButton, StepGrid } from './shared'
import { palette } from './ui'

export default function StudioView(props) {
  const { genre, setGenre, bpm, setBpm, swing, setSwing, density, setDensity, energy, setEnergy, mix, setMix, pattern, toggleStep, currentStep, instrumentPresetIds, setInstrumentPreset, randomize, mutate, undo } = props
  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <section className="panel">
        <div className="section-head">
          <h2>Production Core</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <ShellButton onClick={randomize}>Regenerate</ShellButton>
            <ShellButton onClick={() => mutate(0.18)}>Mutate</ShellButton>
            <ShellButton onClick={undo}>Undo</ShellButton>
          </div>
        </div>
        <div className="grid-3">
          <PresetSelect label="Genre" value={genre} options={Object.entries(GENRE_PRESETS).map(([id, item]) => ({ id, label: item.name }))} onChange={setGenre} />
          <Fader label="BPM" min={80} max={160} step={1} value={bpm} onChange={setBpm} />
          <Fader label="Swing" min={0} max={0.18} step={0.01} value={swing} onChange={setSwing} />
          <Fader label="Density" min={0.18} max={0.95} step={0.01} value={density} onChange={setDensity} />
          <Fader label="Energy" min={0.2} max={1} step={0.01} value={energy} onChange={setEnergy} />
        </div>
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Sequencer</h2>
          <span style={{ color: palette.muted }}>16-step grid with real transport feedback</span>
        </div>
        <StepGrid pattern={pattern} currentStep={currentStep} onToggle={toggleStep} />
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Instrument Presets</h2>
          <span style={{ color: palette.muted }}>Commercial-ready lane variation system</span>
        </div>
        <InstrumentPresetCluster values={instrumentPresetIds} onChange={setInstrumentPreset} />
      </section>

      <section className="panel">
        <div className="section-head">
          <h2>Mix</h2>
          <span style={{ color: palette.muted }}>Quick balance for each lane</span>
        </div>
        <div className="grid-3">
          {LANES.map((lane) => (
            <Fader key={lane} label={lane.toUpperCase()} value={mix[lane]} onChange={(value) => setMix(lane, value)} />
          ))}
        </div>
      </section>
    </div>
  )
}

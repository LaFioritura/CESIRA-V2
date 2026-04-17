import { BASS_PRESETS, KIT_PRESETS, SYNTH_PRESETS } from '../../engine/presets/genrePresets';
import StepGrid from '../sequencer/StepGrid';
import Panel from '../ui/Panel';

function Select({ label, value, options, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

export default function StudioView({ session, dispatch }) {
  return (
    <div className="view-grid studio-grid">
      <Panel title="Sequencer">
        {Object.entries(session.patterns).map(([lane, steps]) => (
          <StepGrid key={lane} lane={lane} steps={steps} currentStep={session.transport.step} dispatch={dispatch} />
        ))}
      </Panel>

      <Panel title="Sound">
        <div className="field-grid">
          <Select label="Bass preset" value={session.sound.bassPreset} options={Object.keys(BASS_PRESETS)} onChange={(value) => dispatch({ type: 'SET_SOUND_PRESET', key: 'bassPreset', value })} />
          <Select label="Synth preset" value={session.sound.synthPreset} options={Object.keys(SYNTH_PRESETS)} onChange={(value) => dispatch({ type: 'SET_SOUND_PRESET', key: 'synthPreset', value })} />
          <Select label="Kit preset" value={session.sound.kitPreset} options={Object.keys(KIT_PRESETS)} onChange={(value) => dispatch({ type: 'SET_SOUND_PRESET', key: 'kitPreset', value })} />
        </div>
        <div className="field-grid">
          {Object.entries(session.sound.fx).map(([key, value]) => (
            <label key={key} className="field">
              <span>{key}</span>
              <input type="range" min="0" max="1" step="0.01" value={value} onChange={(e) => dispatch({ type: 'SET_FX_VALUE', key, value: Number(e.target.value) })} />
            </label>
          ))}
        </div>
      </Panel>

      <Panel title="Mixer">
        <div className="mixer-grid">
          {Object.entries(session.mixer).map(([lane, config]) => (
            <div key={lane} className="mixer-strip">
              <strong>{lane}</strong>
              <input type="range" min="0" max="1" step="0.01" value={config.volume} onChange={(e) => dispatch({ type: 'SET_MIXER_VALUE', lane, key: 'volume', value: Number(e.target.value) })} />
              <div className="strip-buttons">
                <button className={config.muted ? 'active' : ''} onClick={() => dispatch({ type: 'SET_MIXER_VALUE', lane, key: 'muted', value: !config.muted })}>Mute</button>
                <button className={config.solo ? 'active' : ''} onClick={() => dispatch({ type: 'SET_MIXER_VALUE', lane, key: 'solo', value: !config.solo })}>Solo</button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

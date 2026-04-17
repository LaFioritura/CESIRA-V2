import Panel from '../ui/Panel';
import Knob from '../ui/Knob';

const ACTIONS = [
  { key: 'drop', label: 'Drop' },
  { key: 'fill', label: 'Fill' },
  { key: 'break', label: 'Break' },
  { key: 'build', label: 'Build' },
  { key: 'energy', label: 'Energy Boost' },
];

export default function PerformView({ session, dispatch, metrics }) {
  return (
    <div className="view-grid perform-grid">
      <Panel title="Performance Macros" right={<span className="pill">{session.performancePreset}</span>}>
        <div className="knob-grid">
          {Object.entries(session.performance).map(([key, value]) => (
            <Knob key={key} label={key} value={value} onChange={(next) => dispatch({ type: 'SET_PERFORMANCE_VALUE', key, value: next })} />
          ))}
        </div>
      </Panel>

      <Panel title="Performance Actions">
        <div className="actions-grid">
          {ACTIONS.map((action) => (
            <button key={action.key} className="action-btn" onClick={() => dispatch({ type: 'APPLY_ACTION', kind: action.key })}>{action.label}</button>
          ))}
          <button className="action-btn primary" onClick={() => dispatch({ type: 'EVOLVE' })}>Evolve Phrase</button>
        </div>
      </Panel>

      <Panel title="Pulse" right={<span className="pill">Section {session.currentSection}</span>}>
        <div className="pulse-meter">
          {Array.from({ length: 16 }, (_, index) => (
            <div key={index} className={`pulse-cell ${metrics.currentStep === index ? 'on' : ''}`} />
          ))}
        </div>
        <div className="status-grid">
          <div><span>Density</span><strong>{Math.round(session.performance.density * 100)}</strong></div>
          <div><span>Tension</span><strong>{Math.round(session.performance.tension * 100)}</strong></div>
          <div><span>Groove</span><strong>{Math.round(session.performance.groove * 100)}</strong></div>
          <div><span>Voices</span><strong>{metrics.activeVoices}</strong></div>
        </div>
      </Panel>
    </div>
  );
}

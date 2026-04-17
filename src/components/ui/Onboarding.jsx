export function Onboarding({ onClose }) {
  return (
    <div className="overlay">
      <div className="modal onboarding">
        <h2>Welcome to CESIRA</h2>
        <p>Start with Play, then move the macro controls to push density, tension, groove, drive and space. Use Studio to sculpt the pattern and Song to steer the arrangement.</p>
        <ul>
          <li>Play generates and performs a stable 16-step loop.</li>
          <li>Evolve refreshes the phrase without destroying its identity.</li>
          <li>Export Loop writes a WAV file from the current state.</li>
        </ul>
        <button className="primary" onClick={onClose}>Enter workstation</button>
      </div>
    </div>
  );
}

export function Splash({ onStart }) {
  return (
    <div className="overlay splash">
      <div className="modal splash-card">
        <p className="eyebrow">Autonomous Electronic Music Workstation</p>
        <h1>CESIRA</h1>
        <p>A browser-native instrument for generative composition, live control, sequence editing and instant export.</p>
        <button className="primary" onClick={onStart}>Launch CESIRA</button>
      </div>
    </div>
  );
}

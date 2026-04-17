import { useEffect, useMemo, useRef, useState } from 'react';
import { AudioEngine } from './engine/audio/AudioEngine';
import { exportLoopWav, exportMidi } from './engine/audio/exporters';
import { GENRES, PERFORMANCE_PRESETS } from './engine/presets/genrePresets';
import { useSession } from './state/useSession';
import PerformView from './components/views/PerformView';
import SongView from './components/views/SongView';
import StudioView from './components/views/StudioView';
import { Onboarding, Splash } from './components/ui/Onboarding';

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [session, dispatch] = useSession();
  const engineRef = useRef(null);
  const [metrics, setMetrics] = useState({ currentStep: 0, activeVoices: 0 });
  const [loading, setLoading] = useState(false);

  const mixer = useMemo(() => {
    const soloed = Object.values(session.mixer).some((lane) => lane.solo);
    if (!soloed) return session.mixer;
    const next = {};
    for (const [lane, config] of Object.entries(session.mixer)) {
      next[lane] = { ...config, muted: !config.solo };
    }
    return next;
  }, [session.mixer]);

  useEffect(() => {
    const engine = new AudioEngine();
    engineRef.current = engine;
    return () => {
      engine.stop();
      engine.panic();
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine?.ctx) return;
    engine.setMixer(mixer);
    engine.setFx(session.sound.fx);
  }, [mixer, session.sound.fx]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setOnStep((step) => {
      dispatch({ type: 'SET_STEP', step });
      setMetrics((current) => ({ ...current, currentStep: step }));
    });
  }, [dispatch]);

  async function handlePlay() {
    const engine = engineRef.current;
    if (!engine) return;
    await engine.ensure();
    engine.setMixer(mixer);
    engine.setFx(session.sound.fx);
    if (engine.ctx.state === 'suspended') await engine.ctx.resume();
    engine.play(session);
    dispatch({ type: 'SET_PLAYING', playing: true });
  }

  function handleStop() {
    const engine = engineRef.current;
    if (!engine) return;
    engine.stop();
    engine.stopAllSound();
    dispatch({ type: 'SET_PLAYING', playing: false });
    dispatch({ type: 'SET_STEP', step: 0 });
    setMetrics((current) => ({ ...current, currentStep: 0 }));
  }

  async function toggleRecording() {
    const engine = engineRef.current;
    if (!engine) return;
    await engine.ensure();
    if (!session.transport.recording) {
      engine.startRecording();
      dispatch({ type: 'SET_RECORDING', recording: true });
      return;
    }
    const blob = await engine.stopRecording();
    dispatch({ type: 'SET_RECORDING', recording: false });
    if (blob) downloadBlob(blob, `${session.projectName.replace(/\s+/g, '-').toLowerCase()}-take.webm`);
  }

  function exportSession() {
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `${session.projectName.replace(/\s+/g, '-').toLowerCase()}.json`);
  }

  function importSession(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        dispatch({ type: 'LOAD_SESSION', session: parsed });
      } catch {
        alert('Invalid session file');
      }
    };
    reader.readAsText(file);
  }

  async function exportLoop() {
    setLoading(true);
    try {
      const blob = exportLoopWav({ ...session, mixer });
      downloadBlob(blob, `${session.projectName.replace(/\s+/g, '-').toLowerCase()}-loop.wav`);
    } finally {
      setLoading(false);
    }
  }

  function exportMidiFile() {
    const blob = exportMidi(session);
    downloadBlob(blob, `${session.projectName.replace(/\s+/g, '-').toLowerCase()}-notes.csv`);
  }

  const activeVoices = Object.values(session.patterns).reduce((sum, lane) => sum + lane.filter((step) => step.active).length, 0);
  useEffect(() => setMetrics((current) => ({ ...current, activeVoices })), [activeVoices]);

  return (
    <div className="app-shell">
      {!session.splashDismissed ? <Splash onStart={() => dispatch({ type: 'DISMISS_SPLASH' })} /> : null}
      {session.splashDismissed && !session.onboardingSeen ? <Onboarding onClose={() => dispatch({ type: 'DISMISS_ONBOARDING' })} /> : null}

      <header className="topbar">
        <div>
          <p className="eyebrow">Version 1.0 · Browser Workstation</p>
          <h1>CESIRA</h1>
        </div>
        <div className="project-meta">
          <input value={session.projectName} onChange={(e) => dispatch({ type: 'SET_PROJECT_NAME', value: e.target.value })} />
          <div className="transport-row">
            <button className="primary" onClick={session.transport.playing ? handleStop : handlePlay}>{session.transport.playing ? 'Stop' : 'Play'}</button>
            <button onClick={toggleRecording}>{session.transport.recording ? 'Stop Rec' : 'Record'}</button>
            <button onClick={() => engineRef.current?.panic()}>Panic</button>
          </div>
        </div>
      </header>

      <section className="toolbar">
        <div className="toolbar-block">
          <label>
            Genre
            <select value={session.genreKey} onChange={(e) => dispatch({ type: 'SET_GENRE', genreKey: e.target.value })}>
              {Object.entries(GENRES).map(([key, genre]) => <option key={key} value={key}>{genre.label}</option>)}
            </select>
          </label>
          <label>
            Performance
            <select value={session.performancePreset} onChange={(e) => dispatch({ type: 'SET_PERFORMANCE_PRESET', key: e.target.value })}>
              {Object.keys(PERFORMANCE_PRESETS).map((key) => <option key={key} value={key}>{key}</option>)}
            </select>
          </label>
          <label>
            BPM
            <input type="number" value={session.bpm} onChange={(e) => dispatch({ type: 'SET_BPM', bpm: Number(e.target.value) })} />
          </label>
        </div>

        <div className="toolbar-block view-switches">
          {['perform', 'studio', 'song'].map((view) => (
            <button key={view} className={session.currentView === view ? 'active' : ''} onClick={() => dispatch({ type: 'SET_VIEW', view })}>{view}</button>
          ))}
        </div>

        <div className="toolbar-block export-block">
          <button onClick={exportSession}>Export Session</button>
          <label className="import-btn">Import Session<input type="file" accept="application/json" onChange={importSession} /></label>
          <button onClick={exportLoop} disabled={loading}>{loading ? 'Rendering…' : 'Export Loop WAV'}</button>
          <button onClick={exportMidiFile}>Export MIDI Notes</button>
        </div>
      </section>

      <main className="main-stage">
        {session.currentView === 'perform' ? <PerformView session={session} dispatch={dispatch} metrics={metrics} /> : null}
        {session.currentView === 'studio' ? <StudioView session={session} dispatch={dispatch} /> : null}
        {session.currentView === 'song' ? <SongView session={session} dispatch={dispatch} /> : null}
      </main>
    </div>
  );
}

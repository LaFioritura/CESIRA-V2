import React, { useEffect } from 'react'
import PerformView from '@/components/PerformView'
import SongView from '@/components/SongView'
import StudioView from '@/components/StudioView'
import { NavPager, ShellButton } from '@/components/shared'
import { palette } from '@/components/ui'
import { useAudioEngine } from '@/hooks/useAudioEngine'
import { useComposition } from '@/hooks/useComposition'

export default function App() {
  const composition = useComposition()
  const audio = useAudioEngine({
    bpm: composition.bpm,
    swing: composition.swing,
    pattern: composition.pattern,
    notes: composition.notes,
    mix: composition.mix,
    energy: composition.energy,
    instrumentPresetIds: composition.instrumentPresetIds,
  })

  useEffect(() => {
    const onKey = (event) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
      if (event.code === 'Space') {
        event.preventDefault()
        audio.toggleTransport()
      }
      const map = {
        KeyA: 'drop', KeyS: 'break', KeyD: 'build', KeyF: 'groove', KeyG: 'tension', KeyH: 'fill',
      }
      if (map[event.code]) composition.applyScene(map[event.code])
      if (event.code === 'KeyM') composition.mutate(0.2)
      if (event.code === 'KeyR') composition.randomize()
      if (event.code === 'KeyP') composition.setAutopilot(!composition.autopilot)
      if ((event.metaKey || event.ctrlKey) && event.code === 'KeyZ') composition.undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [audio, composition])

  const activeView = {
    studio: <StudioView {...composition} currentStep={audio.currentStep} />,
    perform: <PerformView {...composition} {...audio} />,
    song: <SongView {...composition} />,
  }[composition.view]

  return (
    <div style={{ minHeight: '100vh', background: `radial-gradient(circle at top right, rgba(124,92,255,.18), transparent 24%), ${palette.bg}` }}>
      <div className="app-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">CESIRA V2</p>
            <h1>Autonomous Electronic Music Workstation</h1>
            <p className="subcopy">Refactored, stabilized, expanded for commercial presentation and deploy-ready delivery.</p>
          </div>
          <div style={{ display: 'grid', gap: 10, justifyItems: 'end' }}>
            <NavPager view={composition.view} setView={composition.setView} />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'end' }}>
              <ShellButton active={audio.isPlaying} tone="success" onClick={audio.toggleTransport}>{audio.isPlaying ? 'Stop' : 'Play'}</ShellButton>
              <ShellButton onClick={composition.randomize}>New idea</ShellButton>
            </div>
          </div>
        </header>
        {activeView}
      </div>
    </div>
  )
}

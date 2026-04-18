import React, { useEffect, useRef, useCallback } from 'react'
import { useStore } from './state/useStore.js'
import { useScheduler } from './hooks/useScheduler.js'
import { initAudio, startRecording, applyFx, getCtx } from './engine/audio.js'
import { GENRE_CLR } from './engine/constants.js'
import TopBar      from './components/views/TopBar.jsx'
import ContextBar  from './components/views/ContextBar.jsx'
import PerformView from './components/views/PerformView.jsx'
import StudioView  from './components/views/StudioView.jsx'
import SongView    from './components/views/SongView.jsx'

export default function App() {
  const store = useStore()
  const scheduler = useScheduler(store)

  // ── Apply FX whenever audio params change
  useEffect(() => {
    if (getCtx()) applyFx({ space:store.params.space, tone:store.params.tone, drive:store.params.drive, compress:store.params.compress, master:store.params.master, genre:store.genre })
  }, [store.params.space, store.params.tone, store.params.drive, store.params.compress, store.params.master, store.genre])

  // ── MIDI init
  useEffect(() => {
    if (!navigator.requestMIDIAccess) return
    navigator.requestMIDIAccess()
      .then(m => { store.midiRef.current = m; window._midiOut = [...m.outputs.values()][0]; store.setMidiOk(true) })
      .catch(() => {})
  }, []) // eslint-disable-line

  // ── Recording helpers (passed down)
  const startRec = useCallback(async () => {
    await initAudio()
    if (store.recState === 'recording') return
    store.setRecState('recording')
    store.setStatus('● REC')
    const rec = startRecording((url, ext) => {
      store.setRecordings(p => [{ url, name:`${store.projectName.replace(/\s+/g,'-')}-take-${p.length+1}.${ext}`, time: new Date().toLocaleTimeString() }, ...p.slice(0,7)])
      store.setRecState('idle')
      store.setStatus('Take saved')
    })
    store.recorderRef.current = rec
  }, [store])

  const stopRec = useCallback(() => {
    if (store.recorderRef.current && store.recState === 'recording') {
      store.recorderRef.current.stop()
      store.setRecState('stopping')
    }
  }, [store])

  // ── Autopilot
  const runAutopilot = useCallback(() => {
    if (!store.autopilotRef.current) return
    const r = Math.random()
    const intensity = store.autopilotIntensity
    if      (r < 0.25*intensity) store.perfActions.mutate()
    else if (r < 0.40*intensity) store.perfActions.shiftArp()
    else if (r < 0.55)           store.regenerateSection(store.sectionName)
    else if (r < 0.65*intensity) store.perfActions.thinOut()
    else if (r < 0.75*intensity) store.perfActions.thicken()
    else if (r < 0.82)           store.perfActions.reharmonize()
    if (Math.random() < 0.15*intensity) {
      const secs = ['drop','break','build','groove','tension','fill']
      store.triggerSection(secs[Math.floor(Math.random()*secs.length)])
    }
    const delay = (8 + Math.random()*16) * (1 - intensity*0.4) * 1000 * (240/store.bpm)
    store.autopilotTimerRef.current = setTimeout(runAutopilot, delay)
  }, [store]) // eslint-disable-line

  useEffect(() => {
    if (store.autopilot) {
      store.setStatus('Autopilot engaged')
      const delay = (4 + Math.random()*8) * 1000 * (240/store.bpm)
      store.autopilotTimerRef.current = setTimeout(runAutopilot, delay)
    } else {
      if (store.autopilotTimerRef.current) clearTimeout(store.autopilotTimerRef.current)
      store.setStatus('Autopilot off')
    }
    return () => { if (store.autopilotTimerRef.current) clearTimeout(store.autopilotTimerRef.current) }
  }, [store.autopilot]) // eslint-disable-line

  // ── Keyboard shortcuts
  useEffect(() => {
    const onKey = e => {
      if (e.target.tagName === 'INPUT') return
      const pa = store.perfActions
      switch (e.code) {
        case 'Space': e.preventDefault(); scheduler.toggle(); break
        case 'KeyA':  pa.drop();          break
        case 'KeyS':  pa.break();         break
        case 'KeyD':  pa.build();         break
        case 'KeyF':  pa.groove();        break
        case 'KeyG':  pa.tension();       break
        case 'KeyH':  pa.fill();          break
        case 'KeyM':  pa.mutate();        break
        case 'KeyR':  store.regenerateSection(store.sectionName); break
        case 'KeyP':  store.setAutopilot(v => !v); break
        case 'KeyT':  store.tapTempo();   break
        case 'KeyZ':  if (e.metaKey||e.ctrlKey) { e.preventDefault(); store.undo() } break
        default: break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [store.sectionName, scheduler.toggle]) // eslint-disable-line

  // ── Responsive
  const [viewport, setViewport] = React.useState(window.innerWidth)
  useEffect(() => {
    const fn = () => setViewport(window.innerWidth)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  const compact = viewport < 1180
  const phone   = viewport < 820

  const gc = GENRE_CLR[store.genre] || '#ff4444'

  // Enrich store with recording helpers
  const enrichedStore = { ...store, _startRec: startRec, _stopRec: stopRec }

  return (
    <div style={{
      width:'100vw', height:'100dvh', background:'#060608', color:'#e8e8e8',
      fontFamily:"'DM Sans',sans-serif", display:'flex', flexDirection:'column',
      overflow:'hidden', userSelect:'none', position:'relative',
    }}>
      {/* Scanline overlay */}
      <div style={{ position:'fixed', inset:0, backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.07) 2px,rgba(0,0,0,0.07) 4px)', pointerEvents:'none', zIndex:999 }} />

      <TopBar     store={enrichedStore} scheduler={scheduler} phone={phone} compact={compact} />
      <ContextBar store={enrichedStore} phone={phone} />

      {store.view === 'perform' && <PerformView store={enrichedStore} compact={compact} phone={phone} />}
      {store.view === 'studio'  && <StudioView  store={enrichedStore} compact={compact} phone={phone} />}
      {store.view === 'song'    && <SongView    store={enrichedStore} compact={compact} phone={phone} />}
    </div>
  )
}

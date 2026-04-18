// ─── CESIRA V3 — Scheduler Hook ──────────────────────────────────────────────
import { useRef, useCallback } from 'react'
import { clamp, GENRES } from '../engine/constants.js'
import { grooveAccent } from '../engine/music.js'
import { getCtx, initAudio, playKick, playSnare, playHat, playBass, playSynth } from '../engine/audio.js'

const SCHED = 0.14
const LOOK  = 20

export function useScheduler(store) {
  const schedulerRef = useRef(null)
  const nextNoteRef  = useRef(0)
  const stepRef      = useRef(0)

  const stepInterval = useCallback((si) => {
    const ms = (60 / store.bpmRef.current) * 1000 / 4
    const sw = si%2===1 ? ms*store.paramsRef.current.swing : -ms*store.paramsRef.current.swing*0.5
    return Math.max(0.028, (ms + sw) / 1000)
  }, [store.bpmRef, store.paramsRef])

  const scheduleNote = useCallback((si, t) => {
    const lp  = store.patternsRef.current
    const ll  = store.laneLenRef.current
    const p   = store.paramsRef.current
    const genre = store.genreRef.current
    const gd  = GENRES[genre] || GENRES.techno
    const accent = si%4===0 ? 1 : 0.85

    const drumP = { kickFreq:gd.kickFreq||90, kickEnd:gd.kickEnd||40, kickDecay:p.drumDecay, noiseMix:p.noiseMix, bassSubAmt:p.bassSubAmt, noiseColor:gd.noiseColor||'white', drumDecay:p.drumDecay, compress:p.compress }
    const bassP  = { bassFilter:p.bassFilter, bassSubAmt:p.bassSubAmt, fmIdx:p.fmIdx, tone:p.tone, compress:p.compress, bassMode:gd.bassMode, modeName:store.modeName, bassStack:p.bassStack, bpmRef:store.bpmRef.current }
    const synthP = { synthFilter:p.synthFilter, space:p.space, tone:p.tone, compress:p.compress, fmIdx:p.fmIdx, synthMode:gd.synthMode, modeName:store.modeName, polySynth:p.polySynth, bpmRef:store.bpmRef.current }

    for (const lane of ['kick','snare','hat','bass','synth']) {
      const len = ll[lane] || 16
      const li  = si % len
      const sd  = lp[lane][li]
      if (!sd?.on || sd.tied) continue
      if (sd.p < 1 && Math.random() > sd.p) continue

      const jit   = (Math.random()-0.5) * (p.humanize||0.012) * 0.02
      const noteT = t + Math.max(0, jit)
      const ga    = grooveAccent(p.grooveProfile||'steady', lane, li, p.grooveAmt||0.65)
      const fa    = clamp(accent * ga * (sd.v||1), 0.1, 1.15)

      if      (lane==='kick')  playKick(fa, noteT, drumP)
      else if (lane==='snare') playSnare(fa, noteT, drumP)
      else if (lane==='hat')   playHat(fa, noteT, si%32===0&&Math.random()<0.12, drumP)
      else if (lane==='bass')  {
        const note = store.bassRef.current[li] || 'C2'
        const ns = playBass(note, fa, noteT, sd.l||1, bassP)
        const delay = Math.max(0,(noteT-getCtx().currentTime)*1000)
        setTimeout(()=>store.setActiveNotes(p=>({...p,bass:ns})), delay)
      }
      else if (lane==='synth') {
        const note = store.synthRef.current[li] || 'C4'
        const ns = playSynth(note, fa, noteT, sd.l||1, synthP)
        const delay = Math.max(0,(noteT-getCtx().currentTime)*1000)
        setTimeout(()=>store.setActiveNotes(p=>({...p,synth:ns})), delay)
      }

      const delay = Math.max(0,(noteT-getCtx().currentTime)*1000)
      setTimeout(()=>store.flashLane(lane, fa), delay)
    }

    if (si === 0) store.onBarElapsed()
  }, [store])

  const runScheduler = useCallback(() => {
    const ctx = getCtx()
    if (!ctx || !store.isPlayingRef.current) return
    const now = ctx.currentTime
    while (nextNoteRef.current < now + SCHED) {
      const si = stepRef.current
      scheduleNote(si, nextNoteRef.current)
      const delay = Math.max(0, (nextNoteRef.current - now) * 1000)
      setTimeout(()=>store.setStep(si), delay)
      nextNoteRef.current += stepInterval(si)
      stepRef.current = (si + 1) % 64
    }
  }, [scheduleNote, stepInterval, store])

  const start = useCallback(async () => {
    await initAudio()
    const ctx = getCtx(); if (!ctx) return
    if (ctx.state==='suspended') await ctx.resume()
    nextNoteRef.current = ctx.currentTime + 0.06
    stepRef.current = 0
    store.isPlayingRef.current = true
    schedulerRef.current = setInterval(runScheduler, LOOK)
    store.setIsPlaying(true)
    store.setStatus(`Playing — ${store.genreRef.current} · ${store.sectionName}`)
  }, [runScheduler, store])

  const stop = useCallback(() => {
    if (schedulerRef.current) { clearInterval(schedulerRef.current); schedulerRef.current=null }
    store.isPlayingRef.current = false
    store.setIsPlaying(false)
    store.setStep(0)
    store.setStatus('Stopped')
  }, [store])

  const toggle = useCallback(async () => {
    if (store.isPlayingRef.current) stop(); else await start()
  }, [store.isPlayingRef, start, stop])

  return { start, stop, toggle }
}

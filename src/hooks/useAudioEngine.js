import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { LANES, STEPS, noteToFreq, resolveInstrumentPreset } from '@/engine/musicEngine'

function createNoiseBuffer(ctx) {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate)
  const channel = buffer.getChannelData(0)
  for (let i = 0; i < channel.length; i++) channel[i] = Math.random() * 2 - 1
  return buffer
}

export function useAudioEngine({ bpm, swing, pattern, notes, mix, energy, instrumentPresetIds }) {
  const ctxRef = useRef(null)
  const masterRef = useRef(null)
  const analyserRef = useRef(null)
  const noiseRef = useRef(null)
  const intervalRef = useRef(null)
  const nextNoteTimeRef = useRef(0)
  const stepRef = useRef(0)
  const transportRef = useRef(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [status, setStatus] = useState('armed')

  const meterData = useMemo(() => new Uint8Array(32), [])

  const setup = useCallback(async () => {
    if (ctxRef.current) return ctxRef.current
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext
    if (!AudioContextCtor) throw new Error('Web Audio API unavailable in this browser')
    const ctx = new AudioContextCtor()
    const master = ctx.createGain()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 64
    master.gain.value = 0.82
    master.connect(analyser)
    analyser.connect(ctx.destination)
    ctxRef.current = ctx
    masterRef.current = master
    analyserRef.current = analyser
    noiseRef.current = createNoiseBuffer(ctx)
    return ctx
  }, [])

  const triggerKick = useCallback((time) => {
    const ctx = ctxRef.current
    const preset = resolveInstrumentPreset('kick', instrumentPresetIds.kick)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const click = ctx.createOscillator()
    const clickGain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(160 * preset.body, time)
    osc.frequency.exponentialRampToValueAtTime(42, time + preset.decay)
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(0.95 * mix.kick, time + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + preset.decay)
    click.type = 'triangle'
    click.frequency.setValueAtTime(1200 + 500 * preset.click, time)
    clickGain.gain.setValueAtTime(0.0001, time)
    clickGain.gain.exponentialRampToValueAtTime(0.18 * preset.click * mix.kick, time + 0.001)
    clickGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.03)
    osc.connect(gain).connect(masterRef.current)
    click.connect(clickGain).connect(masterRef.current)
    osc.start(time); osc.stop(time + Math.max(0.12, preset.decay + 0.04))
    click.start(time); click.stop(time + 0.04)
  }, [instrumentPresetIds.kick, mix.kick])

  const triggerSnare = useCallback((time) => {
    const ctx = ctxRef.current
    const preset = resolveInstrumentPreset('snare', instrumentPresetIds.snare)
    const noise = ctx.createBufferSource()
    noise.buffer = noiseRef.current
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 1800
    const gain = ctx.createGain()
    const toneOsc = ctx.createOscillator()
    const toneGain = ctx.createGain()
    toneOsc.type = 'triangle'
    toneOsc.frequency.setValueAtTime(preset.tone, time)
    toneGain.gain.setValueAtTime(0.0001, time)
    toneGain.gain.exponentialRampToValueAtTime(0.24 * mix.snare, time + 0.005)
    toneGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.08)
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(0.5 * preset.noise * mix.snare, time + 0.003)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + preset.decay)
    noise.connect(filter).connect(gain).connect(masterRef.current)
    toneOsc.connect(toneGain).connect(masterRef.current)
    noise.start(time); noise.stop(time + preset.decay)
    toneOsc.start(time); toneOsc.stop(time + 0.09)
  }, [instrumentPresetIds.snare, mix.snare])

  const triggerHat = useCallback((time) => {
    const ctx = ctxRef.current
    const preset = resolveInstrumentPreset('hat', instrumentPresetIds.hat)
    const noise = ctx.createBufferSource()
    noise.buffer = noiseRef.current
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 6000 * preset.brightness
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(0.2 * mix.hat, time + 0.001)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + preset.decay)
    noise.connect(filter).connect(gain).connect(masterRef.current)
    noise.start(time); noise.stop(time + preset.decay + 0.02)
  }, [instrumentPresetIds.hat, mix.hat])

  const triggerPerc = useCallback((time) => {
    const ctx = ctxRef.current
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(440 + Math.random() * 300, time)
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(0.1 * mix.perc, time + 0.002)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.05)
    osc.connect(gain).connect(masterRef.current)
    osc.start(time); osc.stop(time + 0.06)
  }, [mix.perc])

  const triggerBass = useCallback((time, note) => {
    const ctx = ctxRef.current
    const preset = resolveInstrumentPreset('bass', instrumentPresetIds.bass)
    const osc = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    osc.type = preset.wave
    osc.frequency.setValueAtTime(noteToFreq(note), time)
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(260 + energy * 420, time)
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(0.25 * mix.bass, time + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.22)
    osc.connect(filter).connect(gain).connect(masterRef.current)
    osc.start(time); osc.stop(time + 0.25)
  }, [energy, instrumentPresetIds.bass, mix.bass])

  const triggerSynth = useCallback((time, note) => {
    const ctx = ctxRef.current
    const preset = resolveInstrumentPreset('synth', instrumentPresetIds.synth)
    const oscA = ctx.createOscillator()
    const oscB = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    oscA.type = preset.wave
    oscB.type = preset.wave
    const freq = noteToFreq(note)
    oscA.frequency.setValueAtTime(freq, time)
    oscB.frequency.setValueAtTime(freq * Math.pow(2, preset.detune / 1200), time)
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(900 + energy * 2200, time)
    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(0.12 * mix.synth, time + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + preset.release)
    oscA.connect(filter)
    oscB.connect(filter)
    filter.connect(gain).connect(masterRef.current)
    oscA.start(time); oscB.start(time)
    oscA.stop(time + preset.release + 0.04)
    oscB.stop(time + preset.release + 0.04)
  }, [energy, instrumentPresetIds.synth, mix.synth])

  const scheduleStep = useCallback((step, time) => {
    if (pattern.kick[step]) triggerKick(time)
    if (pattern.snare[step]) triggerSnare(time)
    if (pattern.hat[step]) triggerHat(time)
    if (pattern.perc[step]) triggerPerc(time)
    if (pattern.bass[step]) triggerBass(time, notes[step] || 'C2')
    if (pattern.synth[step]) triggerSynth(time, notes[step] || 'C3')
  }, [notes, pattern, triggerBass, triggerHat, triggerKick, triggerPerc, triggerSnare, triggerSynth])

  const scheduler = useCallback(() => {
    const ctx = ctxRef.current
    if (!ctx || !transportRef.current) return
    const secondsPerBeat = 60 / bpm
    const stepDuration = secondsPerBeat / 4
    while (nextNoteTimeRef.current < ctx.currentTime + 0.12) {
      const step = stepRef.current
      scheduleStep(step, nextNoteTimeRef.current)
      setCurrentStep(step)
      const swingOffset = step % 2 === 1 ? stepDuration * swing : 0
      nextNoteTimeRef.current += stepDuration + swingOffset
      stepRef.current = (stepRef.current + 1) % STEPS
    }
  }, [bpm, scheduleStep, swing])

  const start = useCallback(async () => {
    const ctx = await setup()
    await ctx.resume()
    transportRef.current = true
    setIsPlaying(true)
    setStatus('live')
    nextNoteTimeRef.current = ctx.currentTime + 0.05
    stepRef.current = currentStep
    if (intervalRef.current) window.clearInterval(intervalRef.current)
    intervalRef.current = window.setInterval(scheduler, 25)
  }, [currentStep, scheduler, setup])

  const stop = useCallback(() => {
    transportRef.current = false
    setIsPlaying(false)
    setStatus('stopped')
    if (intervalRef.current) window.clearInterval(intervalRef.current)
    intervalRef.current = null
  }, [])

  const toggleTransport = useCallback(() => {
    if (transportRef.current) stop()
    else start().catch((error) => setStatus(error.message))
  }, [start, stop])

  useEffect(() => () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current)
    if (ctxRef.current) ctxRef.current.close().catch(() => {})
  }, [])

  const readMeter = useCallback(() => {
    if (!analyserRef.current) return meterData
    analyserRef.current.getByteFrequencyData(meterData)
    return meterData
  }, [meterData])

  return { isPlaying, currentStep, toggleTransport, start, stop, readMeter, status }
}

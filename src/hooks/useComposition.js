import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GENRE_PRESETS, LANES, STEPS, clamp, createStateFromGenre, deriveArc, generateNoteLane, generatePattern, mutatePattern } from '@/engine/musicEngine'

const STORAGE_KEY = 'cesira-v2-session'

export function useComposition() {
  const boot = useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch {}
    return createStateFromGenre('techno')
  }, [])

  const [genre, setGenre] = useState(boot.genre)
  const [bpm, setBpm] = useState(boot.bpm)
  const [swing, setSwing] = useState(boot.swing)
  const [energy, setEnergy] = useState(boot.energy)
  const [density, setDensity] = useState(boot.density)
  const [mix, setMix] = useState(boot.mix)
  const [pattern, setPattern] = useState(boot.pattern)
  const [notes, setNotes] = useState(boot.notes)
  const [instrumentPresetIds, setInstrumentPresetIds] = useState(boot.instrumentPresetIds)
  const [autopilot, setAutopilot] = useState(false)
  const [view, setView] = useState('studio')
  const historyRef = useRef([])

  useEffect(() => {
    const payload = { genre, bpm, swing, energy, density, mix, pattern, notes, instrumentPresetIds }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }, [genre, bpm, swing, energy, density, mix, pattern, notes, instrumentPresetIds])

  const pushHistory = useCallback(() => {
    historyRef.current.push({ pattern: structuredClone(pattern), notes: [...notes] })
    if (historyRef.current.length > 40) historyRef.current.shift()
  }, [pattern, notes])

  const undo = useCallback(() => {
    const last = historyRef.current.pop()
    if (!last) return
    setPattern(last.pattern)
    setNotes(last.notes)
  }, [])

  const loadGenre = useCallback((genreKey) => {
    const preset = GENRE_PRESETS[genreKey]
    if (!preset) return
    const next = createStateFromGenre(genreKey)
    setGenre(genreKey)
    setBpm(next.bpm)
    setSwing(next.swing)
    setEnergy(next.energy)
    setDensity(next.density)
    setMix(next.mix)
    setPattern(next.pattern)
    setNotes(next.notes)
    setInstrumentPresetIds(next.instrumentPresetIds)
  }, [])

  const toggleStep = useCallback((lane, index) => {
    pushHistory()
    setPattern((current) => ({
      ...current,
      [lane]: current[lane].map((value, i) => (i === index ? (value ? 0 : 1) : value)),
    }))
  }, [pushHistory])

  const randomize = useCallback(() => {
    pushHistory()
    setPattern(generatePattern(genre, { density }))
    setNotes(generateNoteLane(genre))
  }, [density, genre, pushHistory])

  const mutate = useCallback((amount = 0.18) => {
    pushHistory()
    setPattern((current) => mutatePattern(current, amount))
  }, [pushHistory])

  const setMixValue = useCallback((lane, value) => {
    setMix((current) => ({ ...current, [lane]: clamp(value, 0, 1) }))
  }, [])

  const setInstrumentPreset = useCallback((lane, presetId) => {
    setInstrumentPresetIds((current) => ({ ...current, [lane]: presetId }))
  }, [])

  const applyScene = useCallback((scene) => {
    if (scene === 'drop') setEnergy(0.88)
    if (scene === 'break') setEnergy(0.34)
    if (scene === 'build') setEnergy(0.68)
    if (scene === 'groove') setEnergy(0.56)
    if (scene === 'tension') setEnergy(0.76)
    if (scene === 'fill') mutate(0.32)
  }, [mutate])

  useEffect(() => {
    if (!autopilot) return
    const id = window.setInterval(() => {
      setEnergy((value) => {
        const delta = (Math.random() - 0.5) * 0.16
        return clamp(value + delta, 0.24, 0.96)
      })
      setDensity((value) => clamp(value + (Math.random() - 0.5) * 0.12, 0.18, 0.95))
      setPattern((current) => mutatePattern(current, 0.08))
    }, 6000)
    return () => window.clearInterval(id)
  }, [autopilot])

  const arc = deriveArc(energy)
  const stats = {
    activeSteps: LANES.reduce((acc, lane) => acc + pattern[lane].reduce((a, b) => a + b, 0), 0),
    arc,
    lanes: LANES.length,
    steps: STEPS,
  }

  return {
    genre, setGenre: loadGenre,
    bpm, setBpm,
    swing, setSwing,
    energy, setEnergy,
    density, setDensity,
    mix, setMixValue,
    pattern, toggleStep,
    notes,
    randomize,
    mutate,
    instrumentPresetIds,
    setInstrumentPreset,
    view, setView,
    autopilot, setAutopilot,
    undo,
    applyScene,
    stats,
  }
}

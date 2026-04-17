import React from 'react'
import { INSTRUMENT_PRESETS, LANES, STEPS } from '@/engine/musicEngine'
import { palette } from './ui'

export function ShellButton({ active = false, tone = 'default', children, ...props }) {
  const tones = {
    default: active ? palette.accent : palette.panel2,
    success: active ? palette.accent2 : palette.panel2,
    danger: active ? palette.danger : palette.panel2,
    warn: active ? palette.warning : palette.panel2,
  }
  return (
    <button
      {...props}
      style={{
        background: tones[tone],
        color: '#fff',
        border: `1px solid ${active ? 'transparent' : palette.line}`,
        borderRadius: 14,
        padding: '10px 14px',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

export function Fader({ label, value, min = 0, max = 1, step = 0.01, onChange }) {
  return (
    <label style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: palette.muted }}>
        <span>{label}</span>
        <strong style={{ color: palette.text }}>{typeof value === 'number' ? value.toFixed(2) : value}</strong>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  )
}

export function VuBar({ values }) {
  const bars = Array.from(values.slice(0, 18))
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'end', height: 62 }}>
      {bars.map((value, index) => (
        <div key={index} style={{ width: 8, height: `${Math.max(8, (value / 255) * 62)}px`, background: value > 180 ? palette.warning : value > 100 ? palette.accent2 : palette.accent, borderRadius: 999 }} />
      ))}
    </div>
  )
}

export function NavPager({ view, setView }) {
  const items = [
    ['studio', 'Studio'],
    ['perform', 'Perform'],
    ['song', 'Song'],
  ]
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {items.map(([id, label]) => (
        <ShellButton key={id} active={view === id} onClick={() => setView(id)}>{label}</ShellButton>
      ))}
    </div>
  )
}

export function PresetSelect({ label, value, options, onChange }) {
  return (
    <label style={{ display: 'grid', gap: 8 }}>
      <span style={{ fontSize: 13, color: palette.muted }}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ background: palette.panel2, color: palette.text, border: `1px solid ${palette.line}`, borderRadius: 12, padding: '10px 12px' }}>
        {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
    </label>
  )
}

export function StepGrid({ pattern, currentStep, onToggle }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {LANES.map((lane) => (
        <div key={lane} style={{ display: 'grid', gridTemplateColumns: '80px repeat(16, minmax(18px, 1fr))', gap: 6, alignItems: 'center' }}>
          <div style={{ color: palette.muted, textTransform: 'capitalize', fontWeight: 700 }}>{lane}</div>
          {Array.from({ length: STEPS }).map((_, index) => {
            const active = Boolean(pattern[lane][index])
            const playing = currentStep === index
            return (
              <button
                key={index}
                onClick={() => onToggle(lane, index)}
                style={{
                  height: 28,
                  borderRadius: 8,
                  border: `1px solid ${playing ? palette.warning : palette.line}`,
                  background: active ? (playing ? palette.warning : palette.accent) : (playing ? '#2f394d' : palette.panel2),
                  cursor: 'pointer',
                }}
                aria-label={`${lane} step ${index + 1}`}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}

export function InstrumentPresetCluster({ values, onChange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
      {Object.entries(INSTRUMENT_PRESETS).map(([lane, options]) => (
        <PresetSelect key={lane} label={`${lane} preset`} value={values[lane]} options={options} onChange={(presetId) => onChange(lane, presetId)} />
      ))}
    </div>
  )
}

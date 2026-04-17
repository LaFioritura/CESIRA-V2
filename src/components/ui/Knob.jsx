export default function Knob({ label, value, onChange, min = 0, max = 1, step = 0.01 }) {
  return (
    <label className="knob">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <strong>{Math.round(value * 100)}</strong>
    </label>
  );
}

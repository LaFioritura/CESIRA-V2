import { GENRES, BASS_PRESETS, SYNTH_PRESETS, KIT_PRESETS } from '../presets/genrePresets';
import { STEPS } from '../sequencer/constants';
import { midiToFrequency } from './note';

function createBuffer(durationSeconds, sampleRate = 44100) {
  return { left: new Float32Array(durationSeconds * sampleRate), right: new Float32Array(durationSeconds * sampleRate), sampleRate };
}

function mixSample(buffer, index, valueL, valueR = valueL) {
  if (index < 0 || index >= buffer.left.length) return;
  buffer.left[index] += valueL;
  buffer.right[index] += valueR;
}

function writeKick(buffer, start, duration, velocity, preset) {
  const end = Math.min(buffer.left.length, start + duration * buffer.sampleRate);
  for (let i = start; i < end; i += 1) {
    const t = (i - start) / buffer.sampleRate;
    const env = Math.exp(-t * (8 / preset.kickDecay));
    const freq = 90 * Math.exp(-t * 18);
    const sample = Math.sin(2 * Math.PI * freq * t) * env * velocity * preset.kickPunch * 0.7;
    mixSample(buffer, i, sample, sample);
  }
}

function writeNoiseBurst(buffer, start, duration, velocity, brightness) {
  const end = Math.min(buffer.left.length, start + duration * buffer.sampleRate);
  for (let i = start; i < end; i += 1) {
    const t = (i - start) / buffer.sampleRate;
    const env = Math.exp(-t * brightness);
    const noise = (Math.random() * 2 - 1) * env * velocity * 0.35;
    mixSample(buffer, i, noise, noise);
  }
}

function writeTone(buffer, start, duration, frequency, velocity, waveform = 'sine', stereo = 0.02) {
  const end = Math.min(buffer.left.length, start + duration * buffer.sampleRate);
  for (let i = start; i < end; i += 1) {
    const t = (i - start) / buffer.sampleRate;
    const phase = 2 * Math.PI * frequency * t;
    let sample = Math.sin(phase);
    if (waveform === 'triangle') sample = 2 * Math.asin(Math.sin(phase)) / Math.PI;
    if (waveform === 'square') sample = Math.sign(Math.sin(phase));
    if (waveform === 'sawtooth') sample = 2 * (t * frequency - Math.floor(0.5 + t * frequency));
    const env = Math.exp(-t * 3.2) * velocity * 0.28;
    mixSample(buffer, i, sample * env * (1 - stereo), sample * env * (1 + stereo));
  }
}

function normalize(buffer) {
  let peak = 0;
  for (let i = 0; i < buffer.left.length; i += 1) {
    peak = Math.max(peak, Math.abs(buffer.left[i]), Math.abs(buffer.right[i]));
  }
  const gain = peak > 0.98 ? 0.98 / peak : 1;
  for (let i = 0; i < buffer.left.length; i += 1) {
    buffer.left[i] *= gain;
    buffer.right[i] *= gain;
  }
}

function interleaveToWav(buffer) {
  const channels = 2;
  const sampleCount = buffer.left.length;
  const bytesPerSample = 2;
  const byteRate = buffer.sampleRate * channels * bytesPerSample;
  const blockAlign = channels * bytesPerSample;
  const dataSize = sampleCount * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset, str) => { for (let i = 0; i < str.length; i += 1) view.setUint8(offset + i, str.charCodeAt(i)); };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < sampleCount; i += 1) {
    const l = Math.max(-1, Math.min(1, buffer.left[i]));
    const r = Math.max(-1, Math.min(1, buffer.right[i]));
    view.setInt16(offset, l < 0 ? l * 0x8000 : l * 0x7fff, true);
    view.setInt16(offset + 2, r < 0 ? r * 0x8000 : r * 0x7fff, true);
    offset += 4;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

export function exportLoopWav(session, bars = 2) {
  const genre = GENRES[session.genreKey];
  const bassPreset = BASS_PRESETS[session.sound.bassPreset];
  const synthPreset = SYNTH_PRESETS[session.sound.synthPreset];
  const kit = KIT_PRESETS[session.sound.kitPreset];
  const secondsPerBeat = 60 / session.bpm;
  const stepDuration = secondsPerBeat / 4;
  const totalSteps = STEPS * bars;
  const buffer = createBuffer(stepDuration * totalSteps + 1.5);

  for (let bar = 0; bar < bars; bar += 1) {
    for (let step = 0; step < STEPS; step += 1) {
      const stepIndex = bar * STEPS + step;
      const start = Math.floor(stepIndex * stepDuration * buffer.sampleRate);
      const time = stepIndex * stepDuration;

      const kick = session.patterns.kick[step];
      if (kick.active) writeKick(buffer, start, 0.5, kick.velocity * session.mixer.kick.volume, kit);

      const snare = session.patterns.snare[step];
      if (snare.active) writeNoiseBurst(buffer, start, 0.22, snare.velocity * session.mixer.snare.volume * kit.snareNoise, 24);

      const hat = session.patterns.hat[step];
      if (hat.active) writeNoiseBurst(buffer, start, 0.08, hat.velocity * session.mixer.hat.volume * 0.45, 60);

      const bass = session.patterns.bass[step];
      if (bass.active && bass.note != null) {
        writeTone(buffer, start, stepDuration * bass.length, midiToFrequency(bass.note), bass.velocity * session.mixer.bass.volume, bassPreset.waveform, 0.01);
      }

      const synth = session.patterns.synth[step];
      if (synth.active && synth.note != null) {
        writeTone(buffer, start, stepDuration * synth.length * 1.2, midiToFrequency(synth.note), synth.velocity * session.mixer.synth.volume * 0.8, synthPreset.waveform, 0.06);
      }
    }
  }

  normalize(buffer);
  return interleaveToWav(buffer);
}

export function exportMidi(session) {
  const lines = [];
  for (const lane of ['bass', 'synth']) {
    session.patterns[lane].forEach((step, index) => {
      if (!step.active || step.note == null) return;
      lines.push(`${lane},${index},${step.note},${step.length},${step.velocity.toFixed(2)}`);
    });
  }
  return new Blob([`lane,step,note,length,velocity\n${lines.join('\n')}`], { type: 'text/csv' });
}
